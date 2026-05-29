from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    status: str = "success"


class ChatRequest(BaseModel):
    session_id: str
    question: str
    doc_ids: list[str] = []


class ChatSource(BaseModel):
    doc_id: str
    filename: str
    chunk_text: str


class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    created_at: datetime


class SessionResponse(BaseModel):
    session_id: str
    documents: list[DocumentInfo]
    created_at: datetime
