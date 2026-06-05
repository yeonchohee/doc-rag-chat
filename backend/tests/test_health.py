import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_session_auto_created(client):
    response = client.get("/session/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "00000000-0000-0000-0000-000000000000"
    assert data["documents"] == []


def test_upload_wrong_type(client):
    response = client.post(
        "/upload",
        data={"session_id": "test-session"},
        files={"file": ("test.exe", b"bad content", "application/octet-stream")},
    )
    assert response.status_code == 400
