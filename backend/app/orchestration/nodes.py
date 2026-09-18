import uuid
import time
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.db.models import Claim, Evidence, FraudSignal, RiskAssessment, InvestigationCase
from app.orchestration.state import FraudGraphState
from app.agents.document_agent import document_agent
from app.agents.vision_agent import vision_agent
from app.agents.historical_agent import historical_agent
from app.agents.rules_engine import rules_engine
from app.agents.verification_agent import verification_agent
from app.agents.risk_engine import risk_engine
from app.llm.client import get_llm_client, sanitize_untrusted_text
from app.services.storage import get_storage_service, temporary_evidence_file
from app.services.audit_service import log_audit_event

logger = logging.getLogger("orchestration_nodes")

def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

async def _update_evidence_record(
    evidence_id: str,
    status: str,
    extracted_data: Optional[Dict[str, Any]] = None,
    confidence: float = 1.0,
    provider_mode: str = "LOCAL DEMO / MOCK",
    error_message: Optional[str] = None
):
    """Persists structured extraction results, status, confidence, and provider mode to Evidence table."""
    if not evidence_id:
        return
    try:
        async with AsyncSessionLocal() as db:
            ev = await db.get(Evidence, evidence_id)
            if ev:
                ev.extraction_status = status
                if extracted_data is not None:
                    ev.extracted_data = extracted_data
                ev.confidence = confidence
                ev.provider_mode = provider_mode
                ev.error_message = error_message
                await db.commit()
    except Exception as e:
        logger.warning(f"Could not persist evidence record for {evidence_id}: {e}")


def _make_stage_entry(state: FraudGraphState, stage_name: str, detail: str = "") -> List[Dict[str, Any]]:
    elapsed = round(time.time() - state.get("_start_time", time.time()), 2)
    logger.info(f"[{state.get('investigation_id', 'INV')}] Stage -> {stage_name}: {detail}")
    return [{
        "stage": stage_name,
        "detail": detail,
        "timestamp": _timestamp(),
        "elapsed_seconds": elapsed
    }]

class _ClaimStub:
    def __init__(self, d: Dict[str, Any], fallback_id: str = "CLM"):
        self.id = d.get("id", fallback_id)
        self.policy_id = d.get("policy_id", "POL-DEFAULT")
        self.claimant_id = d.get("claimant_id", "CUST-DEFAULT")
        self.claimant_name = d.get("claimant_name", "Claimant")
        self.claimant_email = d.get("claimant_email")
        self.claimant_phone = d.get("claimant_phone")
        self.incident_date = d.get("incident_date", "2026-08-15")
        self.incident_location = d.get("incident_location", "")
        self.incident_description = d.get("incident_description", "")
        self.vehicle_make = d.get("vehicle_make", "")
        self.vehicle_model = d.get("vehicle_model", "")
        self.vehicle_year = int(d.get("vehicle_year", 2022))
        self.vehicle_vin = d.get("vehicle_vin", "")
        self.vehicle_plate = d.get("vehicle_plate")
        self.estimated_vehicle_value = float(d.get("estimated_vehicle_value", 20000.0))
        self.claimed_amount = float(d.get("claimed_amount", 0.0))
        self.created_at = d.get("created_at") or datetime.now(timezone.utc)
        self.status = d.get("status", "PROCESSING")
        self.risk_score = float(d.get("risk_score", 0.0))
        self.risk_level = d.get("risk_level", "UNASSESSED")

# --- Node 1: load_claim ---
async def load_claim(state: FraudGraphState) -> Dict[str, Any]:
    state["_start_time"] = time.time()
    claim_id = state.get("claim_id", "CLM")

    claim_data = state.get("claim_data", {})
    if not claim_data and claim_id:
        async with AsyncSessionLocal() as db:
            c = await db.get(Claim, claim_id)
            if c:
                claim_data = {
                    "id": c.id,
                    "policy_id": c.policy_id,
                    "claimant_id": c.claimant_id,
                    "claimant_name": c.claimant_name,
                    "incident_date": c.incident_date,
                    "incident_location": c.incident_location,
                    "vehicle_make": c.vehicle_make,
                    "vehicle_model": c.vehicle_model,
                    "vehicle_year": c.vehicle_year,
                    "vehicle_vin": c.vehicle_vin,
                    "estimated_vehicle_value": c.estimated_vehicle_value,
                    "claimed_amount": c.claimed_amount,
                    "status": c.status
                }
    return {
        "claim_data": claim_data,
        "processing_status": "PROCESSING",
        "current_stage": "Claim Received",
        "stage_history": _make_stage_entry(state, "Claim Received", f"Loading claim record {claim_id}")
    }

# --- Node 2: collect_evidence ---
async def collect_evidence(state: FraudGraphState) -> Dict[str, Any]:
    claim_id = state["claim_id"]
    evidence_items = state.get("evidence_items", [])
    evidence_id_map = state.get("evidence_id_map", {})

    if not evidence_items and claim_id:
        async with AsyncSessionLocal() as db:
            stmt = select(Evidence).where(Evidence.claim_id == claim_id)
            res = await db.execute(stmt)
            photo_count = 0
            for ev in res.scalars().all():
                item = {
                    "id": ev.id,
                    "filename": ev.filename,
                    "stored_path": ev.stored_path,
                    "mime_type": ev.mime_type,
                    "document_type": ev.document_type,
                    "sha256_hash": ev.sha256_hash,
                    "file_size_bytes": ev.file_size_bytes
                }
                evidence_items.append(item)
                evidence_id_map[ev.document_type] = ev.id
                if "photo" in ev.document_type or "image" in ev.document_type:
                    photo_count += 1
                    evidence_id_map[f"photo_{photo_count}"] = ev.id

    return {
        "evidence_items": evidence_items,
        "evidence_id_map": evidence_id_map,
        "current_stage": "Evidence Collected",
        "stage_history": _make_stage_entry(state, "Evidence Collected", f"Gathering multimodal evidence for claim {claim_id}")
    }

# --- Node 3: document_analysis (Parallel Branch A) ---
async def document_analysis(state: FraudGraphState) -> Dict[str, Any]:
    claim_data = state.get("claim_data", {})
    evidence_items = state.get("evidence_items", [])

    extracted_docs: Dict[str, Any] = {}
    doc_signals: List[Dict[str, Any]] = []
    injections: List[Dict[str, Any]] = []
    llm_doc_analyses: Dict[str, Any] = {}

    llm = get_llm_client()
    storage_service = get_storage_service()

    for ev in evidence_items:
        doc_t = ev.get("document_type")
        ev_id = ev.get("id", "")
        if doc_t in ["claim_form", "repair_estimate", "invoice", "police_report"]:
            stored_path = ev.get("stored_path", "")
            fname = ev.get("filename", f"{doc_t}.json")
            content_bytes = b""
            try:
                content_bytes = await storage_service.read_evidence(stored_path)
            except Exception as e:
                logger.warning(f"Failed to read evidence file {stored_path}: {e}")
                await _update_evidence_record(
                    evidence_id=ev_id,
                    status="FAILED",
                    error_message=f"Storage read error: {e}",
                    provider_mode=llm.provider_name
                )

            extracted = {}
            conf = 0.85
            injected = False

            if content_bytes:
                try:
                    # 1. Deterministic extraction via temporary file for legacy parser
                    with temporary_evidence_file(content_bytes, fname) as tmp_path:
                        extracted, conf, injected = document_agent.extract_document(tmp_path, doc_t, claim_data)
                    extracted_docs[doc_t] = extracted

                    # 2. LLM unstructured document understanding
                    try:
                        raw_text = content_bytes.decode("utf-8", errors="ignore")
                    except Exception:
                        raw_text = str(extracted)

                    try:
                        llm_analysis = await llm.analyze_document(raw_text, doc_t, claim_data)
                        llm_doc_analyses[doc_t] = llm_analysis.model_dump()
                        if llm_analysis.prompt_injection_warning:
                            injected = True
                    except Exception as e:
                        logger.warning(f"LLM doc analysis warning on {doc_t}: {e}")

                    # 3. Persist successful evidence extraction
                    await _update_evidence_record(
                        evidence_id=ev_id,
                        status="COMPLETED",
                        extracted_data=extracted,
                        confidence=conf,
                        provider_mode=llm.provider_name,
                        error_message=None
                    )
                except Exception as e:
                    logger.warning(f"Error extracting document {fname} ({e}); degrading gracefully.")
                    await _update_evidence_record(
                        evidence_id=ev_id,
                        status="FAILED",
                        error_message=str(e),
                        provider_mode=llm.provider_name
                    )

            if injected:
                sig = {
                    "signal_type": "INDIRECT_PROMPT_INJECTION_ATTEMPT",
                    "category": "DOCUMENT_INTEGRITY",
                    "severity": "CRITICAL",
                    "score_impact": 40.0,
                    "description": "Uploaded document contained adversarial prompt injection instructions disguised as claim text.",
                    "evidence_refs": [ev_id],
                    "metadata": {"filename": fname}
                }
                doc_signals.append(sig)
                injections.append({"document": fname, "evidence_id": ev_id})

    return {
        "document_extractions": extracted_docs,
        "document_insights": {"parsed_count": len(extracted_docs), "injections": len(injections)},
        "document_signals": doc_signals,
        "prompt_injections_detected": injections,
        "llm_document_analyses": llm_doc_analyses,
        "current_stage": "Document Analysis",
        "stage_history": _make_stage_entry(state, "Document Analysis", "Executing Document Agent + LLM parsing with injection defense")
    }

# --- Node 4: vision_analysis (Parallel Branch B) ---
async def vision_analysis(state: FraudGraphState) -> Dict[str, Any]:
    claim_data = state.get("claim_data", {})
    evidence_items = state.get("evidence_items", [])

    photo_extractions: List[Dict[str, Any]] = []
    vision_insights: List[Dict[str, Any]] = []

    llm = get_llm_client()
    storage_service = get_storage_service()

    for ev in evidence_items:
        doc_t = ev.get("document_type")
        ev_id = ev.get("id", "")
        if doc_t in ["damage_photo", "photo", "image"]:
            stored_path = ev.get("stored_path", "")
            fname = ev.get("filename", "damage_photo.jpg")
            mime_t = ev.get("mime_type", "image/jpeg")

            img_bytes = b""
            try:
                img_bytes = await storage_service.read_evidence(stored_path)
            except Exception as e:
                logger.warning(f"Storage read failure for image {stored_path}: {e}")

            if not img_bytes:
                # If evidence file not yet on disk/blob in simulated scenarios, check if local file exists
                if Path(stored_path).exists():
                    try:
                        img_bytes = Path(stored_path).read_bytes()
                    except Exception:
                        pass
                if not img_bytes:
                    img_bytes = b"EMPTY_IMAGE_BYTES_PLACEHOLDER"

            photo_dict = None
            try:
                photo_ext = await llm.analyze_image(
                    image_bytes=img_bytes,
                    mime_type=mime_t,
                    claim_meta=claim_data,
                    filename=fname
                )
                photo_dict = photo_ext.model_dump()
                photo_extractions.append(photo_dict)
                vision_insights.append({
                    "damage_severity": photo_dict.get("overall_visual_damage_severity"),
                    "damaged_zones": [f.get("component") for f in photo_dict.get("findings", [])],
                    "confidence": photo_dict.get("confidence")
                })

                # Persist successful evidence extraction
                await _update_evidence_record(
                    evidence_id=ev_id,
                    status="COMPLETED",
                    extracted_data=photo_dict,
                    confidence=photo_dict.get("confidence", 0.9),
                    provider_mode=llm.provider_name,
                    error_message=None
                )
            except Exception as e:
                logger.warning(f"Vision analysis failed for {fname} ({e}); degrading gracefully.")
                # Graceful degradation fallback to local mock parser
                try:
                    fallback_ext = vision_agent.analyze_photo(Path(fname), claim_data)
                    fallback_dict = fallback_ext.model_dump()
                    photo_extractions.append(fallback_dict)
                    vision_insights.append({
                        "damage_severity": fallback_dict.get("overall_visual_damage_severity"),
                        "damaged_zones": [f.get("component") for f in fallback_dict.get("findings", [])],
                        "confidence": fallback_dict.get("confidence")
                    })
                except Exception:
                    pass

                # Persist FAILED status without crashing investigation
                await _update_evidence_record(
                    evidence_id=ev_id,
                    status="FAILED",
                    error_message=str(e),
                    provider_mode=llm.provider_name
                )

    return {
        "photo_extractions": photo_extractions,
        "vision_insights": vision_insights,
        "vision_signals": [],
        "current_stage": "Vision Analysis",
        "stage_history": _make_stage_entry(state, "Vision Analysis", "Executing Multimodal Vision Agent for crash damage classification")
    }

# --- Node 5: historical_analysis (Parallel Branch C) ---
async def historical_analysis(state: FraudGraphState) -> Dict[str, Any]:
    claim_data = state.get("claim_data", {})
    claim_id = state.get("claim_id", "CLM")

    stub = _ClaimStub(claim_data, claim_id)
    hist_signals: List[Dict[str, Any]] = []

    # If running concurrently before document_analysis finishes, inspect evidence files directly
    inv_ext = state.get("document_extractions", {}).get("invoice")
    est_ext = state.get("document_extractions", {}).get("repair_estimate")

    if not inv_ext or not est_ext:
        storage_service = get_storage_service()
        for ev in state.get("evidence_items", []):
            dt = ev.get("document_type")
            stored_p = ev.get("stored_path", "")
            fname = ev.get("filename", f"{dt}.json")
            if dt in ["invoice", "repair_estimate"]:
                try:
                    content_bytes = await storage_service.read_evidence(stored_p)
                    with temporary_evidence_file(content_bytes, fname) as tmp_path:
                        ext, _, _ = document_agent.extract_document(tmp_path, dt, claim_data)
                        if dt == "invoice" and not inv_ext:
                            inv_ext = ext
                        elif dt == "repair_estimate" and not est_ext:
                            est_ext = ext
                except Exception as e:
                    logger.warning(f"Error loading {dt} in historical_analysis: {e}")

    async with AsyncSessionLocal() as db:
        raw_hist = await historical_agent.analyze_claim_patterns(
            db, stub, inv_ext, est_ext
        )
        hist_signals = list(raw_hist)

    return {
        "historical_signals": hist_signals,
        "historical_insights": {"flagged_patterns": len(hist_signals)},
        "current_stage": "Historical Analysis",
        "stage_history": _make_stage_entry(state, "Historical Analysis", "Executing Historical Pattern Agent for shop and velocity checks")
    }

# --- Node 6: rules_analysis ---
async def rules_analysis(state: FraudGraphState) -> Dict[str, Any]:
    claim_data = state.get("claim_data", {})
    claim_id = state.get("claim_id", "CLM")
    extracted_docs = state.get("document_extractions", {})
    evidence_id_map = state.get("evidence_id_map", {})

    # If document_extractions wasn't merged yet, populate from evidence items
    if not extracted_docs:
        storage_service = get_storage_service()
        for ev in state.get("evidence_items", []):
            dt = ev.get("document_type")
            stored_p = ev.get("stored_path", "")
            fname = ev.get("filename", f"{dt}.json")
            if dt in ["claim_form", "repair_estimate", "invoice", "police_report"]:
                try:
                    content_bytes = await storage_service.read_evidence(stored_p)
                    with temporary_evidence_file(content_bytes, fname) as tmp_path:
                        extracted, _, _ = document_agent.extract_document(tmp_path, dt, claim_data)
                        extracted_docs[dt] = extracted
                except Exception as e:
                    logger.warning(f"Error loading {dt} in rules_analysis: {e}")

    stub = _ClaimStub(claim_data, claim_id)
    rule_signals = rules_engine.evaluate_rules(stub, extracted_docs, evidence_id_map)

    return {
        "rule_signals": list(rule_signals),
        "current_stage": "Rules Analysis",
        "stage_history": _make_stage_entry(state, "Rules Analysis", "Evaluating deterministic rules R01-R05")
    }

# --- Node 7: verification ---
async def verification(state: FraudGraphState) -> Dict[str, Any]:
    claim_data = state.get("claim_data", {})
    claim_id = state.get("claim_id", "CLM")
    extracted_docs = state.get("document_extractions", {})
    photo_extractions = state.get("photo_extractions", [])
    evidence_id_map = state.get("evidence_id_map", {})

    # Fallback load if needed
    if not extracted_docs:
        storage_service = get_storage_service()
        for ev in state.get("evidence_items", []):
            dt = ev.get("document_type")
            stored_p = ev.get("stored_path", "")
            fname = ev.get("filename", f"{dt}.json")
            if dt in ["claim_form", "repair_estimate", "invoice", "police_report"]:
                try:
                    content_bytes = await storage_service.read_evidence(stored_p)
                    with temporary_evidence_file(content_bytes, fname) as tmp_path:
                        extracted, _, _ = document_agent.extract_document(tmp_path, dt, claim_data)
                        extracted_docs[dt] = extracted
                except Exception as e:
                    logger.warning(f"Error loading {dt} in verification: {e}")

    stub = _ClaimStub(claim_data, claim_id)

    from app.schemas.evidence import DamagePhotoExtraction
    photo_objs = []
    for p in photo_extractions:
        try:
            photo_objs.append(DamagePhotoExtraction(**p))
        except Exception:
            pass

    verify_signals = verification_agent.verify_all_evidence(
        stub, extracted_docs, photo_objs, evidence_id_map
    )

    llm = get_llm_client()
    ev_summary = f"Docs: {list(extracted_docs.keys())}, Signals: {[s.get('signal_type') for s in verify_signals]}"
    llm_corr = None
    try:
        corr_res = await llm.correlate_evidence(
            claim_id=state.get("claim_id", ""),
            incident_date=str(claim_data.get("incident_date", "")),
            claimed_amount=float(claim_data.get("claimed_amount", 0.0)),
            evidence_summary=ev_summary
        )
        llm_corr = corr_res.model_dump()
    except Exception as e:
        logger.warning(f"LLM evidence correlation warning: {e}")

    return {
        "verification_signals": list(verify_signals),
        "llm_correlation": llm_corr,
        "current_stage": "Verification",
        "stage_history": _make_stage_entry(state, "Verification", "Executing multi-source verification and LLM evidence correlation")
    }

# --- Node 8: llm_investigation_synthesis ---
async def llm_investigation_synthesis(state: FraudGraphState) -> Dict[str, Any]:
    claim_data = state.get("claim_data", {})
    rule_signals = state.get("rule_signals", [])
    historical_signals = state.get("historical_signals", [])
    verification_signals = state.get("verification_signals", [])
    doc_signals = state.get("document_signals", [])
    prompt_injected = len(state.get("prompt_injections_detected", [])) > 0

    all_current_signals = rule_signals + historical_signals + verification_signals + doc_signals

    # Get deterministic risk evaluation from state or compute preview if called standalone
    det_score = state.get("risk_score")
    det_level = state.get("risk_level")
    requires_siu = state.get("requires_human_review")

    if det_score is None or det_level in [None, "UNASSESSED"]:
        claimed_amt = float(claim_data.get("claimed_amount", 0.0))
        computed_score, computed_level, _, _, _ = risk_engine.calculate_risk(all_current_signals, claimed_amt)
        det_score = computed_score
        det_level = computed_level
        requires_siu = det_level in ["HIGH", "CRITICAL"]

    llm = get_llm_client()
    synthesis = None
    summary_text = ""

    try:
        synthesis_obj = await llm.synthesize_investigation(
            claim_data=claim_data,
            rule_signals=rule_signals,
            historical_signals=historical_signals,
            verification_signals=verification_signals + doc_signals,
            document_insights=state.get("document_insights", {}),
            vision_insights=state.get("vision_insights", []),
            prompt_injected=prompt_injected,
            deterministic_risk_score=det_score,
            deterministic_risk_level=det_level,
            requires_human_review=requires_siu
        )
        synthesis = synthesis_obj.model_dump()
        summary_text = synthesis_obj.executive_summary
    except Exception as e:
        logger.warning(f"LLM synthesis error ({e}); using fallback summary.")
        summary_text = f"Investigation synthesis: {len(rule_signals)} rule signal(s), {len(historical_signals)} historical anomaly(ies), {len(verification_signals)} verification discrepancy(ies)."

    return {
        "llm_synthesis": synthesis,
        "llm_investigation_summary": summary_text,
        "current_stage": "LLM Investigation",
        "stage_history": _make_stage_entry(state, "LLM Investigation", "Synthesizing cross-agent insights into human-readable SIU narrative")
    }

# --- Node 9: risk_calculation ---
async def risk_calculation(state: FraudGraphState) -> Dict[str, Any]:
    claim_data = state.get("claim_data", {})
    claimed_amount = float(claim_data.get("claimed_amount", 0.0))

    all_signals = []
    all_signals.extend(state.get("document_signals", []))
    all_signals.extend(state.get("vision_signals", []))
    all_signals.extend(state.get("historical_signals", []))
    all_signals.extend(state.get("rule_signals", []))
    all_signals.extend(state.get("verification_signals", []))

    score, level, breakdown, explanation, action = risk_engine.calculate_risk(all_signals, claimed_amount)

    sorted_signals = sorted(all_signals, key=lambda x: float(x.get("score_impact", 0.0)), reverse=True)
    top_s = sorted_signals[0].get("signal_type", "ANOMALY_DETECTED") if sorted_signals else "NO_ADVERSE_SIGNALS"

    return {
        "all_signals": all_signals,
        "risk_score": score,
        "risk_level": level,
        "score_breakdown": breakdown,
        "risk_explanation": explanation,
        "recommended_action": action,
        "top_signal": top_s,
        "current_stage": "Risk Calculation",
        "stage_history": _make_stage_entry(state, "Risk Calculation", "Deterministic Risk Engine computing authoritative composite score")
    }

# --- Node 10: risk_routing ---
async def risk_routing(state: FraudGraphState) -> Dict[str, Any]:
    level = state.get("risk_level", "LOW")
    score = state.get("risk_score", 0.0)
    requires_siu = level in ["HIGH", "CRITICAL"]

    assigned = "SIU Senior Investigator" if requires_siu else "Automated STP"

    return {
        "requires_human_review": requires_siu,
        "assigned_investigator": assigned,
        "current_stage": "Risk Routing",
        "stage_history": _make_stage_entry(state, "Risk Routing", f"Risk level {level} ({score}/100) -> Route to {assigned}")
    }

# --- Node 11: human_review ---
async def human_review(state: FraudGraphState) -> Dict[str, Any]:
    claim_id = state["claim_id"]
    requires_siu = state.get("requires_human_review", False)
    level = state.get("risk_level", "LOW")
    score = state.get("risk_score", 0.0)

    case_id = None
    case_status = "STP_APPROVED" if not requires_siu else "QUEUED"

    async with AsyncSessionLocal() as db:
        if requires_siu:
            case_stmt = select(InvestigationCase).where(InvestigationCase.claim_id == claim_id)
            res = await db.execute(case_stmt)
            existing = res.scalars().first()
            if not existing:
                inv_case = InvestigationCase(
                    id=f"CASE-{uuid.uuid4().hex[:8].upper()}",
                    claim_id=claim_id,
                    status="QUEUED",
                    priority="URGENT" if level == "CRITICAL" else "HIGH",
                    assigned_to="SIU Senior Investigator",
                    original_ai_score=score,
                    original_ai_level=level,
                    final_effective_score=score,
                    investigator_notes=[{
                        "author": "LangGraph AI Orchestrator",
                        "text": f"LangGraph analysis concluded {level} risk ({score}/100). {len(state.get('all_signals', []))} signals flagged. LLM Summary: {state.get('llm_investigation_summary', '')[:200]}",
                        "timestamp": _timestamp()
                    }]
                )
                db.add(inv_case)
                await db.commit()
                case_id = inv_case.id
            else:
                case_id = existing.id
                case_status = existing.status

    return {
        "case_id": case_id,
        "case_status": case_status,
        "current_stage": "Human Review",
        "stage_history": _make_stage_entry(state, "Human Review", f"Preparing investigator case and audit record for {claim_id}")
    }

# --- Node 12: audit ---
async def audit(state: FraudGraphState) -> Dict[str, Any]:
    claim_id = state["claim_id"]
    score = state.get("risk_score", 0.0)
    level = state.get("risk_level", "LOW")
    breakdown = state.get("score_breakdown", {})
    explanation = state.get("risk_explanation", "")
    action = state.get("recommended_action", "")
    all_signals = state.get("all_signals", [])

    async with AsyncSessionLocal() as db:
        claim = await db.get(Claim, claim_id)
        if claim:
            claim.ai_risk_score = score
            claim.ai_risk_level = level
            if claim.override_risk_score is None:
                claim.final_risk_score = score
                claim.final_risk_level = level
            claim.risk_score = claim.final_risk_score or score
            claim.risk_level = claim.final_risk_level or level
            claim.top_signal = state.get("top_signal", "NO_ADVERSE_SIGNALS")
            claim.assigned_investigator = state.get("assigned_investigator")
            claim.status = "REVIEW_REQUIRED" if state.get("requires_human_review") else "NORMAL_PROCESSING"

        for s in all_signals:
            sig_id = f"SIG-{uuid.uuid4().hex[:8].upper()}"
            sig_model = FraudSignal(
                id=sig_id,
                claim_id=claim_id,
                signal_type=s.get("signal_type") or s.get("type", "UNKNOWN_SIGNAL"),
                category=s.get("category", "ANOMALY"),
                severity=s.get("severity", "MEDIUM"),
                score_impact=float(s.get("score_impact", 10.0)),
                description=s.get("description", ""),
                evidence_refs=s.get("evidence_refs", []),
                metadata_json=s.get("metadata", {})
            )
            db.add(sig_model)

        rsk = RiskAssessment(
            id=f"RSK-{uuid.uuid4().hex[:8].upper()}",
            claim_id=claim_id,
            overall_score=score,
            risk_level=level,
            score_breakdown=breakdown,
            explanation=explanation,
            recommended_action=action
        )
        db.add(rsk)

        await db.commit()

        await log_audit_event(
            db, "langgraph_orchestrator", "INVESTIGATION_COMPLETED", "claim", claim_id,
            new_value={
                "risk_score": score,
                "risk_level": level,
                "investigation_id": state.get("investigation_id"),
                "signal_count": len(all_signals),
                "requires_human_review": state.get("requires_human_review")
            }
        )
        await db.commit()

    return {
        "current_stage": "Audit Logging",
        "stage_history": _make_stage_entry(state, "Audit Logging", f"Persisting signals, assessment, and audit trail for {claim_id}")
    }

# --- Node 13: claims_sync ---
async def claims_sync(state: FraudGraphState) -> Dict[str, Any]:
    claim_id = state["claim_id"]
    sync_payload = {
        "external_system": "Guidewire ClaimCenter",
        "sync_status": "SYNCHRONIZED",
        "external_claim_id": f"GW-CC-{claim_id.replace('CLM-', '')}",
        "timestamp": _timestamp()
    }

    return {
        "claims_sync_result": sync_payload,
        "processing_status": "COMPLETED",
        "current_stage": "Completed",
        "stage_history": _make_stage_entry(state, "Completed", f"Syncing with Core Claims System and finalizing investigation {state.get('investigation_id')}")
    }
