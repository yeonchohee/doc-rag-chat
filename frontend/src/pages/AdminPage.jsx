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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow p-8 w-80 flex flex-col gap-4">
          <h1 className="text-lg font-semibold text-gray-900">Admin</h1>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
        <span className="text-sm text-gray-400">세션 {sessions.length}개</span>
      </header>

      <div className="max-w-5xl mx-auto p-6 flex gap-6">
        {/* 세션 목록 */}
        <div className="w-80 shrink-0">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Sessions</p>
          <ul className="space-y-1">
            {sessions.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">세션 없음</p>
            )}
            {sessions.map(s => (
              <li key={s.session_id}>
                <button
                  onClick={() => handleSelectSession(s.session_id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${selected === s.session_id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-100 border border-transparent'}`}
                >
                  <p className="font-mono text-xs text-gray-600 truncate">{s.session_id}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>문서 {s.doc_count}개</span>
                    <span>질문 {s.question_count}개</span>
                    <span>{new Date(s.last_active).toLocaleDateString('ko-KR')}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 세션 상세 */}
        <div className="flex-1">
          {!selected && (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              세션을 선택하세요
            </div>
          )}

          {selected && loadingDetail && (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-4 border-blue-300 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {detail && (
            <div className="space-y-4">
              {/* 문서 목록 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  업로드 문서 ({detail.documents.length})
                </p>
                {detail.documents.length === 0 ? (
                  <p className="text-sm text-gray-400">없음</p>
                ) : (
                  <ul className="space-y-1">
                    {detail.documents.map(doc => (
                      <li key={doc.doc_id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate">{doc.filename}</span>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">{doc.chunk_count} chunks</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 채팅 로그 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  채팅 로그 ({detail.chat_logs.length})
                </p>
                {detail.chat_logs.length === 0 ? (
                  <p className="text-sm text-gray-400">없음</p>
                ) : (
                  <ul className="space-y-3">
                    {detail.chat_logs.map((log, i) => (
                      <li key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <p className="text-xs font-medium text-blue-600 mb-1">Q. {log.question}</p>
                        <p className="text-xs text-gray-600 line-clamp-3">{log.answer || '—'}</p>
                        <p className="text-xs text-gray-300 mt-1">
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
