"""Feature 3: Glass-Box Viva router with WebSocket support."""
import json
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from bson import ObjectId

from app.core.security import get_current_user, decode_access_token
from app.db.client import get_collection
from app.agents.viva_graph import start_viva_session, process_viva_answer, get_viva_report
from app.schemas.viva import VivaStartRequest

router = APIRouter(prefix="/api/viva", tags=["viva"])


@router.post("/start")
async def start_session(
    req: VivaStartRequest,
    user: dict = Depends(get_current_user),
):
    result = await start_viva_session(
        topic=req.topic,
        user_id=user["user_id"],
        syllabus_doc_id=req.syllabus_doc_id,
    )
    return result


@router.post("/answer/{session_id}")
async def submit_answer(
    session_id: str,
    body: dict,
    user: dict = Depends(get_current_user),
):
    sessions_col = await get_collection("viva_sessions")
    session = await sessions_col.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await process_viva_answer(session_id, body.get("answer_text", ""))
    return result


@router.get("/session/{session_id}/report")
async def session_report(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    sessions_col = await get_collection("viva_sessions")
    session = await sessions_col.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return await get_viva_report(session_id)


@router.get("/my-sessions")
async def my_sessions(user: dict = Depends(get_current_user)):
    sessions_col = await get_collection("viva_sessions")
    cursor = sessions_col.find(
        {"user_id": user["user_id"]},
        {"history": 0, "trace_log": 0}
    ).sort("created_at", -1).limit(20)

    sessions = []
    async for s in cursor:
        sessions.append({
            "session_id": str(s["_id"]),
            "topic": s.get("topic", ""),
            "status": s.get("status", ""),
            "score": s.get("score", 0),
            "questions_asked": s.get("questions_asked", 0),
            "created_at": s.get("created_at", "").isoformat() if hasattr(s.get("created_at", ""), "isoformat") else "",
        })

    return {"sessions": sessions}
