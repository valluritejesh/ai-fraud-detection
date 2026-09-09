import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_investigation_override_and_decision():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        claim_id = "CLM-SCENARIO-B"

        # Check original claim AI scores before override
        c_before = await ac.get(f"/api/v1/claims/{claim_id}")
        assert c_before.status_code == 200
        original_ai_score = c_before.json()["ai_risk_score"]
        assert original_ai_score >= 80.0

        # Add investigator note
        note_res = await ac.post(f"/api/v1/investigations/claim/{claim_id}/notes", json={
            "author": "Special Investigator Davis",
            "text": "Interviewed body shop owner. Receipts appear altered."
        })
        assert note_res.status_code == 200
        case_data = note_res.json()
        assert len(case_data["investigator_notes"]) >= 1

        # Perform human AI override to 95.0
        override_res = await ac.post(f"/api/v1/investigations/claim/{claim_id}/override", json={
            "override_score": 95.0,
            "override_reason": "Confirmed forged receipts after vendor subpoena.",
            "investigator": "SIU Lead Vance"
        })
        assert override_res.status_code == 200
        case_override = override_res.json()
        assert case_override["ai_risk_overridden"] is True
        assert case_override["override_score"] == 95.0
        assert case_override["final_effective_score"] == 95.0

        # Verify claim preserves original AI score separately from override score
        c_after = await ac.get(f"/api/v1/claims/{claim_id}")
        assert c_after.status_code == 200
        after_data = c_after.json()
        assert after_data["ai_risk_score"] == original_ai_score  # NEVER OVERWRITTEN!
        assert after_data["override_risk_score"] == 95.0
        assert after_data["final_risk_score"] == 95.0

        # Submit final decision
        decision_res = await ac.post(f"/api/v1/investigations/claim/{claim_id}/final-decision", json={
            "decision": "REJECTED",
            "reason": "Fraudulent claim denied under policy Section 8 fraud clause.",
            "decided_by": "Director of SIU"
        })
        assert decision_res.status_code == 200
        final_data = decision_res.json()
        assert final_data["final_decision"] == "REJECTED"
        assert final_data["status"] == "RESOLVED"
