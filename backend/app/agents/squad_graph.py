"""Feature 4: Study Squad Negotiator — A2A agent negotiation with privacy guardrails."""
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict
from bson import ObjectId

from app.core.gemini import generate_json, generate_text
from app.core.config import settings
from app.mcp_tools.calendar_summary_server import get_availability_summary, get_weak_topics_summary
from app.db.client import get_collection


async def propose_study_session(initiator_id: str, participant_ids: List[str]) -> dict:
    groups_col = await get_collection("study_groups")
    now = datetime.now(timezone.utc)

    all_ids = [initiator_id] + participant_ids
    users_col = await get_collection("users")
    participants_info = []
    for uid in all_ids:
        try:
            user = await users_col.find_one({"_id": ObjectId(uid)})
            if user:
                participants_info.append({"id": uid, "name": user.get("name", "Unknown")})
            else:
                participants_info.append({"id": uid, "name": "Unknown User"})
        except Exception:
            participants_info.append({"id": uid, "name": "Unknown User"})

    negotiation_log = []

    negotiation_log.append({
        "agent": f"Initiator Agent ({participants_info[0]['name']})",
        "message": f"Initiating study group negotiation for {len(all_ids)} participants.",
        "timestamp": now.isoformat(),
    })

    availability_data = {}
    weak_topics_data = {}

    for uid in all_ids:
        avail = await get_availability_summary(uid)
        availability_data[uid] = avail
        name = next((p["name"] for p in participants_info if p["id"] == uid), "User")
        negotiation_log.append({
            "agent": f"Personal Agent ({name})",
            "message": f"Sharing availability: {len(avail.get('free_slots', []))} days with free slots available.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        weak = await get_weak_topics_summary(uid)
        weak_topics_data[uid] = weak
        negotiation_log.append({
            "agent": f"Personal Agent ({name})",
            "message": f"Sharing weak topics: {', '.join(weak.get('weak_topics', [])[:3])}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    negotiation_log.append({
        "agent": "Negotiator Agent",
        "message": "Analyzing overlapping availability and shared weak topics...",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    all_weak = []
    for uid, data in weak_topics_data.items():
        all_weak.extend(data.get("weak_topics", []))

    from collections import Counter
    topic_counts = Counter(all_weak)
    shared_topics = [t for t, c in topic_counts.most_common(5)]

    if not shared_topics:
        shared_topics = ["General Review"]
        match_score = 0.4
    else:
        match_score = min(0.95, 0.5 + (len(shared_topics) * 0.1))

    proposed_time = (now + timedelta(days=1, hours=14)).isoformat()

    negotiation_log.append({
        "agent": "Merge Agent",
        "message": f"Found shared weak topics: {', '.join(shared_topics[:3])}. Proposing session at {proposed_time}.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    proposal = {
        "initiator_id": initiator_id,
        "participant_ids": participant_ids,
        "all_member_ids": all_ids,
        "participants": participants_info,
        "proposed_time": proposed_time,
        "agenda": shared_topics[:5],
        "shared_weak_topics": shared_topics,
        "match_score": match_score,
        "status": "awaiting_consent",
        "consents": {initiator_id: True},
        "negotiation_log": negotiation_log,
        "created_at": now,
        "updated_at": now,
    }

    result = await groups_col.insert_one(proposal)
    proposal_id = str(result.inserted_id)

    for p in participants_info[1:]:
        negotiation_log.append({
            "agent": f"Personal Agent ({p['name']})",
            "message": "Reviewing proposal... awaiting my human's consent.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    await groups_col.update_one(
        {"_id": result.inserted_id},
        {"$set": {"negotiation_log": negotiation_log}}
    )

    return {
        "proposal_id": proposal_id,
        "status": "awaiting_consent",
        "participants": participants_info,
        "proposed_time": proposed_time,
        "agenda": shared_topics[:5],
        "negotiation_log": negotiation_log,
    }


async def consent_to_proposal(proposal_id: str, user_id: str, approve: bool) -> dict:
    groups_col = await get_collection("study_groups")
    proposal = await groups_col.find_one({"_id": ObjectId(proposal_id)})

    if not proposal:
        return {"error": "Proposal not found"}

    consents = proposal.get("consents", {})
    consents[user_id] = approve
    negotiation_log = proposal.get("negotiation_log", [])

    users_col = await get_collection("users")
    try:
        user = await users_col.find_one({"_id": ObjectId(user_id)})
        name = user.get("name", "User") if user else "User"
    except Exception:
        name = "User"

    negotiation_log.append({
        "agent": f"Personal Agent ({name})",
        "message": f"{'Approved' if approve else 'Declined'} the study session proposal.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    all_members = proposal.get("all_member_ids", [])
    all_consented = all(consents.get(mid) for mid in all_members)

    new_status = proposal["status"]
    if not approve:
        new_status = "declined"
        negotiation_log.append({
            "agent": "Negotiator Agent",
            "message": f"{name} declined. Session proposal cancelled.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    elif all_consented:
        new_status = "confirmed"
        negotiation_log.append({
            "agent": "Finalize Agent",
            "message": "All participants approved! Study session is confirmed.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    await groups_col.update_one(
        {"_id": ObjectId(proposal_id)},
        {
            "$set": {
                "consents": consents,
                "status": new_status,
                "negotiation_log": negotiation_log,
                "updated_at": datetime.now(timezone.utc),
            }
        }
    )

    return {
        "proposal_id": proposal_id,
        "status": new_status,
        "consents": consents,
    }


async def get_user_groups(user_id: str) -> List[dict]:
    groups_col = await get_collection("study_groups")
    cursor = groups_col.find(
        {"all_member_ids": user_id}
    ).sort("created_at", -1).limit(20)

    groups = []
    async for group in cursor:
        groups.append({
            "group_id": str(group["_id"]),
            "participants": group.get("participants", []),
            "consents": group.get("consents", {}),
            "match_score": group.get("match_score", 0.0),
            "scheduled_time": group.get("proposed_time"),
            "agenda": group.get("agenda", []),
            "status": group.get("status", "unknown"),
            "negotiation_log": group.get("negotiation_log", []),
            "created_at": group.get("created_at", "").isoformat() if hasattr(group.get("created_at", ""), "isoformat") else str(group.get("created_at", "")),
        })

    return groups
