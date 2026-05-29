const BASE_URL = import.meta.env.VITE_API_URL || ''

export async function uploadDocument(sessionId, file) {
  const form = new FormData()
  form.append('file', file)
  form.append('session_id', sessionId)

  const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export async function getSession(sessionId) {
  const res = await fetch(`${BASE_URL}/session/${sessionId}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch session')
  return res.json()
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${BASE_URL}/session/${sessionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete session')
  return res.json()
}

export function streamChat(sessionId, question, docIds = []) {
  return fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, question, doc_ids: docIds }),
  })
}
