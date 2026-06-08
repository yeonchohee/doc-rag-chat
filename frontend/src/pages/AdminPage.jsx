import { useState } from 'react'
import { fetchAdminSessions, fetchAdminSessionDetail } from '../api/client'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    try {
      const data = await fetchAdminSessions(password)
      setSessions(data.sessions)
      setAuthed(true)
    } catch (err) {
      setError(err.message === '401' ? '비밀번호가 틀렸습니다' : '서버 오류가 발생했습니다')
    }
  }

  async function handleSelectSession(sessionId) {
    if (selected === sessionId) {
      setSelected(null)
      setDetail(null)
      return
    }
    setSelected(sessionId)
    setDetail(null)
    setLoadingDetail(true)
    try {
      const data = await fetchAdminSessionDetail(sessionId, password)
      setDetail(data)
    } finally {
      setLoadingDetail(false)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-[#0f0f0f] border border-[#1e1e1e] rounded p-8 w-80 flex flex-col gap-4">
          <div>
            <p className="text-[#aaff00] text-sm font-medium">admin</p>
            <p className="text-[#333333] text-xs mt-0.5">doc-rag-chat</p>
          </div>
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-[#111111] border border-[#222222] rounded px-3 py-2 text-xs text-[#e0e0e0] placeholder-[#333333]
              focus:outline-none focus:border-[#aaff00]/50 transition-colors"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="bg-[#aaff00] hover:bg-[#bbff33] text-[#0a0a0a] rounded py-2 text-xs font-medium transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="bg-[#0f0f0f] border-b border-[#1e1e1e] px-6 py-3 flex items-center justify-between">
        <span className="text-[#aaff00] text-sm font-medium">admin</span>
        <span className="text-[#444444] text-xs">세션 {sessions.length}개</span>
      </header>

      <div className="max-w-5xl mx-auto p-6 flex gap-5 w-full">
        {/* Session list */}
        <div className="w-72 shrink-0">
          <p className="text-[10px] text-[#444444] uppercase tracking-widest mb-3">Sessions</p>
          <ul className="space-y-1">
            {sessions.length === 0 && (
              <p className="text-xs text-[#333333] py-6 text-center">세션 없음</p>
            )}
            {sessions.map(s => (
              <li key={s.session_id}>
                <button
                  onClick={() => handleSelectSession(s.session_id)}
                  className={`w-full text-left px-3 py-2.5 rounded text-xs transition-colors
                    ${selected === s.session_id
                      ? 'bg-[#161616] border border-[#aaff00]/30 text-[#aaff00]'
                      : 'hover:bg-[#141414] border border-transparent text-[#888888]'
                    }`}
                >
                  <p className="truncate text-[10px] mb-1">{s.session_id}</p>
                  <div className="flex gap-3 text-[10px] text-[#444444]">
                    <span>문서 {s.doc_count}</span>
                    <span>질문 {s.question_count}</span>
                    <span>{new Date(s.last_active).toLocaleDateString('ko-KR')}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail */}
        <div className="flex-1 min-w-0">
          {!selected && (
            <div className="flex items-center justify-center h-48 text-[#333333] text-xs">
              세션을 선택하세요
            </div>
          )}

          {selected && loadingDetail && (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 border-[#aaff00] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {detail && (
            <div className="space-y-4">
              {/* Documents */}
              <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded p-4">
                <p className="text-[10px] text-[#444444] uppercase tracking-widest mb-3">
                  Documents ({detail.documents.length})
                </p>
                {detail.documents.length === 0 ? (
                  <p className="text-xs text-[#333333]">없음</p>
                ) : (
                  <ul className="space-y-1.5">
                    {detail.documents.map(doc => (
                      <li key={doc.doc_id} className="flex items-center justify-between text-xs">
                        <span className="text-[#cccccc] truncate">{doc.filename}</span>
                        <span className="text-[10px] text-[#444444] shrink-0 ml-3">{doc.chunk_count} chunks</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Chat logs */}
              <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded p-4">
                <p className="text-[10px] text-[#444444] uppercase tracking-widest mb-3">
                  Chat Logs ({detail.chat_logs.length})
                </p>
                {detail.chat_logs.length === 0 ? (
                  <p className="text-xs text-[#333333]">없음</p>
                ) : (
                  <ul className="space-y-4">
                    {detail.chat_logs.map((log, i) => (
                      <li key={i} className="border-b border-[#1a1a1a] pb-4 last:border-0 last:pb-0">
                        <p className="text-[10px] text-[#aaff00]/70 mb-1.5">Q. {log.question}</p>
                        <p className="text-[10px] text-[#555555] line-clamp-3 leading-relaxed">
                          {log.answer || '—'}
                        </p>
                        <p className="text-[10px] text-[#2a2a2a] mt-1.5">
                          {new Date(log.created_at).toLocaleString('ko-KR')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
