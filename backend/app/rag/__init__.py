"""RAG Module.

This module handles document ingestion and vector retrieval.
"""

from app.rag.ingest import ingest_document, ingest_text_simple
from app.rag.retrieve import retrieve_chunks

__all__ = ["ingest_document", "ingest_text_simple", "retrieve_chunks"]
