import os
import json
from openai import OpenAI
from typing import AsyncGenerator

from db.chroma import get_collection
from services.embedder import embed_texts, embed_query

TOP_K = 5
LLM_MODEL = "gpt-4o-mini"

NOT_FOUND_ANSWER = "문서에서 찾을 수 없습니다"

# 출처로 보여줄 청크의 최대 코사인 거리. 샘플 문서로 측정했을 때 문서와 관련된
# 질문의 최근접 거리는 0.41~0.64, 관련 없는 질문은 0.70~0.85였다. 경계가 좁아서
# 이 값으로 답변 자체를 막지는 않고(컨텍스트는 TOP_K 그대로 전달), 화면에 보여줄
# 출처를 고르는 데만 쓴다.
SOURCE_MAX_DISTANCE = 0.7

SYSTEM_PROMPT = f"""당신은 업로드된 문서를 기반으로 질문에 답하는 AI입니다.
반드시 제공된 컨텍스트 내에서만 답변하세요.
컨텍스트에 없는 내용은 "{NOT_FOUND_ANSWER}"라고 답하세요."""


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
    for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], results["distances"][0]):
        chunks.append({
            "chunk_text": doc,
            "doc_id": meta["doc_id"],
            "filename": meta["filename"],
            "distance": dist,
        })
    return chunks


def select_sources(chunks: list[dict], answer: str) -> list[dict]:
    """답변 아래에 보여줄 출처를 고른다.

    문서에서 답을 찾지 못했다면 출처를 보여주지 않는다. 답을 찾았다면 거리 기준을
    통과한 청크만 보여주되, 하나도 없으면 가장 가까운 청크 하나를 남긴다.
    """
    if not chunks or answer.strip().startswith(NOT_FOUND_ANSWER):
        return []
    ranked = sorted(chunks, key=lambda c: c["distance"])
    relevant = [c for c in ranked if c["distance"] <= SOURCE_MAX_DISTANCE]
    picked = relevant or ranked[:1]
    return [{"doc_id": c["doc_id"], "filename": c["filename"], "chunk_text": c["chunk_text"]} for c in picked]


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

    answer_parts = []
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            answer_parts.append(delta)
            yield f"data: {json.dumps({'type': 'chunk', 'content': delta})}\n\n"

    sources = select_sources(chunks, "".join(answer_parts))
    yield f"data: {json.dumps({'type': 'sources', 'content': sources})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"
