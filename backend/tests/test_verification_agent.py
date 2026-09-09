import pytest
from app.db.models import Claim
from app.agents.verification_agent import verification_agent

def test_date_conflict_claim_vs_police():
    claim = Claim(
        id="CLM-VERIF-1",
        incident_date="2026-08-10",
        claimed_amount=2500.0,
        policy_id="POL-1",
        claimant_id="CUST-1",
        claimant_name="Alice",
        incident_location="Broadway",
        vehicle_make="Honda",
        vehicle_model="Civic",
        vehicle_year=2021,
        vehicle_vin="1HGCV1F34NA000001"
    )
    docs = {"police_report": {"incident_date": "2026-08-25", "incident_location": "Broadway"}}
    evidence_id_map = {"claim_form": "EVD-001", "police_report": "EVD-002"}

    discrepancies = verification_agent.verify_all_evidence(claim, docs, [], evidence_id_map)
    sig_types = [d["signal_type"] for d in discrepancies]
    assert "DATE_CONFLICT_CLAIM_VS_POLICE" in sig_types
    match = next(d for d in discrepancies if d["signal_type"] == "DATE_CONFLICT_CLAIM_VS_POLICE")
    assert "EVD-002" in match["evidence_refs"]

def test_vin_mismatch_claim_vs_estimate():
    claim = Claim(
        id="CLM-VERIF-2",
        incident_date="2026-08-10",
        claimed_amount=3000.0,
        policy_id="POL-1",
        claimant_id="CUST-1",
        claimant_name="Bob",
        incident_location="Elm St",
        vehicle_make="Ford",
        vehicle_model="F150",
        vehicle_year=2020,
        vehicle_vin="1FTFW1E84KFA00001"
    )
    docs = {"repair_estimate": {"vehicle_vin": "1FTFW1E84KFA99999", "total_cost": 3000.0}}
    evidence_id_map = {"repair_estimate": "EVD-003"}

    discrepancies = verification_agent.verify_all_evidence(claim, docs, [], evidence_id_map)
    sig_types = [d["signal_type"] for d in discrepancies]
    assert "VIN_MISMATCH_CLAIM_VS_ESTIMATE" in sig_types
