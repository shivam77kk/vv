"""RAG retrieval — vector search against MongoDB Atlas with caching."""
import hashlib
from typing import List, Optional
from cachetools import TTLCache

from app.db.client import get_collection
from app.core.gemini import generate_embedding

_retrieval_cache = TTLCache(maxsize=200, ttl=86400)


async def retrieve_chunks(
    query: str,
    user_id: Optional[str] = None,
    top_k: int = 5,
    min_score: float = 0.5,
) -> List[dict]:
    cache_key = hashlib.sha256(f"{query}:{user_id}:{top_k}".encode()).hexdigest()
    if cache_key in _retrieval_cache:
        return _retrieval_cache[cache_key]

    query_embedding = await generate_embedding(query)
    chunks_col = await get_collection("doc_chunks")

    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": top_k * 10,
                    "limit": top_k,
                }
            },
            {
                "$project": {
                    "text": 1,
                    "doc_name": 1,
                    "chunk_index": 1,
                    "doc_id": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]

        if user_id:
            pipeline[0]["$vectorSearch"]["filter"] = {"user_id": user_id}

        results = []
        async for doc in chunks_col.aggregate(pipeline):
            if doc.get("score", 0) >= min_score:
                results.append({
                    "text": doc["text"],
                    "doc_name": doc.get("doc_name", ""),
                    "chunk_index": doc.get("chunk_index", 0),
                    "score": doc.get("score", 0),
                    "doc_id": doc.get("doc_id", ""),
                })

        _retrieval_cache[cache_key] = results
        return results

    except Exception as e:
        print(f"Retrieval error: {e}")
        return []
