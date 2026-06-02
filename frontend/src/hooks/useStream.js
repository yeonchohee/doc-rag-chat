import { useState, useCallback } from 'react'
import { streamChat } from '../api/client'

export function useStream() {
  const [streaming, setStreaming] = useState(false)

  const sendMessage = useCallback(async (sessionId, question, docIds, onChunk, onSources, onDone) => {
    setStreaming(true)
    try {
      const res = await streamChat(sessionId, question, docIds)
      if (!res.ok) throw new Error('Chat request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const payload = JSON.parse(raw)
            if (payload.type === 'chunk') onChunk(payload.content)
            else if (payload.type === 'sources') onSources(payload.content)
            else if (payload.type === 'done') onDone()
          } catch { /* ignore malformed events */ }
        }
      }
    } finally {
      setStreaming(false)
    }
  }, [])

  return { streaming, sendMessage }
}
