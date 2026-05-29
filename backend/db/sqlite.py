import sqlite3
import os
from datetime import datetime
from contextlib import contextmanager

DB_PATH = os.getenv("SQLITE_DB_PATH", "./db/app.db")


def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def db_conn():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with db_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS documents (
                doc_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                chunk_count INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            );

            CREATE TABLE IF NOT EXISTS chat_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            );
        """)


def upsert_session(session_id: str):
    with db_conn() as conn:
        conn.execute("""
            INSERT INTO sessions (session_id) VALUES (?)
            ON CONFLICT(session_id) DO UPDATE SET last_active = CURRENT_TIMESTAMP
        """, (session_id,))


def insert_document(doc_id: str, session_id: str, filename: str, chunk_count: int):
    with db_conn() as conn:
        conn.execute(
            "INSERT INTO documents (doc_id, session_id, filename, chunk_count) VALUES (?, ?, ?, ?)",
            (doc_id, session_id, filename, chunk_count)
        )


def get_session_documents(session_id: str) -> list[dict]:
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT doc_id, filename, chunk_count, created_at FROM documents WHERE session_id = ? ORDER BY created_at DESC",
            (session_id,)
        ).fetchall()
        return [dict(row) for row in rows]


def get_session(session_id: str) -> dict | None:
    with db_conn() as conn:
        row = conn.execute(
            "SELECT session_id, created_at FROM sessions WHERE session_id = ?",
            (session_id,)
        ).fetchone()
        return dict(row) if row else None


def log_chat(session_id: str, question: str, answer: str):
    with db_conn() as conn:
        conn.execute(
            "INSERT INTO chat_logs (session_id, question, answer) VALUES (?, ?, ?)",
            (session_id, question, answer)
        )


def get_all_sessions() -> list[dict]:
    with db_conn() as conn:
        rows = conn.execute("""
            SELECT s.session_id,
                   COUNT(DISTINCT d.doc_id) as doc_count,
                   COUNT(DISTINCT c.id) as question_count,
                   s.last_active
            FROM sessions s
            LEFT JOIN documents d ON s.session_id = d.session_id
            LEFT JOIN chat_logs c ON s.session_id = c.session_id
            GROUP BY s.session_id
            ORDER BY s.last_active DESC
        """).fetchall()
        return [dict(row) for row in rows]


def delete_session(session_id: str):
    with db_conn() as conn:
        conn.execute("DELETE FROM chat_logs WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM documents WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
