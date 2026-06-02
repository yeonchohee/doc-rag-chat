import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '../api/client'

const SESSION_KEY = 'doc_rag_session_id'

export function useSession() {
  const [sessionId, setSessionId] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      let id = localStorage.getItem(SESSION_KEY)
      if (!id) {
        id = uuidv4()
        localStorage.setItem(SESSION_KEY, id)
      }

      setSessionId(id)

      const session = await getSession(id).catch(() => null)
      if (session) {
        setDocuments(session.documents || [])
      }
      setLoading(false)
    }
    init()
  }, [])

  function addDocument(doc) {
    setDocuments(prev => [doc, ...prev])
  }

  function resetSession() {
    const id = uuidv4()
    localStorage.setItem(SESSION_KEY, id)
    setSessionId(id)
    setDocuments([])
  }

  return { sessionId, documents, loading, addDocument, resetSession }
}
