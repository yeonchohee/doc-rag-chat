import os
from openai import OpenAI

_client = None
EMBEDDING_MODEL = "text-embedding-3-small"


def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def embed_texts(texts: list[str]) -> list[list[float]]:
    client = get_openai_client()
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in response.data]


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]
