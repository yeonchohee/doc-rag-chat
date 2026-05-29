export default function DocList({ documents, selectedIds, onToggle }) {
  if (documents.length === 0) return null

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-600 mb-2">업로드된 문서</p>
      <ul className="space-y-2">
        {documents.map(doc => (
          <li key={doc.doc_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              id={doc.doc_id}
              checked={selectedIds.includes(doc.doc_id)}
              onChange={() => onToggle(doc.doc_id)}
              className="w-4 h-4 accent-blue-500"
            />
            <label htmlFor={doc.doc_id} className="flex-1 cursor-pointer">
              <span className="text-sm font-medium text-gray-800 block truncate">{doc.filename}</span>
              <span className="text-xs text-gray-400">{doc.chunk_count}개 청크</span>
            </label>
          </li>
        ))}
      </ul>
      {documents.length > 1 && (
        <p className="text-xs text-gray-400 mt-2">
          {selectedIds.length === 0 ? '전체 문서 검색 중' : `${selectedIds.length}개 문서 선택됨`}
        </p>
      )}
    </div>
  )
}
