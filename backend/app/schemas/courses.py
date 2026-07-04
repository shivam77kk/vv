"""Pydantic schemas for Feature 5: Spec-to-Course Compiler."""
from pydantic import BaseModel, Field
from typing import List, Optional


class CourseDraftRequest(BaseModel):
    goal_text: str = Field(..., min_length=10)


class CourseDeployRequest(BaseModel):
    approved_spec_markdown: str


class CheckpointSubmitRequest(BaseModel):
    answers: List[dict]


class CourseModule(BaseModel):
    module_id: str
    title: str
    description: str
    content: Optional[str] = None
    status: str = "locked"
    checkpoint_questions: List[dict] = []
    order: int = 0


class CoursePipelineResponse(BaseModel):
    course_id: str
    goal: str
    spec_markdown: str
    modules: List[CourseModule]
    status: str
    created_at: Optional[str] = None


class CheckpointResultResponse(BaseModel):
    passed: bool
    score: float
    feedback: str
    next_module_unlocked: bool
    attempts: int
