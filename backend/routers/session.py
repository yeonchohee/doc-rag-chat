from fastapi import APIRouter, HTTPException

from models.schemas import SessionResponse, DocumentInfo
from db.sqlite import get_session, get_session_documents, delete_session
from db.chroma import delete_collection

router = APIRouter()


@router.get("/session/{session_id}", response_model=SessionResponse)
async def get_session_info(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    docs_raw = get_session_documents(session_id)
    documents = [DocumentInfo(**d) for d in docs_raw]

    return SessionResponse(
        session_id=session["session_id"],
        documents=documents,
        created_at=session["created_at"],
    )


@router.delete("/session/{session_id}")
async def remove_session(session_id: str):
    delete_collection(session_id)
    delete_session(session_id)
    return {"status": "deleted"}
