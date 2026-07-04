"""Feature 1: Concept Forge router."""
import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, UploadFile, File
from bson import ObjectId

from app.core.security import get_current_user
from app.db.client import get_collection
from app.agents.forge_graph import run_forge_pipeline
from app.rag.ingest import ingest_document
from app.schemas.forge import ForgeGenerateRequest, ForgeStatusResponse

router = APIRouter(prefix="/api/forge", tags=["forge"])


@router.post("/generate")
async def generate_graph(
    req: ForgeGenerateRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    graph_id = str(uuid.uuid4())[:24]

    background_tasks.add_task(
        run_forge_pipeline,
        topic=req.topic,
        user_id=user["user_id"],
        graph_id=graph_id,
        syllabus_doc_id=req.syllabus_doc_id,
    )

    return {"graph_id": graph_id, "status": "processing"}


@router.get("/graph/{graph_id}")
async def get_graph(graph_id: str, user: dict = Depends(get_current_user)):
    graphs_col = await get_collection("concept_graphs")
    graph = await graphs_col.find_one({"_id": graph_id})

    if not graph:
        return {"graph_id": graph_id, "status": "processing", "nodes": [], "edges": []}

    if graph.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "graph_id": graph_id,
        "topic": graph.get("topic", ""),
        "status": graph.get("status", "processing"),
        "nodes": graph.get("nodes", []),
        "edges": graph.get("edges", []),
        "error": graph.get("error", None),
        "created_at": graph.get("updated_at", "").isoformat() if hasattr(graph.get("updated_at", ""), "isoformat") else str(graph.get("updated_at", "")),
    }


@router.get("/my-graphs")
async def get_my_graphs(user: dict = Depends(get_current_user)):
    graphs_col = await get_collection("concept_graphs")
    cursor = graphs_col.find(
        {"user_id": user["user_id"]},
        {"nodes": 0, "edges": 0}
    ).sort("updated_at", -1).limit(20)

    graphs = []
    async for g in cursor:
        graphs.append({
            "graph_id": str(g["_id"]),
            "topic": g.get("topic", ""),
            "status": g.get("status", ""),
            "created_at": g.get("updated_at", "").isoformat() if hasattr(g.get("updated_at", ""), "isoformat") else "",
        })

    return {"graphs": graphs}


@router.post("/upload-syllabus")
async def upload_syllabus(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    content = await file.read()
    if file.filename and file.filename.lower().endswith(".pdf"):
        try:
            import io
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            if not text.strip():
                raise HTTPException(status_code=400, detail="No readable text found in PDF. Scanned images are not supported.")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    else:
        text = content.decode("utf-8", errors="ignore")

    doc_id = await ingest_document(
        text=text,
        user_id=user["user_id"],
        doc_name=file.filename or "uploaded_syllabus",
    )

    return {"doc_id": doc_id, "filename": file.filename, "chunks_created": len(text.split()) // 500 + 1}
