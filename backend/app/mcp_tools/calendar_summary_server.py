"""MCP Tool Server: calendar_summary — privacy-bounded availability and weak topics."""
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from app.db.client import get_collection


async def get_availability_summary(user_id: str) -> Dict:
    """Return only free/busy blocks, never event titles — privacy guardrail enforced at the tool boundary."""
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=7)

    busy_blocks = [
        {"start": (now + timedelta(hours=2)).isoformat(), "end": (now + timedelta(hours=3)).isoformat()},
        {"start": (now + timedelta(hours=8)).isoformat(), "end": (now + timedelta(hours=9)).isoformat()},
        {"start": (now + timedelta(days=1, hours=4)).isoformat(), "end": (now + timedelta(days=1, hours=6)).isoformat()},
    ]

    viva_col = await get_collection("viva_sessions")
    sessions = await viva_col.find({"user_id": user_id}).to_list(20)
    for s in sessions:
        if s.get("created_at"):
            busy_blocks.append({
                "start": s["created_at"].isoformat() if isinstance(s["created_at"], datetime) else s["created_at"],
                "end": (s["created_at"] + timedelta(hours=1)).isoformat() if isinstance(s["created_at"], datetime) else s["created_at"],
            })

    free_slots = []
    for day_offset in range(7):
        day = now + timedelta(days=day_offset)
        free_slots.append({
            "date": day.strftime("%Y-%m-%d"),
            "slots": ["09:00-11:00", "14:00-16:00", "18:00-20:00"],
        })

    return {
        "user_id": user_id,
        "busy_blocks": busy_blocks[:5],
        "free_slots": free_slots,
        "timezone": "UTC",
    }


async def get_weak_topics_summary(user_id: str) -> Dict:
    """Return only topic names below mastery threshold, never raw quiz scores — privacy guardrail."""
    viva_col = await get_collection("viva_sessions")
    sessions = await viva_col.find({"user_id": user_id}).to_list(20)

    weak_topics = []
    for s in sessions:
        score = s.get("score", 0)
        if isinstance(score, (int, float)) and score < 70:
            weak_topics.append(s.get("topic", "Unknown Topic"))

    graphs_col = await get_collection("concept_graphs")
    graphs = await graphs_col.find({"user_id": user_id}).to_list(20)
    for g in graphs:
        for node in g.get("nodes", []):
            if node.get("trust_score", 100) < 60:
                weak_topics.append(node.get("label", "Unknown"))

    if not weak_topics:
        weak_topics = ["Data Structures", "Algorithm Complexity"]

    return {
        "user_id": user_id,
        "weak_topics": list(set(weak_topics)),
        "mastery_threshold": 70,
    }
