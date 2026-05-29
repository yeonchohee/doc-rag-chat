import chromadb
import os

_client = None


def get_chroma_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_store")
        os.makedirs(persist_dir, exist_ok=True)
        _client = chromadb.PersistentClient(path=persist_dir)
    return _client


def get_collection(session_id: str):
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=f"session_{session_id}",
        metadata={"hnsw:space": "cosine"}
    )


def delete_collection(session_id: str):
    client = get_chroma_client()
    try:
        client.delete_collection(f"session_{session_id}")
    except Exception:
        pass
