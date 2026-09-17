import asyncio
import httpx
from app.main import app

async def verify_e2e():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("=== 1. Testing System Observability & Telemetry ===")
        res = await client.get("/api/v1/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        health_data = res.json()
        print(f"[PASS] Health Status: {health_data['status']}")
        print(f"[PASS] Active Agents: {list(health_data['agents'].keys())}")
        print(f"[PASS] DB Latency: {health_data['database']['latency_ms']} ms")
        print(f"[PASS] Total Claims Tracked: {health_data['metrics']['total_claims']}")

        print("\n=== 2. Testing Frontend SPA Static Hosting ===")
        res = await client.get("/")
        assert res.status_code == 200
        assert "html" in res.headers.get("content-type", "")
        print("[PASS] Root endpoint successfully serves compiled React SPA index.html")

        print("\n=== 3. Testing Claims Queue & Filtering ===")
        res = await client.get("/api/v1/claims?limit=200")
        assert res.status_code == 200
        claims = res.json()
        assert len(claims) >= 6, f"Expected at least 6 claims, got {len(claims)}"
        print(f"[PASS] Claims Queue returned {len(claims)} seeded claims.")

        # Check Scenario B
        b_claim = next(c for c in claims if c["id"] == "CLM-SCENARIO-B")
        print(f"[PASS] Scenario B Baseline: AI Score={b_claim['ai_risk_score']}, Level={b_claim['ai_risk_level']}")
        assert b_claim["ai_risk_score"] == 85.0
        assert b_claim["ai_risk_level"] == "CRITICAL"
        assert b_claim["final_risk_score"] == 85.0

        print("\n=== 4. Testing Claim Dossier Inspection (CLM-SCENARIO-B) ===")
        res = await client.get("/api/v1/claims/CLM-SCENARIO-B")
        assert res.status_code == 200
        detail = res.json()
        print(f"[PASS] Retrieved dossier for {detail['id']}")
        print(f"[PASS] Evidence items attached: {len(detail['evidence_items'])}")
        print(f"[PASS] Triggered fraud signals: {len(detail['fraud_signals'])}")
        print(f"[PASS] Top Signal: {detail.get('top_signal')}")
        print(f"[PASS] Assigned Investigator: {detail.get('assigned_investigator')}")

        print("\n=== 5. Testing Investigator Note Collaboration ===")
        note_res = await client.post(
            "/api/v1/investigations/claim/CLM-SCENARIO-B/notes",
            json={"text": "SIU interviewed body shop owner. Recycled invoice confirmed.", "author": "Agent Cooper"}
        )
        assert note_res.status_code == 200
        print("[PASS] Investigator note added successfully.")

        print("\n=== 6. Testing Human-in-the-Loop AI Risk Override ===")
        override_res = await client.post(
            "/api/v1/investigations/claim/CLM-SCENARIO-B/override",
            json={
                "override_score": 95,
                "override_reason": "Physical vehicle inspection confirmed pre-existing damage was staged.",
                "investigator": "Lead Investigator Vance"
            }
        )
        assert override_res.status_code == 200
        case_data = override_res.json()
        print(f"[PASS] Override Committed: Original AI Score={case_data['original_ai_score']} (PRESERVED!)")
        print(f"[PASS] Override Score={case_data['override_score']}")
        print(f"[PASS] Final Effective Score={case_data['final_effective_score']}")
        assert case_data["original_ai_score"] == 85.0, "Original AI score must NOT be modified!"
        assert case_data["override_score"] == 95.0
        assert case_data["final_effective_score"] == 95.0

        # Verify claim table reflects this
        res = await client.get("/api/v1/claims/CLM-SCENARIO-B")
        updated_claim = res.json()
        assert updated_claim["ai_risk_score"] == 85.0, "Claim ai_risk_score must remain 85.0!"
        assert updated_claim["override_risk_score"] == 95.0
        assert updated_claim["final_risk_score"] == 95.0
        print("[PASS] Claim record confirmed: Original AI Score=85.0, Override=95.0, Final=95.0")

        print("\n=== 7. Testing Final Human Determination ===")
        decision_res = await client.post(
            "/api/v1/investigations/claim/CLM-SCENARIO-B/final-decision",
            json={
                "decision": "REJECTED",
                "reason": "Definitive staged collision and recycled billing fraud.",
                "decided_by": "Chief Claims Officer Morgan"
            }
        )
        assert decision_res.status_code == 200
        dec_data = decision_res.json()
        print(f"[PASS] Final Decision Committed: {dec_data['final_decision']} by {dec_data['decided_by']}")
        assert dec_data["final_decision"] == "REJECTED"

        print("\n=== 8. Testing External Core Claims Sync Adapter (Mock) ===")
        sync_res = await client.post(
            "/api/v1/external-claims/sync/CLM-SCENARIO-B",
            json={"external_system": "Guidewire ClaimCenter", "target_environment": "simulation"}
        )
        assert sync_res.status_code == 200
        sync_data = sync_res.json()
        print(f"[PASS] Synced to {sync_data['external_reference_id']} ({sync_data['sync_status']})")
        print(f"[PASS] Adapter message: {sync_data['message']}")

        print("\n=== 9. Testing Immutable Audit Trail Verification ===")
        audit_res = await client.get("/api/v1/claims/CLM-SCENARIO-B/audit-trail")
        assert audit_res.status_code == 200
        logs = audit_res.json()
        actions = [l["action"] for l in logs]
        print(f"[PASS] Total Audit Log Events: {len(logs)}")
        print(f"[PASS] Recorded Actions: {actions}")
        assert "AI_RISK_OVERRIDDEN" in actions
        assert "INVESTIGATOR_NOTE_ADDED" in actions
        assert "FINAL_HUMAN_DECISION" in actions

    print("\n========================================================")
    print("ALL END-TO-END SYSTEM CAPABILITIES VERIFIED SUCCESSFULLY!")
    print("========================================================")

if __name__ == "__main__":
    asyncio.run(verify_e2e())
