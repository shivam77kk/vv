"""VidyaVibe FastAPI Backend — main application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.db.client import get_database, close_database
from app.routers import auth, forge, skills, viva, squad, courses


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_database()
    print("Database connected")
    yield
    await close_database()
    print("Database disconnected")


app = FastAPI(
    title="VidyaVibe API",
    description="Agentic Education Platform — Production-grade multi-agent learning system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(forge.router)
app.include_router(skills.router)
app.include_router(viva.router)
app.include_router(squad.router)
app.include_router(courses.router)


@app.get("/")
async def root():
    return {"message": "VidyaVibe API is running", "version": "1.0.0"}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


@app.get("/api/stats")
async def stats():
    from app.db.client import get_collection
    try:
        graphs = await get_collection("concept_graphs")
        skills_col = await get_collection("skills")
        sessions = await get_collection("viva_sessions")
        groups = await get_collection("study_groups")
        courses_col = await get_collection("courses")
        users = await get_collection("users")

        return {
            "concepts_forged": await graphs.count_documents({"status": "completed"}),
            "skills_published": await skills_col.count_documents({"status": "published"}),
            "viva_sessions": await sessions.count_documents({}),
            "study_groups": await groups.count_documents({}),
            "courses_deployed": await courses_col.count_documents({"status": "deployed"}),
            "total_users": await users.count_documents({}),
        }
    except Exception:
        return {
            "concepts_forged": 0,
            "skills_published": 0,
            "viva_sessions": 0,
            "study_groups": 0,
            "courses_deployed": 0,
            "total_users": 0,
        }
