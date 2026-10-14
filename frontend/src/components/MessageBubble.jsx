import { useState } from 'react'
import Markdown from 'react-markdown'

// AI 답변은 마크다운으로 오므로 목록·강조를 렌더링한다. 테마에 맞춰 최소한의 스타일만 준다.
const markdownComponents = {
  p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-[#aaff00]">{children}</strong>,
  code: ({ children }) => <code className="bg-[#0a0a0a] px-1 rounded">{children}</code>,
}

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
          className={`px-4 py-3 rounded text-xs leading-relaxed
            ${isUser
              ? 'bg-[#aaff00] text-[#0a0a0a] font-medium whitespace-pre-wrap'
              : 'bg-[#161616] text-[#dddddd] border border-[#222222]'
            }`}
        >
          {!content ? (
            <span className="text-[#555555] italic">생성 중...</span>
          ) : isUser ? (
            content
          ) : (
            <Markdown components={markdownComponents}>{content}</Markdown>
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
