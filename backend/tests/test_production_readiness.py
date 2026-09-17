import pytest
import datetime
from pathlib import Path
from httpx import AsyncClient, ASGITransport
import jwt

from app.main import app
from app.core.config import settings
from app.core.auth import (
    create_access_token,
    decode_token,
    InvestigatorUser,
    get_current_investigator,
)
from app.services.storage import (
    LocalEvidenceStorage,
    get_storage_service,
)
from app.db.session import get_normalized_database_url


@pytest.mark.asyncio
async def test_local_evidence_storage(tmp_path):
    """Verifies that LocalEvidenceStorage saves, calculates SHA-256, reads back, and deletes."""
    storage = LocalEvidenceStorage(base_dir=tmp_path)
    sample_content = b"FraudGuard evidence test bytes 12345"
    claim_id = "CLM-TEST-STORAGE"
    fname = "invoice_sample.pdf"

    path_str, sha256_h, size = await storage.save_evidence(
        file_bytes=sample_content,
        filename=fname,
        claim_id=claim_id,
        content_type="application/pdf"
    )

    assert Path(path_str).exists()
    assert size == len(sample_content)
    assert len(sha256_h) == 64

    # Read back
    read_bytes = await storage.read_evidence(path_str)
    assert read_bytes == sample_content

    # Check exists
    assert await storage.exists(path_str) is True

    # Delete
    deleted = await storage.delete_evidence(path_str)
    assert deleted is True
    assert await storage.exists(path_str) is False


def test_storage_service_factory():
    """Verifies factory returns LocalEvidenceStorage under default/local configuration."""
    service = get_storage_service()
    assert isinstance(service, LocalEvidenceStorage)


def test_normalized_database_url():
    """Verifies database URL normalization for async PostgreSQL drivers."""
    pg_url = "postgres://user:pass@host:5432/dbname"
    normalized = get_normalized_database_url(pg_url)
    assert normalized.startswith("postgresql+asyncpg://")

    pg_url_std = "postgresql://user:pass@host:5432/dbname"
    normalized_std = get_normalized_database_url(pg_url_std)
    assert normalized_std.startswith("postgresql+asyncpg://")

    sqlite_url = "sqlite+aiosqlite:///./test.db"
    assert get_normalized_database_url(sqlite_url) == sqlite_url


@pytest.mark.asyncio
async def test_error_handling_preserves_404_and_422():
    """Verifies that HTTPException (404) and ValidationError (422) are not masked into 500."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        # 404 test on nonexistent claim investigation status
        res_404 = await ac.get("/api/v1/investigations/NON-EXISTENT-ID/status")
        assert res_404.status_code == 404
        assert res_404.json()["detail"] == "Investigation not found in active registry"

        # 422 test on invalid JSON payload
        res_422 = await ac.post("/api/v1/claims", json={"policy_id": 12345, "claimed_amount": "not-a-float"})
        assert res_422.status_code == 422
        assert "detail" in res_422.json()


def test_auth_jwt_creation_and_decoding():
    """Verifies JWT token encoding and decoding."""
    token = create_access_token(
        {"sub": "investigator-007", "name": "Jane Vance", "role": "SUPERVISOR"},
        expires_delta=datetime.timedelta(minutes=15)
    )
    payload = decode_token(token)
    assert payload["sub"] == "investigator-007"
    assert payload["name"] == "Jane Vance"
    assert payload["role"] == "SUPERVISOR"


@pytest.mark.asyncio
async def test_auth_dev_mode_bypass():
    """Verifies that development mode returns default investigator when auth is bypassed."""
    class DummyRequest:
        headers = {}

    user = await get_current_investigator(request=DummyRequest(), credentials=None)
    assert user.role == "INVESTIGATOR"
    assert "override" in user.scopes
    assert "decide" in user.scopes
