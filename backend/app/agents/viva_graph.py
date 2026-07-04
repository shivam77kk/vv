"""Feature 3: Glass-Box Viva — LangGraph agent with live trace streaming."""
import asyncio
import json
import time
from datetime import datetime, timezone
from typing import List, Optional, Dict

from app.core.gemini import generate_json, generate_text
from app.core.config import settings
from app.rag.retrieve import retrieve_chunks
from app.db.client import get_collection


async def start_viva_session(topic: str, user_id: str, syllabus_doc_id: Optional[str] = None) -> dict:
    sessions_col = await get_collection("viva_sessions")
    now = datetime.now(timezone.utc)

    session = {
        "topic": topic,
        "user_id": user_id,
        "syllabus_doc_id": syllabus_doc_id,
        "status": "active",
        "difficulty": 1,
        "history": [],
        "trace_log": [],
        "score": 0,
        "questions_asked": 0,
        "created_at": now,
        "updated_at": now,
    }

    result = await sessions_col.insert_one(session)
    session_id = str(result.inserted_id)

    context = await retrieve_chunks(topic, user_id=user_id, top_k=3)
    context_text = "\n".join([c["text"] for c in context]) if context else ""

    first_question = await generate_examiner_question(topic, [], 1, context_text)

    await sessions_col.update_one(
        {"_id": result.inserted_id},
        {
            "$push": {
                "history": {"role": "examiner", "content": first_question["question"]},
                "trace_log": first_question["trace"],
            },
            "$inc": {"questions_asked": 1},
        }
    )

    return {
        "session_id": session_id,
        "topic": topic,
        "question": first_question["question"],
        "trace": first_question["trace"],
    }


async def generate_examiner_question(
    topic: str,
    history: List[dict],
    difficulty: int,
    context: str,
) -> dict:
    start_time = time.time()

    history_text = ""
    for h in history[-6:]:
        history_text += f"\n{h['role'].upper()}: {h['content']}"

    prompt = f"""You are an expert oral examiner conducting a viva voce examination.

Topic: {topic}
Difficulty Level: {difficulty}/5
Conversation History: {history_text}

Context (from study materials):
{context[:1500]}

Generate a thoughtful, probing question that:
- Tests deeper understanding, not just recall
- Builds on previous answers if available
- Matches the difficulty level
- Is grounded in the context when possible

Return JSON:
{{
    "question": "Your question here",
    "expected_key_points": ["key point 1", "key point 2"],
    "reasoning": "Why you chose this specific question"
}}"""

    try:
        result = await generate_json(prompt=prompt, model=settings.MODEL_CHAT, temperature=0.6)
        question = result.get("question", f"Can you explain {topic}?")
        reasoning = result.get("reasoning", "Standard topic assessment question")
    except Exception as e:
        question = "I'm having trouble connecting to my AI brain due to rate limits. Please try again in a few seconds."
        reasoning = f"API Error: {str(e)}"
        result = {}

    latency = int((time.time() - start_time) * 1000)

    trace = {
        "node_name": "examiner_agent",
        "reasoning": reasoning,
        "latency_ms": latency,
        "tokens_used": len(prompt.split()) + len(question.split()),
        "confidence": 0.85,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "decision": f"Generated difficulty-{difficulty} question",
    }

    return {"question": question, "trace": trace, "expected_key_points": result.get("expected_key_points", [])}


async def evaluate_answer(
    topic: str,
    question: str,
    answer: str,
    history: List[dict],
    difficulty: int,
    context: str,
) -> dict:
    start_time = time.time()

    prompt = f"""You are evaluating a student's answer in an oral examination.

Topic: {topic}
Question: {question}
Student's Answer: {answer}
Difficulty Level: {difficulty}/5

Context:
{context[:1000]}

Evaluate the answer and decide what to do next.

Return JSON:
{{
    "score": 0-100,
    "feedback": "Brief constructive feedback",
    "understanding_level": "strong|moderate|weak",
    "next_action": "dig_deeper|new_subtopic|end",
    "reasoning": "Why you evaluated this way and chose this next action",
    "confidence": 0.0-1.0
}}"""

    try:
        result = await generate_json(prompt=prompt, model=settings.MODEL_CHAT, temperature=0.3)
    except Exception as e:
        result = {
            "score": 50,
            "feedback": "I couldn't evaluate your answer properly due to AI rate limits. Let's move on for now.",
            "understanding_level": "moderate",
            "next_action": "new_subtopic",
            "reasoning": f"API Error: {str(e)}",
            "confidence": 0.0
        }

    latency = int((time.time() - start_time) * 1000)

    trace = {
        "node_name": "answer_evaluator_agent",
        "reasoning": result.get("reasoning", "Evaluated student response"),
        "latency_ms": latency,
        "tokens_used": len(prompt.split()) + len(str(result).split()),
        "confidence": result.get("confidence", 0.7),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "decision": f"Score: {result.get('score', 60)}, Next: {result.get('next_action', 'new_subtopic')}",
    }

    return {
        "evaluation": result,
        "trace": trace,
    }


async def process_viva_answer(session_id: str, answer_text: str) -> dict:
    from bson import ObjectId
    sessions_col = await get_collection("viva_sessions")
    session = await sessions_col.find_one({"_id": ObjectId(session_id)})

    if not session:
        return {"error": "Session not found"}

    topic = session["topic"]
    history = session.get("history", [])
    difficulty = session.get("difficulty", 1)
    questions_asked = session.get("questions_asked", 0)

    context = await retrieve_chunks(topic, user_id=session["user_id"], top_k=3)
    context_text = "\n".join([c["text"] for c in context]) if context else ""

    last_question = ""
    for h in reversed(history):
        if h["role"] == "examiner":
            last_question = h["content"]
            break

    evaluation = await evaluate_answer(topic, last_question, answer_text, history, difficulty, context_text)
    eval_result = evaluation["evaluation"]

    history.append({"role": "student", "content": answer_text})

    result = {
        "evaluation": eval_result,
        "traces": [evaluation["trace"]],
    }

    next_action = eval_result.get("next_action", "new_subtopic")
    should_end = questions_asked >= 5 or next_action == "end"

    if should_end:
        all_scores = [eval_result.get("score", 60)]
        for t in session.get("trace_log", []):
            if t.get("node_name") == "answer_evaluator_agent" and "Score:" in t.get("decision", ""):
                try:
                    s = int(t["decision"].split("Score: ")[1].split(",")[0])
                    all_scores.append(s)
                except (IndexError, ValueError):
                    pass

        avg_score = sum(all_scores) / len(all_scores)

        end_trace = {
            "node_name": "session_end",
            "reasoning": f"Session complete after {questions_asked} questions. Average score: {avg_score:.0f}",
            "latency_ms": 0,
            "tokens_used": 0,
            "confidence": 0.95,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "end_session",
        }

        await sessions_col.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": "completed",
                    "score": avg_score,
                    "history": history,
                    "updated_at": datetime.now(timezone.utc),
                },
                "$push": {
                    "trace_log": {
                        "$each": [evaluation["trace"], end_trace]
                    }
                },
            }
        )

        result["type"] = "end"
        result["score"] = avg_score
        result["summary"] = f"Viva completed. {questions_asked} questions asked. Average score: {avg_score:.0f}/100"
        result["traces"].append(end_trace)
    else:
        new_difficulty = difficulty
        if eval_result.get("understanding_level") == "strong":
            new_difficulty = min(5, difficulty + 1)
        elif eval_result.get("understanding_level") == "weak":
            new_difficulty = max(1, difficulty - 1)

        next_q = await generate_examiner_question(topic, history, new_difficulty, context_text)
        history.append({"role": "examiner", "content": next_q["question"]})

        await sessions_col.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "history": history,
                    "difficulty": new_difficulty,
                    "updated_at": datetime.now(timezone.utc),
                },
                "$inc": {"questions_asked": 1},
                "$push": {
                    "trace_log": {
                        "$each": [evaluation["trace"], next_q["trace"]]
                    }
                },
            }
        )

        result["type"] = "question"
        result["question"] = next_q["question"]
        result["traces"].append(next_q["trace"])

    return result


async def get_viva_report(session_id: str) -> dict:
    from bson import ObjectId
    sessions_col = await get_collection("viva_sessions")
    session = await sessions_col.find_one({"_id": ObjectId(session_id)})

    if not session:
        return {"error": "Session not found"}

    duration = 0
    if session.get("created_at") and session.get("updated_at"):
        if isinstance(session["created_at"], datetime) and isinstance(session["updated_at"], datetime):
            duration = int((session["updated_at"] - session["created_at"]).total_seconds())

    return {
        "session_id": session_id,
        "topic": session["topic"],
        "transcript": session.get("history", []),
        "trace_history": session.get("trace_log", []),
        "score": session.get("score", 0),
        "summary": f"Viva on '{session['topic']}' - Score: {session.get('score', 0):.0f}/100",
        "questions_asked": session.get("questions_asked", 0),
        "duration_seconds": duration,
        "status": session.get("status", "unknown"),
    }
