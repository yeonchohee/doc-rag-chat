import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import UploadZone from './components/UploadZone'
import DocList from './components/DocList'
import ChatWindow from './components/ChatWindow'
import AdminPage from './pages/AdminPage'

function MainPage() {
  const { sessionId, documents, loading, addDocument, resetSession } = useSession()
  const [selectedIds, setSelectedIds] = useState([])

  function toggleDoc(docId) {
    setSelectedIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">doc-rag-chat</h1>
          <p className="text-xs text-gray-400">문서를 업로드하고 AI와 대화하세요</p>
        </div>
        <button
          onClick={resetSession}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          새 세션
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden max-w-5xl w-full mx-auto">
        <aside className="w-72 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
          <UploadZone sessionId={sessionId} onUploaded={addDocument} />
          <DocList documents={documents} selectedIds={selectedIds} onToggle={toggleDoc} />
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {documents.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              왼쪽에서 문서를 업로드하면 대화를 시작할 수 있어요
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
