"""Pydantic schemas for Feature 1: Concept Forge."""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ForgeGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2)
    syllabus_doc_id: Optional[str] = None


class GraphNode(BaseModel):
    id: str
    label: str
    explanation: str
    analogy: str
    trust_score: int = Field(ge=0, le=100)
    status: str = "verified"
    sources: List[str] = []
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None


class ConceptGraphResponse(BaseModel):
    graph_id: str
    topic: str
    status: str
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []
    created_at: Optional[str] = None


class ForgeStatusResponse(BaseModel):
    graph_id: str
    status: str
