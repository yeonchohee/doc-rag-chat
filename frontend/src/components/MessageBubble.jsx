import { useState } from 'react'

export default function MessageBubble({ role, content, sources }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed
            ${isUser
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}
        >
          {content}
        </div>

        {sources && sources.length > 0 && (
          <button
            onClick={() => setShowSources(v => !v)}
            className="text-xs text-blue-400 hover:text-blue-600 self-start pl-1"
          >
            {showSources ? '출처 숨기기' : `출처 ${sources.length}개 보기`}
          </button>
        )}

        {showSources && (
          <div className="space-y-1 w-full">
            {sources.map((s, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-500 mb-1">{s.filename}</p>
                <p className="text-xs text-gray-600 line-clamp-3">{s.chunk_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
