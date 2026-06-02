import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    from db.sqlite import init_db
    init_db()
    yield


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_session_not_found():
    response = client.get("/session/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_upload_wrong_type():
    response = client.post(
        "/upload",
        data={"session_id": "test-session"},
        files={"file": ("test.exe", b"bad content", "application/octet-stream")},
    )
    assert response.status_code == 400
