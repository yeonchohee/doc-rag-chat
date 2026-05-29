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
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
        ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
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
        <div className="flex flex-col items-center gap-2 text-blue-500">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">인덱싱 중...</span>
        </div>
      ) : (
        <div className="text-gray-500">
          <p className="text-lg font-medium">문서를 드래그하거나 클릭해서 업로드</p>
          <p className="text-sm mt-1">PDF · TXT · DOCX (최대 10MB)</p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  )
}
