from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest
from services.rag import stream_chat
from db.sqlite import upsert_session, log_chat

router = APIRouter()


@router.post("/chat")
async def chat(request: ChatRequest):
    upsert_session(request.session_id)

    async def generate():
        full_answer_parts = []
        async for event in stream_chat(request.session_id, request.question, request.doc_ids):
            yield event
            # collect answer text for logging (chunks only)
            if '"type": "chunk"' in event:
                import json
                try:
                    data = json.loads(event.replace("data: ", "").strip())
                    if data.get("type") == "chunk":
                        full_answer_parts.append(data.get("content", ""))
                except Exception:
                    pass
        log_chat(request.session_id, request.question, "".join(full_answer_parts))

    return StreamingResponse(generate(), media_type="text/event-stream")
