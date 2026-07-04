"""Feature 2: Skill Exchange router."""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.core.security import get_current_user
from app.db.client import get_collection
from app.agents.skills_graph import run_skill_pipeline, invoke_skill_router, get_skill_library
from app.schemas.skills import SkillSubmitRequest, SkillInvokeRequest

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.post("/submit")
async def submit_skill(
    req: SkillSubmitRequest,
    user: dict = Depends(get_current_user),
):
    users_col = await get_collection("users")
    user_doc = await users_col.find_one({"_id": ObjectId(user["user_id"])})
    author_name = user_doc.get("name", "Unknown") if user_doc else "Unknown"

    result = await run_skill_pipeline(
        name=req.name,
        description=req.description,
        instructions_md=req.instructions_md,
        user_id=user["user_id"],
        author_name=author_name,
    )

    return result


@router.get("/library")
async def library(page: int = 1, limit: int = 20):
    result = await get_skill_library(page=page, limit=limit)
    return result


@router.post("/{skill_id}/invoke")
async def invoke_skill(
    skill_id: str,
    req: SkillInvokeRequest,
    user: dict = Depends(get_current_user),
):
    result = await invoke_skill_router(
        user_query=req.user_query,
        user_id=user["user_id"],
    )
    return result


@router.post("/{skill_id}/install")
async def install_skill(
    skill_id: str,
    user: dict = Depends(get_current_user),
):
    users_col = await get_collection("users")
    await users_col.update_one(
        {"_id": ObjectId(user["user_id"])},
        {"$addToSet": {"installed_skills": skill_id}}
    )
    skills_col = await get_collection("skills")
    await skills_col.update_one(
        {"_id": ObjectId(skill_id)},
        {"$inc": {"install_count": 1}}
    )
    return {"status": "installed", "skill_id": skill_id}


@router.get("/my-skills")
async def get_my_skills(user: dict = Depends(get_current_user)):
    users_col = await get_collection("users")
    user_doc = await users_col.find_one({"_id": ObjectId(user["user_id"])})
    installed_ids = user_doc.get("installed_skills", []) if user_doc else []
    
    skills_col = await get_collection("skills")
    cursor = skills_col.find({"_id": {"$in": [ObjectId(sid) for sid in installed_ids if ObjectId.is_valid(sid)]}})
    
    skills = []
    async for skill in cursor:
        skills.append({
            "skill_id": str(skill["_id"]),
            "name": skill["name"],
            "description": skill["description"],
            "author_name": skill.get("author_name", "Unknown"),
            "status": skill["status"],
            "install_count": skill.get("install_count", 0),
        })
    return {"installed_skills": skills}


@router.get("/{skill_id}")
async def get_skill(skill_id: str):
    skills_col = await get_collection("skills")
    skill = await skills_col.find_one(
        {"_id": ObjectId(skill_id)},
        {"embedding": 0}
    )
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    return {
        "skill_id": str(skill["_id"]),
        "name": skill["name"],
        "description": skill["description"],
        "instructions_md": skill.get("instructions_md", ""),
        "author_name": skill.get("author_name", ""),
        "author_id": skill.get("author_id", ""),
        "status": skill["status"],
        "install_count": skill.get("install_count", 0),
        "avg_rating": skill.get("avg_rating", 0.0),
        "sandbox_results": skill.get("sandbox_results", {}),
    }
