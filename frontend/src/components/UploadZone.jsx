import { useState, useRef } from 'react'
import { uploadDocument } from '../api/client'

const ACCEPTED = '.pdf,.txt,.docx'

export default function UploadZone({ sessionId, onUploaded }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const doc = await uploadDocument(sessionId, file)
      onUploaded(doc)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const borderClass = dragging
    ? 'border-[#aaff00] bg-[#aaff00]/5'
    : 'border-[#2a2a2a] hover:border-[#aaff00]/50'

  return (
    <div
      className={`border border-dashed rounded p-8 text-center cursor-pointer transition-all duration-150 ${borderClass}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#aaff00] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#aaff00] text-xs tracking-widest">인덱싱 중...</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[#555555] text-xs">드래그 또는 클릭</p>
          <p className="text-[#333333] text-xs">PDF · TXT · DOCX · max 10MB</p>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  )
}
