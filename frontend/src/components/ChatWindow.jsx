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
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 && (
          <p className="text-center text-[#333333] text-xs mt-10">
            질문을 입력하세요
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            sources={msg.sources}
          />
        ))}

        {/* Typing indicator */}
        {streaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start pl-1">
            <div className="flex gap-1.5 items-center">
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 bg-[#aaff00] rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1e1e1e] p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="질문을 입력하세요..."
            disabled={streaming}
            className="flex-1 bg-[#111111] border border-[#222222] rounded px-4 py-2.5 text-xs text-[#e0e0e0] placeholder-[#333333]
              focus:outline-none focus:border-[#aaff00]/50
              disabled:opacity-40 transition-colors"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="bg-[#aaff00] hover:bg-[#bbff33] disabled:bg-[#1e1e1e] disabled:text-[#333333]
              text-[#0a0a0a] px-5 py-2.5 rounded text-xs font-medium transition-colors"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  )
}
