import pytest
from app.agents.risk_engine import risk_engine

def test_risk_scoring_clean_claim():
    score, level, breakdown, explanation, action = risk_engine.calculate_risk([], 1500.0)
    assert score <= 10.0
    assert level == "LOW"
    assert action == "FAST_TRACK_PAYMENT"
    assert "LOW risk profile" in explanation

def test_risk_scoring_high_signals():
    signals = [
        {"category": "RULES_ENGINE", "score_impact": 25.0, "severity": "HIGH", "signal_type": "RULE_EXCESSIVE_CLAIM", "description": "Excess claim"},
        {"category": "VERIFICATION_DISCREPANCY", "score_impact": 40.0, "severity": "CRITICAL", "signal_type": "DATE_CONFLICT", "description": "Dates do not match"},
        {"category": "VISION_MISMATCH", "score_impact": 20.0, "severity": "MEDIUM", "signal_type": "DAMAGE_MISMATCH", "description": "Visual mismatch"}
    ]
    score, level, breakdown, explanation, action = risk_engine.calculate_risk(signals, 8000.0)
    assert score == 85.0
    assert level == "CRITICAL"
    assert action == "IMMEDIATE_CLAIM_FREEZE_AND_AUDIT"
    assert "CRITICAL" in explanation
    assert "Key Risk Drivers" in explanation

def test_risk_scoring_cap_at_100():
    signals = [
        {"category": "RULES_ENGINE", "score_impact": 60.0, "severity": "CRITICAL", "signal_type": "S1", "description": "D1"},
        {"category": "HISTORICAL_ANOMALY", "score_impact": 70.0, "severity": "CRITICAL", "signal_type": "S2", "description": "D2"}
    ]
    score, level, breakdown, explanation, action = risk_engine.calculate_risk(signals, 15000.0)
    assert score == 100.0
    assert level == "CRITICAL"
