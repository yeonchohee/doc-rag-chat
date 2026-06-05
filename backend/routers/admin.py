import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

from db.sqlite import get_all_sessions, get_session_documents, get_session_chat_logs

router = APIRouter()
security = HTTPBasic()


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    admin_password = os.getenv("ADMIN_PASSWORD", "admin")
    correct = secrets.compare_digest(credentials.password.encode(), admin_password.encode())
    if not correct:
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Basic"})
    return credentials.username


@router.get("/admin/sessions")
async def list_sessions(username: str = Depends(verify_admin)):
    sessions = get_all_sessions()
    return {"sessions": sessions}


@router.get("/admin/sessions/{session_id}")
async def get_session_detail(session_id: str, username: str = Depends(verify_admin)):
    documents = get_session_documents(session_id)
    chat_logs = get_session_chat_logs(session_id)
    return {"session_id": session_id, "documents": documents, "chat_logs": chat_logs}
