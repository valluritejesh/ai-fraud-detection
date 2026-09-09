import httpx
import json
import time

BASE_URL = "http://localhost:8000"

def log_pass(msg):
    print(f"[PASS] {msg}")

def log_info(msg):
    print(f"       -> {msg}")

def test_live_workflow():
    print("==================================================================")
    print("FRAUDGUARD AI - LIVE SERVER & SCENARIO COMPREHENSIVE VALIDATION")
    print("==================================================================")

    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    # 1. System Telemetry
    print("\n--- 1. Checking System Telemetry (/api/v1/health) ---")
    res = client.get("/api/v1/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    log_pass(f"System status: {health['status']} | Uptime: {health['uptime_seconds']}s | DB latency: {health['database']['latency_ms']}ms")
    log_pass(f"All 6 agents active: {list(health['agents'].keys())}")
    log_pass(f"Metrics: Total Claims={health['metrics']['total_claims']}, High/Crit={health['metrics']['high_critical_risk_claims']}")

    # 2. Inspect All 6 Target Scenarios (A - F)
    print("\n--- 2. Validating All Six Benchmark Scenarios (A - F) ---")
    scenarios_expected = {
        "CLM-SCENARIO-A": {
            "expected_level": "LOW",
            "max_score": 30.0,
            "description": "Legitimate claim with normal damage and consistent documentation."
        },
        "CLM-SCENARIO-B": {
            "expected_level": "CRITICAL",
            "min_score": 80.0,
            "description": "Cost anomaly, recycled invoice from prior denied claim, suspicious body shop ring."
        },
        "CLM-SCENARIO-C": {
            "expected_level": "HIGH",
            "min_score": 60.0,
            "description": "Date discrepancy where police report date precedes the stated accident date."
        },
        "CLM-SCENARIO-D": {
            "expected_level": "HIGH",
            "min_score": 60.0,
            "description": "Ghost repair: damage photo shows bumper scratch, estimate bills rear quarter + suspension."
        },
        "CLM-SCENARIO-E": {
            "expected_level": "HIGH",
            "min_score": 60.0,
            "description": "Recycled invoice SHA-256 hash matching prior denied fraudulent claim."
        },
        "CLM-SCENARIO-F": {
            "expected_level": "HIGH",
            "min_score": 60.0,
            "description": "Claimant velocity spike (multiple claims in window) and adversarial prompt injection."
        },
    }

    for claim_id, exp in scenarios_expected.items():
        res = client.get(f"/api/v1/claims/{claim_id}")
        assert res.status_code == 200, f"Failed to retrieve {claim_id}: {res.text}"
        c = res.json()

        log_pass(f"Scenario {claim_id}: AI Score={c['ai_risk_score']} | Level={c['ai_risk_level']} | Expected={exp['expected_level']}")
        assert c["ai_risk_level"] == exp["expected_level"], f"Expected {exp['expected_level']} but got {c['ai_risk_level']}"
        if "max_score" in exp:
            assert c["ai_risk_score"] <= exp["max_score"]
        if "min_score" in exp:
            assert c["ai_risk_score"] >= exp["min_score"]

        # Verify explainability: explanation exists and details the rationale
        assessments = c.get("risk_assessments", [])
        assert len(assessments) > 0, f"No risk assessment found for {claim_id}"
        explanation = assessments[0].get("explanation", "")
        assert len(explanation) > 50, f"Explanation too short or missing for {claim_id}"
        log_info(f"Top Signal: {c.get('top_signal')}")
        log_info(f"Explanation Preview: {explanation.splitlines()[0]}")

        # Verify evidence items
        ev_items = c.get("evidence_items", [])
        log_info(f"Evidence Attached: {len(ev_items)} items {[e['document_type'] for e in ev_items]}")
        for ev in ev_items:
            mode = ev.get("provider_mode", "")
            assert any(m in mode for m in ["LOCAL", "MOCK", "AZURE"]), f"Unexpected provider mode: {mode}"

        # Verify triggered signals
        signals = c.get("fraud_signals", [])
        log_info(f"Signals Triggered ({len(signals)}): {[s['signal_type'] for s in signals]}")

    # 3. Real User Investigation Workflow on CLM-SCENARIO-B
    print("\n--- 3. Testing Real Investigator Workflow on CLM-SCENARIO-B ---")
    target_id = "CLM-SCENARIO-B"

    # Step 3.1: Read initial state
    res = client.get(f"/api/v1/claims/{target_id}")
    initial_claim = res.json()
    initial_ai_score = initial_claim["ai_risk_score"]
    assert initial_ai_score == 85.0
    log_pass(f"Baseline Score confirmed: AI={initial_ai_score}, Level={initial_claim['ai_risk_level']}")

    # Step 3.2: Add investigator note
    note_text = "SIU interview conducted with shop manager. Inconsistent ledger confirmed."
    res = client.post(f"/api/v1/investigations/claim/{target_id}/notes",
                      json={"text": note_text, "author": "Detective Miller"})
    assert res.status_code == 200
    log_pass("Investigator note appended.")

    # Step 3.3: Override AI risk
    override_score = 92
    override_reason = "Physical parts inspection proved front bumper was never replaced."
    res = client.post(f"/api/v1/investigations/claim/{target_id}/override",
                      json={"override_score": override_score, "override_reason": override_reason, "investigator": "Detective Miller"})
    assert res.status_code == 200
    case_res = res.json()
    log_pass("AI Risk Override committed.")
    assert case_res["original_ai_score"] == initial_ai_score, "Original AI score must be preserved!"
    assert case_res["override_score"] == 92.0
    assert case_res["final_effective_score"] == 92.0
    log_pass(f"Score Hierarchy Verified: AI={case_res['original_ai_score']} -> Override={case_res['override_score']} -> Effective Final={case_res['final_effective_score']}")

    # Step 3.4: Make Final Human Decision
    res = client.post(f"/api/v1/investigations/claim/{target_id}/final-decision",
                      json={"decision": "REJECTED", "reason": "Confirmed staged collision & billing inflation.", "decided_by": "Chief Adjuster Vance"})
    assert res.status_code == 200
    dec_res = res.json()
    log_pass(f"Final Human Determination Committed: {dec_res['final_decision']} by {dec_res['decided_by']}")

    # Step 3.5: Core Claims Integration Sync
    res = client.post(f"/api/v1/external-claims/sync/{target_id}",
                      json={"external_system": "Guidewire ClaimCenter", "target_environment": "simulation"})
    assert res.status_code == 200
    sync_res = res.json()
    log_pass(f"External Core Claims Sync Verified: {sync_res['external_reference_id']} ({sync_res['sync_status']})")

    # Step 3.6: Verify Audit Timeline
    res = client.get(f"/api/v1/claims/{target_id}/audit-trail")
    assert res.status_code == 200
    audit_events = res.json()
    actions = [a["action"] for a in audit_events]
    log_pass(f"Audit Trail Events Recorded ({len(audit_events)}): {actions}")
    assert "INVESTIGATOR_NOTE_ADDED" in actions
    assert "AI_RISK_OVERRIDDEN" in actions
    assert "FINAL_HUMAN_DECISION" in actions

    # Step 3.7: Persistence Verification (Simulating Page Reload)
    res = client.get(f"/api/v1/claims/{target_id}")
    reloaded = res.json()
    assert reloaded["ai_risk_score"] == initial_ai_score, "Original AI score must persist unchanged!"
    assert reloaded["override_risk_score"] == 92.0, "Override score must persist!"
    assert reloaded["final_risk_score"] == 92.0, "Effective final score must persist!"
    assert reloaded["status"] == "FINAL_DECISION_REJECTED", f"Claim status: {reloaded['status']}"
    assert reloaded["investigation_case"]["final_decision"] == "REJECTED"
    log_pass("State Persistence across simulated browser reload verified successfully.")

    print("\n==================================================================")
    print("ALL SCENARIOS & USER WORKFLOWS COMPLETED WITH 100% SUCCESS!")
    print("==================================================================")

if __name__ == "__main__":
    test_live_workflow()
