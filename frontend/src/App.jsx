import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import UploadZone from './components/UploadZone'
import DocList from './components/DocList'
import ChatWindow from './components/ChatWindow'
import AdminPage from './pages/AdminPage'

function LoadingScreen({ serverWaking }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center space-y-5">
        <div className="w-7 h-7 border-2 border-[#aaff00] border-t-transparent rounded-full animate-spin mx-auto" />
        {serverWaking ? (
          <>
            <p className="text-[#aaff00] text-sm tracking-widest">서버 깨우는 중...</p>
            <p className="text-[#444444] text-xs leading-relaxed">
              Render 무료 플랜 서버가 슬립 상태입니다<br />
              최대 30초 소요될 수 있어요
            </p>
          </>
        ) : (
          <p className="text-[#444444] text-xs tracking-widest">connecting...</p>
        )}
      </div>
    </div>
  )
}

function MainPage() {
  const { sessionId, documents, loading, serverWaking, addDocument, resetSession } = useSession()
  const [selectedIds, setSelectedIds] = useState([])

  function toggleDoc(docId) {
    setSelectedIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  if (loading) return <LoadingScreen serverWaking={serverWaking} />

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="bg-[#0f0f0f] border-b border-[#1e1e1e] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#aaff00] text-sm font-medium tracking-tight">doc-rag-chat</span>
          <span className="text-[#2a2a2a] text-xs">|</span>
          <span className="text-[#444444] text-xs">RAG · PDF · TXT · DOCX</span>
        </div>
        <button
          onClick={resetSession}
          className="text-xs text-[#444444] hover:text-[#aaff00] transition-colors tracking-wide"
        >
          새 세션
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden max-w-5xl w-full mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-72 bg-[#0f0f0f] border-r border-[#1e1e1e] p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
          <UploadZone sessionId={sessionId} onUploaded={addDocument} />
          <DocList documents={documents} selectedIds={selectedIds} onToggle={toggleDoc} />
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {documents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
              <p className="text-[#2a2a2a] text-4xl font-medium">&gt;_</p>
              <p className="text-[#444444] text-xs leading-relaxed">
                왼쪽에서 문서를 업로드하면<br />대화를 시작할 수 있어요
              </p>
            </div>
          ) : (
            <ChatWindow sessionId={sessionId} selectedDocIds={selectedIds} />
          )}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
