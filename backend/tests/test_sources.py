from services.rag import NOT_FOUND_ANSWER, select_sources


def chunk(text, distance):
    return {"chunk_text": text, "doc_id": "doc1", "filename": "a.pdf", "distance": distance}


def test_no_sources_when_answer_not_found():
    chunks = [chunk("a", 0.5), chunk("b", 0.6)]
    assert select_sources(chunks, f"{NOT_FOUND_ANSWER}.") == []


def test_keeps_only_chunks_within_distance_sorted():
    chunks = [chunk("far", 0.8), chunk("near", 0.4), chunk("mid", 0.6)]
    sources = select_sources(chunks, "6개월 이상 선결제 시 10% 할인됩니다.")
    assert [s["chunk_text"] for s in sources] == ["near", "mid"]
    assert "distance" not in sources[0]


def test_falls_back_to_closest_chunk_when_none_within_distance():
    chunks = [chunk("far", 0.9), chunk("closer", 0.75)]
    sources = select_sources(chunks, "주말에도 출입할 수 있습니다.")
    assert [s["chunk_text"] for s in sources] == ["closer"]


def test_no_sources_without_chunks():
    assert select_sources([], "아무 답변") == []
