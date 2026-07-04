"""Feature 1: Living Trust Graph — LangGraph multi-agent pipeline."""
import asyncio
import json
import random
import time
from datetime import datetime, timezone
from typing import TypedDict, List, Optional, Annotated

from app.core.gemini import generate_json, generate_text
from app.core.config import settings
from app.rag.retrieve import retrieve_chunks
from app.mcp_tools.search_verify_server import search_verify
from app.db.client import get_collection


class ForgeState(TypedDict):
    query: str
    user_id: str
    syllabus_doc_id: Optional[str]
    retrieved_chunks: List[dict]
    draft_nodes: List[dict]
    verified_nodes: List[dict]
    trust_scores: dict
    graph_json: dict
    needs_review: List[str]
    graph_id: str


async def retrieve_context(state: ForgeState) -> ForgeState:
    chunks = await retrieve_chunks(
        query=state["query"],
        user_id=state["user_id"],
        top_k=5,
    )
    state["retrieved_chunks"] = chunks
    return state


async def planner_agent(state: ForgeState) -> ForgeState:
    context = "\n".join([c["text"] for c in state["retrieved_chunks"]]) if state["retrieved_chunks"] else "No specific context available."

    prompt = f"""You are a knowledge graph planner. Break down the topic into 5-8 sub-concepts that form a coherent learning path.

Topic: {state["query"]}

Available Context:
{context[:2000]}

Return a JSON array of concept nodes:
[
  {{
    "id": "node_1",
    "label": "Concept Name",
    "dependencies": ["node_ids this depends on"]
  }}
]

Order from foundational to advanced. Each node should be a distinct, meaningful sub-concept."""

    try:
        nodes = await generate_json(prompt=prompt, temperature=0.4)
        if isinstance(nodes, dict) and "nodes" in nodes:
            nodes = nodes["nodes"]
        if not isinstance(nodes, list):
            nodes = [{"id": "node_1", "label": state["query"], "dependencies": []}]

        for i, node in enumerate(nodes):
            if "id" not in node:
                node["id"] = f"node_{i+1}"
            if "label" not in node:
                node["label"] = f"Concept {i+1}"
            if "dependencies" not in node:
                node["dependencies"] = []

        state["draft_nodes"] = nodes
    except Exception as e:
        state["draft_nodes"] = [{"id": "node_1", "label": "Rate Limit Encountered", "dependencies": []}]
    return state


async def explain_single_node(node: dict, topic: str, context: str) -> dict:
    prompt = f"""You are an expert educator. Provide a clear, grounded explanation for this concept.

Topic: {topic}
Concept: {node["label"]}

Available Context:
{context[:1500]}

Return JSON:
{{
    "explanation": "A clear 2-3 sentence explanation grounded in the context provided",
    "analogy": "A relatable analogy to help understand this concept",
    "key_points": ["key point 1", "key point 2"],
    "sources_used": ["which parts of the context you referenced"]
}}"""

    try:
        result = await generate_json(prompt=prompt, temperature=0.5)
        node["explanation"] = result.get("explanation", f"Explanation for {node['label']}")
        node["analogy"] = result.get("analogy", f"Think of {node['label']} as...")
        node["key_points"] = result.get("key_points", [])
        node["sources_used"] = result.get("sources_used", [])
    except Exception as e:
        node["explanation"] = f"Explanation generation failed due to AI rate limits. Please check back later."
        node["analogy"] = "Rate limit."
        node["key_points"] = []
        node["sources_used"] = []
    return node


async def explainer_agent(state: ForgeState) -> ForgeState:
    context = "\n".join([c["text"] for c in state["retrieved_chunks"]]) if state["retrieved_chunks"] else ""

    tasks = [explain_single_node(node.copy(), state["query"], context) for node in state["draft_nodes"]]

    batch_size = 3
    explained = []
    for i in range(0, len(tasks), batch_size):
        batch = tasks[i:i + batch_size]
        results = await asyncio.gather(*batch, return_exceptions=True)
        for r in results:
            if isinstance(r, Exception):
                explained.append(state["draft_nodes"][len(explained)] if len(explained) < len(state["draft_nodes"]) else {})
            else:
                explained.append(r)

    state["draft_nodes"] = explained
    return state


async def verifier_agent(state: ForgeState) -> ForgeState:
    verified = []
    scores = {}
    needs_review = []

    for node in state["draft_nodes"]:
        try:
            verification = await search_verify(
                claim=node.get("explanation", ""),
                context="\n".join([c["text"] for c in state["retrieved_chunks"]])
            )

            score = int(verification.get("confidence", 0.7) * 100)
            node["trust_score"] = score
            node["verification"] = verification
            scores[node["id"]] = score

            if score < 60:
                node["status"] = "pending_review"
                needs_review.append(node["id"])
            else:
                node["status"] = "verified"

            verified.append(node)
        except Exception as e:
            node["trust_score"] = 50
            node["verification"] = {"confidence": 0.5, "reasoning": "Verification skipped due to rate limits."}
            node["status"] = "pending_review"
            verified.append(node)

    state["verified_nodes"] = verified
    state["trust_scores"] = scores
    state["needs_review"] = needs_review
    return state


async def graph_builder(state: ForgeState) -> ForgeState:
    nodes = []
    edges = []

    for i, node in enumerate(state["verified_nodes"]):
        angle = (2 * 3.14159 * i) / max(len(state["verified_nodes"]), 1)
        radius = 3.0
        nodes.append({
            "id": node["id"],
            "label": node["label"],
            "explanation": node.get("explanation", ""),
            "analogy": node.get("analogy", ""),
            "trust_score": node.get("trust_score", 70),
            "status": node.get("status", "verified"),
            "sources": node.get("sources_used", []),
            "key_points": node.get("key_points", []),
            "x": radius * round(float(str(round(3.14159 * i, 2))), 2),
            "y": radius * round(float(str(round(2.71828 * i, 2))), 2),
            "z": round(random.uniform(-1, 1), 2),
        })

        deps = node.get("dependencies", [])
        for dep in deps:
            dep_exists = any(n["id"] == dep for n in state["verified_nodes"])
            if dep_exists:
                edges.append({
                    "source": dep,
                    "target": node["id"],
                    "label": "prerequisite",
                })

    if not edges and len(nodes) > 1:
        for i in range(1, len(nodes)):
            edges.append({
                "source": nodes[i-1]["id"],
                "target": nodes[i]["id"],
                "label": "next",
            })

    state["graph_json"] = {
        "nodes": nodes,
        "edges": edges,
        "topic": state["query"],
    }
    return state


async def persist_graph(state: ForgeState) -> ForgeState:
    graphs_col = await get_collection("concept_graphs")
    now = datetime.now(timezone.utc)

    await graphs_col.update_one(
        {"_id": state["graph_id"]},
        {
            "$set": {
                "topic": state["query"],
                "user_id": state["user_id"],
                "nodes": state["graph_json"]["nodes"],
                "edges": state["graph_json"]["edges"],
                "trust_scores": state["trust_scores"],
                "needs_review": state["needs_review"],
                "status": "completed",
                "updated_at": now,
            }
        },
        upsert=True,
    )
    return state


async def run_forge_pipeline(
    topic: str,
    user_id: str,
    graph_id: str,
    syllabus_doc_id: Optional[str] = None,
) -> dict:
    state: ForgeState = {
        "query": topic,
        "user_id": user_id,
        "syllabus_doc_id": syllabus_doc_id,
        "retrieved_chunks": [],
        "draft_nodes": [],
        "verified_nodes": [],
        "trust_scores": {},
        "graph_json": {},
        "needs_review": [],
        "graph_id": graph_id,
    }

    graphs_col = await get_collection("concept_graphs")
    await graphs_col.update_one(
        {"_id": graph_id},
        {"$set": {"status": "processing", "topic": topic, "user_id": user_id}},
        upsert=True,
    )

    try:
        state = await retrieve_context(state)
        state = await planner_agent(state)
        state = await explainer_agent(state)
        state = await verifier_agent(state)
        state = await graph_builder(state)
        state = await persist_graph(state)
        return state["graph_json"]
    except Exception as e:
        await graphs_col.update_one(
            {"_id": graph_id},
            {"$set": {"status": "error", "error": str(e)}},
        )
        raise
