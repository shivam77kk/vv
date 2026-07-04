"""Pydantic schemas for Feature 2: Skill Exchange."""
from pydantic import BaseModel, Field
from typing import List, Optional


class SkillSubmitRequest(BaseModel):
    name: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    instructions_md: str = Field(..., min_length=20)


class SkillInvokeRequest(BaseModel):
    user_query: str


class SkillResponse(BaseModel):
    skill_id: str
    name: str
    description: str
    author_name: str
    author_id: str
    status: str
    install_count: int = 0
    avg_rating: float = 0.0
    created_at: Optional[str] = None


class SkillLibraryResponse(BaseModel):
    skills: List[SkillResponse]
    total: int


class SkillInvokeResponse(BaseModel):
    response: str
    skill_used: Optional[str] = None
    skill_name: Optional[str] = None
