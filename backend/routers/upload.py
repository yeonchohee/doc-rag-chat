import os
import uuid
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from models.schemas import UploadResponse
from services.chunker import load_and_chunk
from services.rag import store_chunks
from db.sqlite import upsert_session, insert_document

router = APIRouter()

MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "10")) * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    session_id: str = Form(...),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed: pdf, txt, docx")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Max size: {os.getenv('MAX_FILE_SIZE_MB', '10')}MB")

    chunks = load_and_chunk(content, file.filename)
    if not chunks:
        raise HTTPException(status_code=422, detail="Could not extract text from file")

    doc_id = str(uuid.uuid4())
    upsert_session(session_id)
    store_chunks(session_id, doc_id, file.filename, chunks)
    insert_document(doc_id, session_id, file.filename, len(chunks))

    return UploadResponse(
        doc_id=doc_id,
        filename=file.filename,
        chunk_count=len(chunks),
    )
