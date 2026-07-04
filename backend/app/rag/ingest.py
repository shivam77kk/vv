"""RAG ingestion — chunk, embed, store in MongoDB with vector index."""
import hashlib
from datetime import datetime, timezone
from typing import List, Optional

from app.db.client import get_collection
from app.core.gemini import generate_embedding


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i : i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += chunk_size - overlap
    return chunks


async def ingest_document(
    text: str,
    user_id: str,
    doc_name: str,
    doc_id: Optional[str] = None,
) -> str:
    chunks_col = await get_collection("doc_chunks")
    chunks = chunk_text(text)

    if not doc_id:
        doc_id = hashlib.sha256(f"{user_id}:{doc_name}:{text[:200]}".encode()).hexdigest()[:24]

    await chunks_col.delete_many({"doc_id": doc_id})

    now = datetime.now(timezone.utc)
    docs = []
    for i, chunk in enumerate(chunks):
        embedding = await generate_embedding(chunk)
        docs.append({
            "doc_id": doc_id,
            "user_id": user_id,
            "doc_name": doc_name,
            "chunk_index": i,
            "text": chunk,
            "embedding": embedding,
            "created_at": now,
        })

    if docs:
        await chunks_col.insert_many(docs)

    return doc_id


async def ingest_text_simple(text: str, user_id: str, source_name: str) -> str:
    return await ingest_document(text, user_id, source_name)
