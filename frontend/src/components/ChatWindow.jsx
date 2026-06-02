import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import { useStream } from '../hooks/useStream'

export default function ChatWindow({ sessionId, selectedDocIds }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const { streaming, sendMessage } = useStream()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    const question = input.trim()
    if (!question || streaming) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])

    const assistantIndex = messages.length + 1
    setMessages(prev => [...prev, { role: 'assistant', content: '', sources: null }])

    await sendMessage(
      sessionId,
      question,
      selectedDocIds,
      (chunk) => {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      },
      (sources) => {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], sources }
          return updated
        })
      },
      () => {},
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">문서를 업로드하고 질문해보세요</p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} sources={msg.sources} />
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="문서에 대해 질문하세요..."
          disabled={streaming}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          전송
        </button>
      </form>
    </div>
  )
}
