import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_create_and_get_claim():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "policy_id": "POL-TEST-99",
            "claimant_id": "CUST-TEST-1",
            "claimant_name": "Integration Tester",
            "claimant_email": "test@example.com",
            "incident_date": "2026-08-01",
            "incident_location": "Test Blvd",
            "vehicle_make": "Toyota",
            "vehicle_model": "Camry",
            "vehicle_year": 2022,
            "vehicle_vin": "4T1B11HK5JU000099",
            "estimated_vehicle_value": 22000.0,
            "claimed_amount": 1800.0
        }
        res = await ac.post("/api/v1/claims", json=payload)
        assert res.status_code == 201
        data = res.json()
        claim_id = data["id"]
        assert claim_id.startswith("CLM-")
        assert data["status"] == "CLAIM_RECEIVED"

        # Fetch detail
        res2 = await ac.get(f"/api/v1/claims/{claim_id}")
        assert res2.status_code == 200
        detail = res2.json()
        assert detail["id"] == claim_id
        assert detail["claimant_name"] == "Integration Tester"

@pytest.mark.asyncio
async def test_upload_evidence_and_audit():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create claim first
        c_res = await ac.post("/api/v1/claims", json={
            "policy_id": "POL-UP-01",
            "claimant_id": "CUST-UP-1",
            "claimant_name": "Uploader",
            "incident_date": "2026-08-05",
            "incident_location": "Upload Ave",
            "vehicle_make": "Honda",
            "vehicle_model": "Civic",
            "vehicle_year": 2021,
            "vehicle_vin": "1HGCV1F34NA000055",
            "claimed_amount": 1200.0
        })
        claim_id = c_res.json()["id"]

        # Upload evidence
        files = {"file": ("estimate.json", b"{\"repair_shop\": \"Auto Docs\", \"total_cost\": 1200.0}", "application/json")}
        data = {"document_type": "repair_estimate"}
        res = await ac.post(f"/api/v1/claims/{claim_id}/evidence", files=files, data=data)
        assert res.status_code == 200
        ev_data = res.json()
        assert ev_data["document_type"] == "repair_estimate"
        assert len(ev_data["sha256_hash"]) == 64

        # Verify audit trail
        audit_res = await ac.get(f"/api/v1/claims/{claim_id}/audit-trail")
        assert audit_res.status_code == 200
        logs = audit_res.json()
        actions = [l["action"] for l in logs]
        assert "CLAIM_CREATED" in actions
        assert "EVIDENCE_UPLOADED" in actions
