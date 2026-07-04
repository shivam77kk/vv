"""Pydantic schemas for Feature 4: Study Squad."""
from pydantic import BaseModel, Field
from typing import List, Optional


class SquadProposeRequest(BaseModel):
    participant_ids: List[str] = Field(..., min_length=1)


class SquadConsentRequest(BaseModel):
    approve: bool


class SquadProposal(BaseModel):
    proposal_id: str
    initiator_id: str
    participants: List[dict]
    proposed_time: Optional[str] = None
    agenda: List[str] = []
    shared_weak_topics: List[str] = []
    status: str
    negotiation_log: List[dict] = []


class SquadGroupResponse(BaseModel):
    group_id: str
    members: List[dict]
    scheduled_time: Optional[str] = None
    agenda: List[str] = []
    status: str
    created_at: Optional[str] = None
