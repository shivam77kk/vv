"""Feature 5: Spec-to-Course Compiler router."""
from fastapi import APIRouter, HTTPException, Depends
from app.core.security import get_current_user
from app.agents.courses_graph import draft_spec, deploy_course, get_course_pipeline, submit_checkpoint, get_user_courses
from app.schemas.courses import CourseDraftRequest, CourseDeployRequest, CheckpointSubmitRequest

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.post("/draft-spec")
async def create_draft_spec(
    req: CourseDraftRequest,
    user: dict = Depends(get_current_user),
):
    spec = await draft_spec(req.goal_text, user["user_id"])
    return {"spec_markdown": spec}


@router.post("/deploy")
async def deploy(
    req: CourseDeployRequest,
    user: dict = Depends(get_current_user),
):
    result = await deploy_course(req.approved_spec_markdown, user["user_id"])
    return result


@router.get("/my-courses")
async def my_courses(user: dict = Depends(get_current_user)):
    courses = await get_user_courses(user["user_id"])
    return {"courses": courses}


@router.get("/{course_id}/pipeline")
async def pipeline(
    course_id: str,
    user: dict = Depends(get_current_user),
):
    result = await get_course_pipeline(course_id, user["user_id"])
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/{course_id}/checkpoint/{module_id}/submit")
async def checkpoint_submit(
    course_id: str,
    module_id: str,
    req: CheckpointSubmitRequest,
    user: dict = Depends(get_current_user),
):
    result = await submit_checkpoint(course_id, module_id, req.answers, user["user_id"])
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
