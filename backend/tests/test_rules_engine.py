import pytest
from app.db.models import Claim
from app.agents.rules_engine import rules_engine

def test_rule_excessive_claim_to_value():
    claim = Claim(
        id="CLM-TEST-01",
        claimed_amount=19500.0,
        estimated_vehicle_value=20000.0,  # 97.5%
        policy_id="POL-123",
        claimant_id="CUST-1",
        claimant_name="Test User",
        incident_date="2026-08-01",
        incident_location="Main St",
        vehicle_make="Ford",
        vehicle_model="Escape",
        vehicle_year=2020,
        vehicle_vin="1FMCU0GD9LUA00001"
    )
    signals = rules_engine.evaluate_rules(claim, {}, {})
    rule_types = [s["signal_type"] for s in signals]
    assert "RULE_EXCESSIVE_CLAIM_TO_VALUE" in rule_types

def test_rule_suspicious_round_amount():
    claim = Claim(
        id="CLM-TEST-02",
        claimed_amount=5000.0,
        estimated_vehicle_value=25000.0,
        policy_id="POL-123",
        claimant_id="CUST-1",
        claimant_name="Test User",
        incident_date="2026-08-01",
        incident_location="Main St",
        vehicle_make="Honda",
        vehicle_model="Civic",
        vehicle_year=2022,
        vehicle_vin="1HGCV1F34NA000002"
    )
    extracted = {"invoice": {"total_amount": 5000.0}}
    signals = rules_engine.evaluate_rules(claim, extracted, {})
    rule_types = [s["signal_type"] for s in signals]
    assert "RULE_SUSPICIOUS_ROUND_AMOUNT" in rule_types

def test_rule_duplicate_estimate_items():
    claim = Claim(
        id="CLM-TEST-03",
        claimed_amount=3000.0,
        estimated_vehicle_value=20000.0,
        policy_id="POL-123",
        claimant_id="CUST-1",
        claimant_name="Test User",
        incident_date="2026-08-01",
        incident_location="Main St",
        vehicle_make="Toyota",
        vehicle_model="Corolla",
        vehicle_year=2021,
        vehicle_vin="2T1BURHE7MC000003"
    )
    extracted = {
        "repair_estimate": {
            "items": [
                {"part_name": "Front Bumper Cover", "part_cost": 400.0, "total_item_cost": 600.0},
                {"part_name": "Front Bumper Cover", "part_cost": 400.0, "total_item_cost": 600.0}
            ]
        }
    }
    signals = rules_engine.evaluate_rules(claim, extracted, {})
    rule_types = [s["signal_type"] for s in signals]
    assert "RULE_DUPLICATE_ESTIMATE_ITEMS" in rule_types

def test_rule_date_contradiction():
    claim = Claim(
        id="CLM-TEST-04",
        claimed_amount=2000.0,
        estimated_vehicle_value=20000.0,
        incident_date="2026-08-10",
        policy_id="POL-123",
        claimant_id="CUST-1",
        claimant_name="Test User",
        incident_location="Main St",
        vehicle_make="Toyota",
        vehicle_model="Corolla",
        vehicle_year=2021,
        vehicle_vin="2T1BURHE7MC000003"
    )
    extracted = {"police_report": {"incident_date": "2026-08-25"}}
    signals = rules_engine.evaluate_rules(claim, extracted, {})
    rule_types = [s["signal_type"] for s in signals]
    assert "RULE_DATE_CONTRADICTION" in rule_types
