import uuid
import logging
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Claim, Evidence, FraudSignal, RiskAssessment, InvestigationCase
from app.agents.document_agent import document_agent
from app.agents.vision_agent import vision_agent
from app.agents.historical_agent import historical_agent
from app.agents.rules_engine import rules_engine
from app.agents.verification_agent import verification_agent
from app.agents.risk_engine import risk_engine
from app.services.audit_service import log_audit_event

logger = logging.getLogger("orchestrator")

class FraudAnalysisOrchestrator:
    """
    Asynchronous Workflow Orchestrator coordinating all AI agents,
    deterministic rules, multi-evidence verification, risk scoring, and routing.
    """

    async def run_fraud_analysis_pipeline(self, db: AsyncSession, claim_id: str) -> Claim:
        stmt = select(Claim).where(Claim.id == claim_id)
        result = await db.execute(stmt)
        claim = result.scalars().first()

        if not claim:
            raise ValueError(f"Claim {claim_id} not found")

        try:
            # 1. Update Status: PROCESSING
            claim.status = "PROCESSING"
            await db.commit()
            await log_audit_event(
                db, "orchestrator", "ANALYSIS_STARTED", "claim", claim.id,
                new_value={"status": "PROCESSING"}
            )

            # Load attached evidence items
            ev_stmt = select(Evidence).where(Evidence.claim_id == claim.id)
            ev_res = await db.execute(ev_stmt)
            evidence_items = list(ev_res.scalars().all())

            # 2. Extract Document & Photo Data
            extracted_docs: Dict[str, Dict[str, Any]] = {}
            photo_extractions = []
            evidence_id_map: Dict[str, str] = {}

            meta = {
                "claimant_name": claim.claimant_name,
                "incident_date": claim.incident_date,
                "incident_location": claim.incident_location,
                "vehicle_vin": claim.vehicle_vin,
                "vehicle_make": claim.vehicle_make,
                "vehicle_model": claim.vehicle_model,
                "claimed_amount": claim.claimed_amount,
                "policy_id": claim.policy_id
            }

            for ev in evidence_items:
                fpath = Path(ev.stored_path)
                doc_t = ev.document_type

                if doc_t in ["claim_form", "repair_estimate", "invoice", "police_report"]:
                    extracted, conf, prompt_injected = document_agent.extract_document(fpath, doc_t, meta)
                    ev.extracted_data = extracted
                    ev.confidence = conf
                    ev.extraction_status = "COMPLETED"
                    ev.provider_mode = "LOCAL HEURISTIC PARSER"
                    extracted_docs[doc_t] = extracted
                    evidence_id_map[doc_t] = ev.id

                    if prompt_injected:
                        sig = FraudSignal(
                            id=f"SIG-{uuid.uuid4().hex[:8].upper()}",
                            claim_id=claim.id,
                            signal_type="INDIRECT_PROMPT_INJECTION_ATTEMPT",
                            category="DOCUMENT_INTEGRITY",
                            severity="CRITICAL",
                            score_impact=40.0,
                            description="Uploaded document contained adversarial prompt injection instructions disguised as claim text.",
                            evidence_refs=[ev.id],
                            metadata_json={"filename": ev.filename}
                        )
                        db.add(sig)

                elif doc_t in ["damage_photo", "photo", "image"]:
                    photo_ext = vision_agent.analyze_photo(fpath, meta)
                    ev.extracted_data = photo_ext.model_dump()
                    ev.confidence = photo_ext.confidence
                    ev.extraction_status = "COMPLETED"
                    ev.provider_mode = "LOCAL DEMO / MOCK"
                    photo_extractions.append(photo_ext)
                    evidence_id_map[f"photo_{len(photo_extractions)}"] = ev.id

            claim.status = "EVIDENCE_EXTRACTED"
            await db.commit()

            # 3. Parallel Agent Analysis
            claim.status = "ANALYZING"
            await db.commit()

            all_raw_signals: List[Dict[str, Any]] = []

            # A. Deterministic Rules Engine
            rule_signals = rules_engine.evaluate_rules(claim, extracted_docs, evidence_id_map)
            all_raw_signals.extend(rule_signals)

            # B. Historical Pattern Agent
            hist_signals = await historical_agent.analyze_claim_patterns(
                db, claim, extracted_docs.get("invoice"), extracted_docs.get("repair_estimate")
            )
            all_raw_signals.extend(hist_signals)

            # C. Verification Agent (Cross-Evidence)
            verify_signals = verification_agent.verify_all_evidence(
                claim, extracted_docs, photo_extractions, evidence_id_map
            )
            all_raw_signals.extend(verify_signals)

            # 4. Persist Fraud Signals to DB
            for s in all_raw_signals:
                sig_type = s.get("signal_type") or s.get("type", "UNKNOWN_SIGNAL")
                sig_model = FraudSignal(
                    id=f"SIG-{uuid.uuid4().hex[:8].upper()}",
                    claim_id=claim.id,
                    signal_type=sig_type,
                    category=s.get("category", "HISTORICAL_ANOMALY"),
                    severity=s.get("severity", "MEDIUM"),
                    score_impact=float(s.get("score_impact", 10.0)),
                    description=s.get("description", ""),
                    evidence_refs=s.get("evidence_refs", []),
                    metadata_json=s.get("metadata", {})
                )
                db.add(sig_model)

            # 5. Risk Calculation & Explainability
            score, level, breakdown, explanation, action = risk_engine.calculate_risk(
                all_raw_signals, claim.claimed_amount
            )

            # Store original immutable AI scores
            claim.ai_risk_score = score
            claim.ai_risk_level = level
            claim.final_risk_score = score
            claim.final_risk_level = level
            claim.risk_score = score
            claim.risk_level = level

            # Identify top signal for queue display safely
            sorted_signals = sorted(all_raw_signals, key=lambda x: x.get("score_impact", 0.0), reverse=True)
            if sorted_signals:
                top_s = sorted_signals[0]
                claim.top_signal = top_s.get("signal_type") or top_s.get("type", "ANOMALY_DETECTED")
            else:
                claim.top_signal = "NO_ADVERSE_SIGNALS"

            assessment = RiskAssessment(
                id=f"RSK-{uuid.uuid4().hex[:8].upper()}",
                claim_id=claim.id,
                overall_score=score,
                risk_level=level,
                score_breakdown=breakdown,
                explanation=explanation,
                recommended_action=action
            )
            db.add(assessment)

            # 6. Automatic Routing
            if level in ["HIGH", "CRITICAL"]:
                claim.status = "REVIEW_REQUIRED"
                case_stmt = select(InvestigationCase).where(InvestigationCase.claim_id == claim.id)
                case_res = await db.execute(case_stmt)
                existing_case = case_res.scalars().first()

                if not existing_case:
                    inv_case = InvestigationCase(
                        id=f"CASE-{uuid.uuid4().hex[:8].upper()}",
                        claim_id=claim.id,
                        status="QUEUED",
                        priority="URGENT" if level == "CRITICAL" else "HIGH",
                        assigned_to="SIU Senior Investigator",
                        original_ai_score=score,
                        original_ai_level=level,
                        final_effective_score=score,
                        investigator_notes=[{
                            "author": "System AI Orchestrator",
                            "text": f"Automated routing triggered. Assessed as {level} risk ({score}/100). {len(all_raw_signals)} signal(s) flagged for human investigation.",
                            "timestamp": str(claim.created_at)
                        }]
                    )
                    db.add(inv_case)
                    claim.assigned_investigator = "SIU Senior Investigator"
            else:
                claim.status = "NORMAL_PROCESSING"
                claim.assigned_investigator = "Automated STP"

            await db.commit()

            # Audit Logging
            await log_audit_event(
                db, "orchestrator", "ANALYSIS_COMPLETED", "claim", claim.id,
                new_value={
                    "status": claim.status,
                    "ai_risk_score": score,
                    "ai_risk_level": level,
                    "signal_count": len(all_raw_signals)
                }
            )

            return claim

        except Exception as e:
            logger.exception(f"Pipeline error analyzing claim {claim_id}: {e}")
            claim.status = "ANALYSIS_INCOMPLETE"
            claim.risk_level = "UNASSESSED"
            await db.commit()
            await log_audit_event(
                db, "orchestrator", "ANALYSIS_FAILED", "claim", claim.id,
                metadata={"error": str(e)}
            )
            raise

orchestrator = FraudAnalysisOrchestrator()
