import os
import sys

# 환경변수를 모듈 import 전에 설정
os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("SQLITE_DB_PATH", "/tmp/pytest_app.db")
os.environ.setdefault("CHROMA_PERSIST_DIR", "/tmp/pytest_chroma")

# backend/ 를 sys.path에 추가 (pytest가 backend/ 밖에서 실행될 때)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
