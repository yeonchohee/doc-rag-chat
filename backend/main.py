import os
import json
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import upload, chat, session, admin
from db.sqlite import init_db

app = FastAPI(title="doc-rag-chat", version="1.0.0")

# CORS
cors_origins_raw = os.getenv("CORS_ORIGINS", '["http://localhost:5173"]')
try:
    cors_origins = json.loads(cors_origins_raw)
except Exception:
    cors_origins = [cors_origins_raw]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(session.router)
app.include_router(admin.router)


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/health")
async def health():
    return {"status": "ok"}
