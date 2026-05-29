import os
import tempfile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def load_and_chunk(file_bytes: bytes, filename: str) -> list[str]:
    ext = os.path.splitext(filename)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        if ext == ".pdf":
            loader = PyPDFLoader(tmp_path)
        elif ext == ".txt":
            loader = TextLoader(tmp_path, encoding="utf-8")
        elif ext == ".docx":
            loader = Docx2txtLoader(tmp_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

        docs = loader.load()
        full_text = "\n\n".join(d.page_content for d in docs)
    finally:
        os.unlink(tmp_path)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    return splitter.split_text(full_text)
