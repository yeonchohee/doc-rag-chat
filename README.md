# doc-rag-chat

> 문서를 업로드하면 즉시 RAG 인덱싱되고, 그 문서에 대해 AI와 대화할 수 있는 웹서비스

**[라이브 데모 →](https://yeonchohee.github.io/doc-rag-chat/)**

---

## 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                  사용자 브라우저                       │
│  React (GitHub Pages)                               │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │  UploadZone  │  │       ChatWindow             │ │
│  │  (드래그앤드롭) │  │  SSE 스트리밍 · 출처 표시   │ │
│  └──────┬───────┘  └──────────────┬───────────────┘ │
└─────────┼────────────────────────┼─────────────────┘
          │ POST /upload           │ POST /chat (SSE)
          ▼                        ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI (Render)                       │
│                                                     │
│  [업로드 파이프라인]                                  │
│  파일 수신                                           │
│    → LangChain Document Loader (PDF/TXT/DOCX)       │
│    → RecursiveCharacterTextSplitter                 │
│       chunk_size=500 / chunk_overlap=50             │
│    → OpenAI text-embedding-3-small (임베딩 생성)     │
│    → ChromaDB session_{uuid} 컬렉션에 저장           │
│    → SQLite documents 테이블에 메타데이터 기록        │
│                                                     │
│  [채팅 파이프라인]                                    │
│  질문 수신                                           │
│    → text-embedding-3-small (질문 임베딩)            │
│    → ChromaDB cosine 유사도 검색 (Top-5)            │
│    → GPT-4o-mini (시스템 프롬프트 + 컨텍스트 + 질문)  │
│    → SSE 스트리밍으로 응답 전달                       │
│                                                     │
│  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  ChromaDB        │  │  SQLite                │  │
│  │  (persistent)    │  │  sessions              │  │
│  │  session_{uuid}  │  │  documents             │  │
│  │  컬렉션별 벡터    │  │  chat_logs             │  │
│  └──────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 백엔드 | Python 3.11 / FastAPI / uvicorn |
| RAG 파이프라인 | LangChain (문서 로딩 · 청킹) / ChromaDB |
| 임베딩 | OpenAI `text-embedding-3-small` |
| 생성 모델 | OpenAI `gpt-4o-mini` (SSE 스트리밍) |
| 세션 메타 DB | SQLite |
| 프론트엔드 | React 19 / Vite / Tailwind CSS v4 |
| 배포 | Render (백엔드) / GitHub Pages (프론트엔드) |
| CI/CD | GitHub Actions |

---

## 설계 의도

### 청킹 전략: `chunk_size=500`, `chunk_overlap=50`

`RecursiveCharacterTextSplitter`는 분리자 우선순위(`\n\n → \n → . → 공백`)에 따라 단락 → 문장 → 단어 순으로 자연스러운 경계에서 분할합니다.

**왜 500자인가?**

검색 정확도와 컨텍스트 품질 사이의 균형점입니다.

- 너무 크면 (1000자+): 한 청크에 여러 주제가 섞여 임베딩 벡터가 희석됩니다. 질문과 무관한 내용이 context에 포함되어 GPT 응답 품질이 낮아집니다.
- 너무 작으면 (100자 이하): 문장이 잘려 의미 손실이 발생하고 임베딩 품질이 떨어집니다. Top-5 결과를 합산해도 충분한 context가 구성되지 않습니다.
- **500자 = 단락 1~2개** 분량으로 하나의 주제를 완결 짓기에 적합합니다. Top-5 청크 합산 약 2,500자는 `gpt-4o-mini` context window 효율에도 맞습니다.

**왜 overlap=50인가?**

50자(전체 청크의 10%)를 앞뒤 청크에 중복 포함해 경계에서 문장이 잘리는 문제를 방지합니다. 중복 비율이 지나치게 높으면 스토리지와 임베딩 비용이 증가하므로 최소한의 값으로 설정했습니다.

```python
# backend/services/chunker.py
RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ".", " ", ""],
)
```

---

### 임베딩 모델: `text-embedding-3-small`

| 모델 | 차원 | 비용 (1M tokens) | MTEB 평균 |
|------|------|-----------------|-----------|
| `text-embedding-ada-002` | 1536 | $0.10 | 61.0 |
| **`text-embedding-3-small`** | **1536** | **$0.02** | **62.3** |
| `text-embedding-3-large` | 3072 | $0.13 | 64.6 |

`ada-002` 대비 **5배 저렴**하면서 MTEB 벤치마크 점수는 오히려 높습니다. 포트폴리오 데모 특성상 요청 규모가 크지 않지만, 비용 효율과 품질 모두에서 `3-small`이 최선의 선택입니다. `3-large`는 성능 개선 폭(+2.3점)에 비해 비용이 6.5배 높아 오버스펙입니다.

---

### 사용자별 컬렉션 분리: `session_{uuid}`

로그인 없이 UUID 기반 세션으로 운영하기 때문에, ChromaDB 컬렉션을 세션 단위로 분리하는 것이 필수입니다.

```python
# backend/db/chroma.py
collection_name = f"session_{session_uuid}"
chroma_client.get_or_create_collection(
    name=collection_name,
    metadata={"hnsw:space": "cosine"},
)
```

**단일 컬렉션 + 필터 방식 대비 컬렉션 분리 방식을 선택한 이유:**

| 항목 | 단일 컬렉션 + 필터 | 컬렉션 분리 (채택) |
|------|------------------|--------------------|
| 데이터 격리 | 필터 누락 시 전체 노출 위험 | 컬렉션 자체가 격리 경계 |
| 삭제 단위 | 문서별 ID 목록 관리 필요 | `delete_collection()` 한 번으로 완결 |
| 검색 성능 | 전체 데이터 대상 HNSW 탐색 | 세션 데이터만 대상으로 탐색 |
| 확장성 | 데이터 증가 시 성능 저하 가능 | 세션별 인덱스가 독립 유지 |

세션 만료 시 `delete_collection(session_id)` 한 번으로 해당 사용자의 모든 벡터 데이터를 완전 삭제합니다.

---

## 로컬 실행

### 요구사항
- Python 3.11+
- Node.js 18+
- OpenAI API 키

### 백엔드

```bash
cd backend

# 환경변수 설정
cp .env.example .env
# .env 파일에서 OPENAI_API_KEY= 에 키 입력

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn main:app --reload --port 8000
```

### 프론트엔드

```bash
cd frontend

npm install
npm run dev
# http://localhost:5173
```

> 프론트엔드 개발 서버(`vite.config.js`)는 `/upload`, `/chat`, `/session`, `/admin` 요청을 자동으로 `localhost:8000`으로 프록시합니다. 별도 CORS 설정 없이 동작합니다.

---

## 배포 구조

```
GitHub main 브랜치 push
        │
        ├── GitHub Actions CI
        │       └── pytest backend/tests/ -v
        │
        ├── [CI 통과] Render Deploy Hook
        │       └── 백엔드 자동 재배포
        │           https://doc-rag-chat.onrender.com
        │
        └── GitHub Actions Deploy
                └── npm run build (VITE_API_URL, VITE_BASE_URL=/doc-rag-chat/ 주입)
                    → GitHub Pages 자동 배포
                        https://yeonchohee.github.io/doc-rag-chat/
```

| 서비스 | 플랫폼 | 비고 |
|--------|--------|------|
| 백엔드 API | Render Free tier | 비활성 후 첫 요청 약 30초 콜드 스타트 |
| 프론트엔드 | GitHub Pages | CDN 배포, 빌드 시 API URL 주입 |
| 벡터 DB | ChromaDB (Render 디스크) | Render 재시작 시 초기화됨 |
| 메타 DB | SQLite (Render 디스크) | 동일 |

---

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/upload` | 문서 업로드 → 청킹 → 임베딩 → ChromaDB 저장 |
| `POST` | `/chat` | RAG 검색 + GPT-4o-mini 스트리밍 (SSE) |
| `GET` | `/session/{session_id}` | 세션 문서 목록 조회 |
| `DELETE` | `/session/{session_id}` | 세션 및 벡터 데이터 삭제 |
| `GET` | `/admin/sessions` | 전체 세션 목록 (Basic Auth) |
| `GET` | `/admin/sessions/{session_id}` | 세션 상세 + 질문 로그 |
| `GET` | `/health` | 헬스체크 |
