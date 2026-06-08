import { useState } from 'react'

export default function MessageBubble({ role, content, sources }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Role label */}
        <span className="text-[10px] text-[#333333] px-1">
          {isUser ? 'you' : 'ai'}
        </span>

        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded text-xs leading-relaxed whitespace-pre-wrap
            ${isUser
              ? 'bg-[#aaff00] text-[#0a0a0a] font-medium'
              : 'bg-[#161616] text-[#dddddd] border border-[#222222]'
            }`}
        >
          {content || (
            <span className="text-[#555555] italic">생성 중...</span>
          )}
        </div>

        {/* Sources toggle */}
        {sources && sources.length > 0 && (
          <button
            onClick={() => setShowSources(v => !v)}
            className="text-[10px] text-[#aaff00]/60 hover:text-[#aaff00] transition-colors px-1"
          >
            {showSources ? '출처 숨기기' : `출처 ${sources.length}개`}
          </button>
        )}

        {/* Sources list */}
        {showSources && (
          <div className="space-y-1.5 w-full">
            {sources.map((s, i) => (
              <div
                key={i}
                className="bg-[#111111] border border-[#1e1e1e] rounded p-3"
              >
                <p className="text-[10px] text-[#aaff00]/70 mb-1.5 truncate">{s.filename}</p>
                <p className="text-[10px] text-[#555555] line-clamp-3 leading-relaxed">{s.chunk_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
