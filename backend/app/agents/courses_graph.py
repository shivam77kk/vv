"""Feature 5: Spec-to-Course Compiler — vibe-learning pipeline with checkpoint gates."""
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict
from bson import ObjectId

from app.core.gemini import generate_json, generate_text
from app.core.config import settings
from app.rag.retrieve import retrieve_chunks
from app.db.client import get_collection


async def draft_spec(goal_text: str, user_id: str) -> str:
    context = await retrieve_chunks(goal_text, user_id=user_id, top_k=3)
    context_text = "\n".join([c["text"] for c in context]) if context else ""

    prompt = f"""You are a learning experience designer. Create a formal Learning Specification from this goal.

Student's Goal: {goal_text}

Available Context:
{context_text[:1500]}

Create a comprehensive Learning Spec in Markdown format with:
1. **Learning Objectives** — 3-5 measurable outcomes
2. **Prerequisites** — what the student should already know
3. **Modules** — 3-6 ordered learning modules, each with:
   - Title
   - Description (2-3 sentences)
   - Key topics covered
   - Checkpoint quiz outline (3-5 questions per module)
4. **Estimated Hours** — total and per module
5. **Success Criteria** — how to know you've mastered the material

Format as clean Markdown. Be specific and practical."""

    try:
        spec = await generate_text(
            prompt=prompt,
            system_instruction="You are an expert curriculum designer who creates structured, actionable learning specifications.",
            temperature=0.5,
        )
    except Exception as e:
        spec = f"Failed to generate spec due to AI rate limits. Please try again later. Error: {str(e)}"

    return spec


async def deploy_course(spec_markdown: str, user_id: str) -> dict:
    courses_col = await get_collection("courses")
    now = datetime.now(timezone.utc)

    prompt = f"""Parse this Learning Specification and extract the modules.

Specification:
{spec_markdown[:3000]}

Return JSON:
{{
    "goal": "The main learning goal",
    "objectives": ["objective 1", "objective 2"],
    "modules": [
        {{
            "title": "Module Title",
            "description": "Module description",
            "key_topics": ["topic 1", "topic 2"],
            "estimated_hours": 2,
            "checkpoint_questions": [
                {{
                    "question": "Question text",
                    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
                    "correct_answer": "A",
                    "explanation": "Why this is correct"
                }}
            ]
        }}
    ],
    "total_hours": 10
}}"""

    try:
        parsed = await generate_json(prompt=prompt, temperature=0.3)
    except Exception as e:
        parsed = {
            "goal": "Temporary Course (Rate Limited)",
            "objectives": ["Wait for AI limits to reset"],
            "modules": [{
                "title": "Rate Limit Reached",
                "description": "Google Gemini API rate limit reached.",
                "key_topics": ["Rate Limits"],
                "estimated_hours": 1,
                "checkpoint_questions": [
                    {"question": "Are you rate limited?", "options": ["Yes", "No"], "correct_answer": "Yes", "explanation": "Yes"}
                ]
            }],
            "total_hours": 1
        }

    modules = []
    for i, mod in enumerate(parsed.get("modules", [])):
        module_id = f"mod_{i+1}"
        status = "active" if i == 0 else "locked"

        try:
            content = await generate_text(
                prompt=f"""Generate educational content for this module:

Title: {mod.get('title', 'Module')}
Description: {mod.get('description', '')}
Key Topics: {', '.join(mod.get('key_topics', []))}

Write comprehensive, well-structured educational content with:
- Clear explanations
- Examples
- Key takeaways

Keep it focused and practical. Use Markdown formatting.""",
                temperature=0.6,
            )
        except Exception as e:
            content = f"Content generation failed due to AI rate limits. Please check back later. Error: {str(e)}"

        checkpoint_questions = mod.get("checkpoint_questions", [])
        if not checkpoint_questions:
            try:
                q_result = await generate_json(
                    prompt=f"""Generate 3 multiple choice quiz questions for this module:
Title: {mod.get('title', 'Module')}
Topics: {', '.join(mod.get('key_topics', []))}

Return JSON array:
[{{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": "A", "explanation": "..."}}]""",
                    temperature=0.4,
                )
                if isinstance(q_result, list):
                    checkpoint_questions = q_result
            except Exception as e:
                checkpoint_questions = [
                    {"question": "AI rate limit prevented question generation. Is this a temporary issue?", "options": ["Yes", "No"], "correct_answer": "Yes", "explanation": "Yes, it resets in 1 minute."}
                ]

        modules.append({
            "module_id": module_id,
            "title": mod.get("title", f"Module {i+1}"),
            "description": mod.get("description", ""),
            "content": content,
            "key_topics": mod.get("key_topics", []),
            "estimated_hours": mod.get("estimated_hours", 2),
            "status": status,
            "checkpoint_questions": checkpoint_questions,
            "order": i,
            "attempts": 0,
        })

    course_doc = {
        "user_id": user_id,
        "goal": parsed.get("goal", ""),
        "objectives": parsed.get("objectives", []),
        "spec_markdown": spec_markdown,
        "modules": modules,
        "total_hours": parsed.get("total_hours", 0),
        "status": "deployed",
        "current_module_index": 0,
        "created_at": now,
        "updated_at": now,
    }

    result = await courses_col.insert_one(course_doc)
    course_id = str(result.inserted_id)

    return {
        "course_id": course_id,
        "goal": parsed.get("goal", ""),
        "modules": [{
            "module_id": m["module_id"],
            "title": m["title"],
            "status": m["status"],
            "order": m["order"],
        } for m in modules],
        "status": "deployed",
    }


async def get_course_pipeline(course_id: str, user_id: str) -> dict:
    courses_col = await get_collection("courses")
    course = await courses_col.find_one({"_id": ObjectId(course_id), "user_id": user_id})

    if not course:
        return {"error": "Course not found"}

    return {
        "course_id": str(course["_id"]),
        "goal": course.get("goal", ""),
        "spec_markdown": course.get("spec_markdown", ""),
        "modules": course.get("modules", []),
        "status": course.get("status", ""),
        "created_at": course.get("created_at", "").isoformat() if hasattr(course.get("created_at", ""), "isoformat") else str(course.get("created_at", "")),
    }


async def submit_checkpoint(course_id: str, module_id: str, answers: List[dict], user_id: str) -> dict:
    courses_col = await get_collection("courses")
    attempts_col = await get_collection("checkpoint_attempts")
    course = await courses_col.find_one({"_id": ObjectId(course_id), "user_id": user_id})

    if not course:
        return {"error": "Course not found"}

    target_module = None
    target_index = -1
    for i, mod in enumerate(course.get("modules", [])):
        if mod["module_id"] == module_id:
            target_module = mod
            target_index = i
            break

    if not target_module:
        return {"error": "Module not found"}

    if target_module["status"] == "locked":
        return {"error": "Module is locked"}

    questions = target_module.get("checkpoint_questions", [])
    correct = 0
    total = len(questions)
    feedback_items = []

    for i, q in enumerate(questions):
        user_answer = None
        for a in answers:
            if a.get("question_index") == i or a.get("question") == q.get("question"):
                user_answer = a.get("answer", "")
                break

        if user_answer and user_answer.strip().upper().startswith(q.get("correct_answer", "").strip().upper()):
            correct += 1
            feedback_items.append({"question": q["question"], "correct": True})
        else:
            feedback_items.append({
                "question": q["question"],
                "correct": False,
                "explanation": q.get("explanation", ""),
            })

    score = (correct / total * 100) if total > 0 else 0
    passed = score >= 70

    attempt_count = target_module.get("attempts", 0) + 1

    now = datetime.now(timezone.utc)
    await attempts_col.insert_one({
        "course_id": course_id,
        "module_id": module_id,
        "user_id": user_id,
        "answers": answers,
        "score": score,
        "passed": passed,
        "attempt": attempt_count,
        "created_at": now,
    })

    modules = course.get("modules", [])
    modules[target_index]["attempts"] = attempt_count

    next_unlocked = False
    if passed:
        modules[target_index]["status"] = "passed"
        if target_index + 1 < len(modules):
            modules[target_index + 1]["status"] = "active"
            next_unlocked = True
    elif attempt_count >= 3:
        modules[target_index]["status"] = "rolled_back"
        try:
            rollback_content = await generate_text(
                prompt=f"""The student failed the checkpoint for "{target_module['title']}" 3 times.
Generate a remedial review module that:
1. Covers the core concepts more simply
2. Provides additional examples
3. Addresses common misconceptions

Topic: {target_module['title']}
Description: {target_module.get('description', '')}""",
                temperature=0.5,
            )
        except Exception as e:
            rollback_content = "The remedial review module could not be generated at this time due to AI rate limits. Please retry later or review the previous module content carefully."

        remedial = {
            "module_id": f"{module_id}_remedial",
            "title": f"Review: {target_module['title']}",
            "description": f"Remedial content for {target_module['title']}",
            "content": rollback_content,
            "status": "active",
            "checkpoint_questions": target_module.get("checkpoint_questions", []),
            "order": target_index,
            "attempts": 0,
            "is_remedial": True,
        }
        modules.insert(target_index + 1, remedial)
    else:
        modules[target_index]["status"] = "failed"

    await courses_col.update_one(
        {"_id": ObjectId(course_id)},
        {"$set": {"modules": modules, "updated_at": now}}
    )

    return {
        "passed": passed,
        "score": score,
        "feedback": json.dumps(feedback_items) if feedback_items else "Assessment complete",
        "next_module_unlocked": next_unlocked,
        "attempts": attempt_count,
    }


async def get_user_courses(user_id: str) -> List[dict]:
    courses_col = await get_collection("courses")
    cursor = courses_col.find(
        {"user_id": user_id},
        {"spec_markdown": 0}
    ).sort("created_at", -1).limit(20)

    courses = []
    async for course in cursor:
        courses.append({
            "course_id": str(course["_id"]),
            "goal": course.get("goal", ""),
            "status": course.get("status", ""),
            "modules": [{
                "module_id": m["module_id"],
                "title": m["title"],
                "status": m["status"],
                "order": m.get("order", 0),
            } for m in course.get("modules", [])],
            "created_at": course.get("created_at", "").isoformat() if hasattr(course.get("created_at", ""), "isoformat") else str(course.get("created_at", "")),
        })

    return courses
