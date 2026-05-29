import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

from db.sqlite import get_all_sessions

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
