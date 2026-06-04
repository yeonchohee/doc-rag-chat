# doc-rag-chat

문서를 업로드하면 즉시 RAG 인덱싱되고, 그 문서에 대해 AI와 대화할 수 있는 웹 서비스

**[라이브 데모 →](https://yeonchohee.github.io/doc-rag-chat/)**

---

## 아키텍처

```
[브라우저]
   │  파일 업로드 (PDF/TXT/DOCX)
   ▼
[FastAPI 백엔드]
   │
   ├─ chunker.py ──→ RecursiveCharacterTextSplitter
   │                  chunk_size=500, chunk_overlap=50
   │
   ├─ embedder.py ──→ OpenAI text-embedding-3-small
   │
   ├─ ChromaDB ──────→ session_{uuid} 컬렉션에 벡터 저장
   │
   └─ SQLite ────────→ sessions / documents / chat_logs
   
   채팅 요청 시:
   질문 → 임베딩 → ChromaDB Top-5 검색 → GPT-4o-mini → SSE 스트리밍
```

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 백엔드 | Python 3.11 / FastAPI / uvicorn |
| 벡터 DB | ChromaDB (persistent) |
| 문서 처리 | LangChain RecursiveCharacterTextSplitter |
| 임베딩 | OpenAI text-embedding-3-small |
| LLM | OpenAI GPT-4o-mini (SSE 스트리밍) |
| 세션 DB | SQLite |
| 프론트엔드 | React 19 / Vite / Tailwind CSS v4 |
| 배포 | Render (백엔드) / GitHub Pages (프론트엔드) |

---

## 설계 결정

### 청킹 전략: chunk_size=500, chunk_overlap=50

`RecursiveCharacterTextSplitter`를 선택한 이유는 문단 → 문장 → 단어 순으로 자연스러운 경계를 우선 분리하기 때문입니다.

- **chunk_size=500**: GPT-4o-mini의 context window 효율과 검색 정확도의 균형점. 너무 크면 노이즈가 많아지고, 너무 작으면 문맥이 잘립니다.
- **chunk_overlap=50**: 청크 경계에서 문장이 잘려도 앞뒤 문맥을 보존하기 위한 최소한의 중첩. 전체 청크 크기의 10%로 설정해 스토리지 낭비를 줄였습니다.

### 임베딩 모델: text-embedding-3-small

| 모델 | 차원 | 비용 (1M tokens) | MTEB 점수 |
|------|------|-----------------|-----------|
| text-embedding-ada-002 | 1536 | $0.10 | 61.0 |
| **text-embedding-3-small** | **1536** | **$0.02** | **62.3** |
| text-embedding-3-large | 3072 | $0.13 | 64.6 |

ada-002 대비 **5배 저렴**하면서 성능은 오히려 높습니다. 포트폴리오 데모 특성상 비용 효율을 우선했습니다.

### 사용자별 컬렉션 분리: `session_{uuid}`

ChromaDB에서 세션마다 독립된 컬렉션을 생성합니다.

```python
collection_name = f"session_{session_uuid}"
```

- **데이터 격리**: 다른 사용자의 문서가 검색 결과에 혼입되지 않음
- **독립적 삭제**: 세션 만료 시 해당 컬렉션만 삭제, 전체 DB에 영향 없음
- **확장성**: 향후 멀티테넌시 구조로 전환 시 컬렉션 단위 분리가 자연스럽게 대응됨

---

## 로컬 실행

### 백엔드

```bash
cd backend
cp .env.example .env
# .env에 OPENAI_API_KEY 입력

pip install -r requirements.txt
uvicorn main:app --reload
# http://localhost:8000
```

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

> 프론트엔드 개발 서버는 `/upload`, `/chat`, `/session` 요청을 자동으로 `localhost:8000`으로 프록시합니다.

---

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/upload` | 문서 업로드 → 청킹 → ChromaDB 저장 |
| `POST` | `/chat` | RAG 검색 + GPT 스트리밍 (SSE) |
| `GET` | `/session/{id}` | 세션 문서 목록 조회 |
| `DELETE` | `/session/{id}` | 세션 및 벡터 데이터 삭제 |
| `GET` | `/admin/sessions` | 전체 세션 목록 (Basic Auth) |

---

## 배포 구조

```
main 브랜치 push
  ├─ GitHub Actions CI: pytest 통과
  ├─ Render Deploy Hook: 백엔드 자동 배포
  └─ GitHub Pages: 프론트엔드 자동 배포
```
