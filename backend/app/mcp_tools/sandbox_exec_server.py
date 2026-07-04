"""MCP Tool Server: sandbox_exec — run skills against test queries in isolation."""
from typing import List, Dict
from app.core.gemini import generate_text, generate_json
from app.core.config import settings


async def sandbox_execute(
    skill_instructions: str,
    test_queries: List[str],
) -> Dict:
    results = []

    for query in test_queries:
        prompt = f"""You are executing a learning skill in a sandboxed environment.
You have NO access to real user data, grades, or personal information.

SKILL INSTRUCTIONS:
{skill_instructions}

USER QUERY:
{query}

Respond naturally as if you are the skill being tested. Keep your response helpful and educational."""

        try:
            response = await generate_text(
                prompt=prompt,
                model=settings.MODEL_LITE,
                system_instruction="You are a sandboxed skill executor. Never reference or attempt to access real user data. Respond only based on the skill instructions provided.",
                temperature=0.5,
                use_cache=False,
            )
            results.append({
                "query": query,
                "response": response,
                "status": "success",
                "error": None,
            })
        except Exception as e:
            results.append({
                "query": query,
                "response": None,
                "status": "error",
                "error": str(e),
            })

    success_count = sum(1 for r in results if r["status"] == "success")
    return {
        "total_tests": len(test_queries),
        "passed": success_count,
        "failed": len(test_queries) - success_count,
        "results": results,
        "overall_status": "pass" if success_count == len(test_queries) else "partial" if success_count > 0 else "fail",
    }


async def generate_test_queries(skill_name: str, skill_description: str) -> List[str]:
    prompt = f"""Generate 3-5 diverse test queries that a student might ask which should trigger the following learning skill:

Skill Name: {skill_name}
Description: {skill_description}

Return a JSON array of query strings, e.g. ["query 1", "query 2", "query 3"]"""

    try:
        result = await generate_json(prompt=prompt, temperature=0.6)
        if isinstance(result, list):
            return result[:5]
        return ["Explain this topic", "Give me an example", "How does this work?"]
    except Exception as e:
        return ["Explain this topic", "Give me an example", "How does this work?"]
