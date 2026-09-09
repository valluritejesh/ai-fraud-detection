import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_scenario_a_normal_legitimate_claim():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/claims/CLM-SCENARIO-A")
        assert res.status_code == 200
        data = res.json()
        assert data["risk_score"] <= 30.0
        assert data["risk_level"] == "LOW"
        assert data["status"] == "NORMAL_PROCESSING"

@pytest.mark.asyncio
async def test_scenario_b_suspicious_cost_anomaly():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/claims/CLM-SCENARIO-B")
        assert res.status_code == 200
        data = res.json()
        assert data["risk_score"] >= 65.0
        assert data["risk_level"] in ["HIGH", "CRITICAL"]
        sig_types = [s["signal_type"] for s in data["fraud_signals"]]
        assert any("EXCESSIVE" in s or "SHOP" in s for s in sig_types)

@pytest.mark.asyncio
async def test_scenario_c_document_date_inconsistency():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/claims/CLM-SCENARIO-C")
        assert res.status_code == 200
        data = res.json()
        assert data["risk_score"] >= 65.0
        assert data["risk_level"] == "HIGH"
        sig_types = [s["signal_type"] for s in data["fraud_signals"]]
        assert "DATE_CONFLICT_CLAIM_VS_POLICE" in sig_types

@pytest.mark.asyncio
async def test_scenario_d_estimate_photo_mismatch():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/claims/CLM-SCENARIO-D")
        assert res.status_code == 200
        data = res.json()
        assert data["risk_score"] >= 65.0
        assert data["risk_level"] == "HIGH"
        sig_types = [s["signal_type"] for s in data["fraud_signals"]]
        assert "ESTIMATE_PHOTO_DAMAGE_MISMATCH" in sig_types

@pytest.mark.asyncio
async def test_scenario_e_duplicate_recycled_invoice():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/claims/CLM-SCENARIO-E")
        assert res.status_code == 200
        data = res.json()
        assert data["risk_score"] >= 65.0
        assert data["risk_level"] in ["HIGH", "CRITICAL"]
        sig_types = [s["signal_type"] for s in data["fraud_signals"]]
        assert "DUPLICATE_INVOICE_RECYCLED" in sig_types

@pytest.mark.asyncio
async def test_scenario_f_historical_frequency_anomaly():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/claims/CLM-SCENARIO-F")
        assert res.status_code == 200
        data = res.json()
        assert data["risk_score"] >= 60.0
        assert data["risk_level"] in ["HIGH", "CRITICAL"]
        sig_types = [s["signal_type"] for s in data["fraud_signals"]]
        assert "CLAIM_FREQUENCY_SPIKE" in sig_types
