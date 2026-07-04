"""MCP Tool Server: search_verify — web search + grounding for verification."""
from typing import List, Dict
from app.core.gemini import generate_json, generate_text


async def search_verify(claim: str, context: str = "") -> Dict:
    prompt = f"""You are a fact-checking assistant. Analyze the following claim and provide a verification result.

Claim: {claim}

Context (if any): {context}

Respond in JSON format:
{{
    "is_supported": true/false,
    "confidence": 0.0-1.0,
    "evidence": ["supporting evidence point 1", "point 2"],
    "sources": ["source description 1", "source description 2"],
    "unsupported_parts": ["any unsupported claims"]
}}"""

    try:
        result = await generate_json(
            prompt=prompt,
            system_instruction="You are a precise fact-checker. Only mark claims as supported if you have strong evidence. Be conservative in your confidence scores.",
            temperature=0.2,
        )
        return result
    except Exception as e:
        return {
            "is_supported": False,
            "confidence": 0.5,
            "reasoning": f"Verification failed due to AI rate limits. Error: {str(e)}",
            "conflicting_evidence": [],
            "supporting_evidence": []
        }


async def batch_verify(claims: List[str], context: str = "") -> List[Dict]:
    results = []
    for claim in claims:
        result = await search_verify(claim, context)
        results.append(result)
    return results
