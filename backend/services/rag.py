import os
import json
from openai import OpenAI
from typing import AsyncGenerator

from db.chroma import get_collection
from services.embedder import embed_texts, embed_query

TOP_K = 5
LLM_MODEL = "gpt-4o-mini"

SYSTEM_PROMPT = """당신은 업로드된 문서를 기반으로 질문에 답하는 AI입니다.
반드시 제공된 컨텍스트 내에서만 답변하세요.
컨텍스트에 없는 내용은 "문서에서 찾을 수 없습니다"라고 답하세요."""


def store_chunks(session_id: str, doc_id: str, filename: str, chunks: list[str]):
    collection = get_collection(session_id)
    embeddings = embed_texts(chunks)
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "filename": filename, "chunk_index": i} for i in range(len(chunks))]
    collection.add(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)


def search_chunks(session_id: str, question: str, doc_ids: list[str] = []) -> list[dict]:
    collection = get_collection(session_id)
    query_embedding = embed_query(question)

    where = {"doc_id": {"$in": doc_ids}} if doc_ids else None

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=TOP_K,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        chunks.append({
            "chunk_text": doc,
            "doc_id": meta["doc_id"],
            "filename": meta["filename"],
        })
    return chunks


async def stream_chat(session_id: str, question: str, doc_ids: list[str] = []) -> AsyncGenerator[str, None]:
    chunks = search_chunks(session_id, question, doc_ids)
    context = "\n\n---\n\n".join(c["chunk_text"] for c in chunks)

    user_message = f"[컨텍스트]\n{context}\n\n[질문]\n{question}"

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    stream = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        stream=True,
    )

    full_answer = []
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            full_answer.append(delta)
            yield f"data: {json.dumps({'type': 'chunk', 'content': delta})}\n\n"

    sources = [{"doc_id": c["doc_id"], "filename": c["filename"], "chunk_text": c["chunk_text"]} for c in chunks]
    yield f"data: {json.dumps({'type': 'sources', 'content': sources})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return "".join(full_answer)
