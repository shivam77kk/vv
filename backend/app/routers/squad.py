"""Feature 4: Study Squad Negotiator router."""
from fastapi import APIRouter, HTTPException, Depends
from app.core.security import get_current_user
from app.agents.squad_graph import propose_study_session, consent_to_proposal, get_user_groups
from app.schemas.squad import SquadProposeRequest, SquadConsentRequest

router = APIRouter(prefix="/api/squad", tags=["squad"])


@router.post("/propose")
async def propose(
    req: SquadProposeRequest,
    user: dict = Depends(get_current_user),
):
    result = await propose_study_session(
        initiator_id=user["user_id"],
        participant_ids=req.participant_ids,
    )
    return result


@router.post("/{proposal_id}/consent")
async def consent(
    proposal_id: str,
    req: SquadConsentRequest,
    user: dict = Depends(get_current_user),
):
    result = await consent_to_proposal(
        proposal_id=proposal_id,
        user_id=user["user_id"],
        approve=req.approve,
    )
    return result


@router.get("/my-groups")
async def my_groups(user: dict = Depends(get_current_user)):
    groups = await get_user_groups(user["user_id"])
    return {"groups": groups}
