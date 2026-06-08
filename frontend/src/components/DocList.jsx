export default function DocList({ documents, selectedIds, onToggle }) {
  if (documents.length === 0) return null

  return (
    <div className="mt-2">
      <p className="text-[#444444] text-xs tracking-widest uppercase mb-3">Documents</p>
      <ul className="space-y-1">
        {documents.map(doc => (
          <li key={doc.doc_id}>
            <label
              htmlFor={doc.doc_id}
              className="flex items-start gap-3 px-2 py-2 rounded cursor-pointer hover:bg-[#161616] transition-colors group"
            >
              <input
                type="checkbox"
                id={doc.doc_id}
                checked={selectedIds.includes(doc.doc_id)}
                onChange={() => onToggle(doc.doc_id)}
                className="mt-0.5 w-3.5 h-3.5 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs text-[#cccccc] block truncate group-hover:text-[#eeeeee] transition-colors">
                  {doc.filename}
                </span>
                <span className="text-[10px] text-[#444444]">{doc.chunk_count} chunks</span>
              </div>
            </label>
          </li>
        ))}
      </ul>
      {documents.length > 1 && (
        <p className="text-[10px] text-[#333333] mt-3 px-2">
          {selectedIds.length === 0
            ? '전체 문서 검색 중'
            : `${selectedIds.length}개 문서 선택됨`}
        </p>
      )}
    </div>
  )
}
