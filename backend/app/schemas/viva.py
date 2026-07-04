"""Pydantic schemas for Feature 3: Glass-Box Viva."""
from pydantic import BaseModel, Field
from typing import List, Optional


class VivaStartRequest(BaseModel):
    topic: str = Field(..., min_length=2)
    syllabus_doc_id: Optional[str] = None


class VivaAnswerMessage(BaseModel):
    answer_text: str


class TraceEvent(BaseModel):
    node_name: str
    reasoning: str
    latency_ms: int
    tokens_used: int
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: Optional[str] = None


class VivaSessionResponse(BaseModel):
    session_id: str
    topic: str
    status: str


class VivaReportResponse(BaseModel):
    session_id: str
    topic: str
    transcript: List[dict]
    trace_history: List[TraceEvent]
    score: float
    summary: str
    questions_asked: int
    duration_seconds: int
