import json
import asyncio
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import Claim, InvestigationCase
from app.schemas.claim import InvestigationStatusResponse
from app.schemas.fraud import (
    InvestigationCaseResponse,
    InvestigationNoteCreate,
    InvestigationOverrideRequest,
    FinalDecisionRequest
)
from app.orchestration.fraud_graph import (
    investigation_registry,
    execute_langgraph_investigation
)
from app.services.audit_service import log_audit_event

router = APIRouter()

# --- 1. Real-Time Status & WebSocket Streaming ---

@router.get("/{investigation_id}/status", response_model=InvestigationStatusResponse)
async def get_investigation_status(investigation_id: str):
    """
    Polls real-time investigation progress, stages, and findings from LangGraph execution.
    """
    state = investigation_registry.get(investigation_id)
    if not state:
        raise HTTPException(status_code=404, detail="Investigation not found in active registry")

    agent_statuses = {
        "document_agent": "COMPLETED" if state.get("document_extractions") else "WAITING",
        "vision_agent": "COMPLETED" if state.get("photo_extractions") is not None else "WAITING",
        "historical_agent": "COMPLETED" if state.get("historical_signals") is not None else "WAITING",
        "rules_engine": "COMPLETED" if state.get("rule_signals") is not None else "WAITING",
        "verification_agent": "COMPLETED" if state.get("verification_signals") is not None else "WAITING",
        "fraud_risk_engine": "COMPLETED" if state.get("risk_score", 0.0) > 0 else "WAITING"
    }

    return InvestigationStatusResponse(
        investigation_id=state.get("investigation_id", investigation_id),
        claim_id=state.get("claim_id", ""),
        current_stage=state.get("current_stage", "Claim Received"),
        processing_status=state.get("processing_status", "PROCESSING"),
        stages=state.get("stage_history", []),
        risk_score=state.get("risk_score", 0.0),
        risk_level=state.get("risk_level", "UNASSESSED"),
        requires_human_review=state.get("requires_human_review", False),
        llm_summary=state.get("llm_investigation_summary"),
        signal_count=len(state.get("all_signals", [])),
        signals=state.get("all_signals", []),
        agent_statuses=agent_statuses
    )

@router.websocket("/{investigation_id}/stream")
async def stream_investigation_websocket(websocket: WebSocket, investigation_id: str):
    """
    WebSocket endpoint streaming live LangGraph stage transitions and agent findings.
    """
    await websocket.accept()
    try:
        async for state_update in investigation_registry.subscribe(investigation_id):
            agent_statuses = {
                "document_agent": "COMPLETED" if state_update.get("document_extractions") else "PROCESSING",
                "vision_agent": "COMPLETED" if state_update.get("vision_insights") else "PROCESSING",
                "historical_agent": "COMPLETED" if state_update.get("historical_signals") is not None else "WAITING",
                "rules_engine": "COMPLETED" if state_update.get("rule_signals") is not None else "WAITING",
                "verification_agent": "COMPLETED" if state_update.get("verification_signals") is not None else "WAITING",
                "fraud_risk_engine": "COMPLETED" if state_update.get("risk_score", 0.0) > 0 else "WAITING"
            }

            payload = {
                "event": "STAGE_UPDATE",
                "investigation_id": investigation_id,
                "claim_id": state_update.get("claim_id"),
                "current_stage": state_update.get("current_stage"),
                "processing_status": state_update.get("processing_status"),
                "stages": state_update.get("stage_history", []),
                "risk_score": state_update.get("risk_score", 0.0),
                "risk_level": state_update.get("risk_level", "UNASSESSED"),
                "requires_human_review": state_update.get("requires_human_review", False),
                "llm_summary": state_update.get("llm_investigation_summary"),
                "signals": state_update.get("all_signals", []),
                "agent_statuses": agent_statuses,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            await websocket.send_json(payload)
            if state_update.get("processing_status") in ["COMPLETED", "FAILED"]:
                break
            await asyncio.sleep(0.05)

        await websocket.send_json({"event": "STREAM_FINISHED", "investigation_id": investigation_id})
        await websocket.close()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"event": "ERROR", "detail": str(e)})
            await websocket.close()
        except Exception:
            pass

@router.post("/trigger/{claim_id}", response_model=InvestigationStatusResponse)
async def trigger_investigation(claim_id: str, db: AsyncSession = Depends(get_db)):
    """
    On-demand launcher for triggering a LangGraph investigation on an existing claim.
    """
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    res = await execute_langgraph_investigation(claim_id)
    return await get_investigation_status(res["investigation_id"])

# --- 2. Existing Investigation Case & Governance Routes ---

@router.get("", response_model=List[InvestigationCaseResponse])
async def list_investigations(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InvestigationCase).order_by(desc(InvestigationCase.created_at)).limit(limit)
    if status:
        stmt = stmt.where(InvestigationCase.status == status)
    if priority:
        stmt = stmt.where(InvestigationCase.priority == priority)
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.get("/claim/{claim_id}", response_model=InvestigationCaseResponse)
async def get_claim_investigation_case(
    claim_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InvestigationCase).where(InvestigationCase.claim_id == claim_id)
    res = await db.execute(stmt)
    case = res.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="No active investigation case for this claim")
    return case

@router.post("/claim/{claim_id}/notes", response_model=InvestigationCaseResponse)
async def add_investigation_note(
    claim_id: str,
    payload: InvestigationNoteCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InvestigationCase).where(InvestigationCase.claim_id == claim_id)
    res = await db.execute(stmt)
    case = res.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    notes = list(case.investigator_notes or [])
    new_note = {
        "author": payload.author or "SIU Investigator",
        "text": payload.text,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    notes.append(new_note)
    case.investigator_notes = notes
    case.status = "IN_REVIEW"

    await log_audit_event(
        db, payload.author or "SIU Investigator", "INVESTIGATOR_NOTE_ADDED",
        "claim", claim_id, new_value={"note": payload.text}
    )
    await db.commit()
    await db.refresh(case)
    return case

@router.post("/claim/{claim_id}/override", response_model=InvestigationCaseResponse)
async def override_ai_risk(
    claim_id: str,
    payload: InvestigationOverrideRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InvestigationCase).where(InvestigationCase.claim_id == claim_id)
    res = await db.execute(stmt)
    case = res.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    new_score = payload.override_score
    if new_score <= 30.0:
        new_level = "LOW"
    elif new_score <= 60.0:
        new_level = "MEDIUM"
    elif new_score <= 80.0:
        new_level = "HIGH"
    else:
        new_level = "CRITICAL"

    old_score = claim.risk_score
    old_level = claim.risk_level

    reason = getattr(payload, "override_reason", None) or getattr(payload, "reason", "")
    investigator = getattr(payload, "investigator", None) or getattr(payload, "investigator_id", "SIU Lead Vance")

    case.ai_risk_overridden = True
    case.override_score = new_score
    case.override_level = new_level
    case.override_reason = reason
    case.override_by = investigator
    case.override_at = datetime.datetime.utcnow()
    case.final_effective_score = new_score
    case.final_effective_level = new_level
    case.status = "OVERRIDDEN"

    claim.override_risk_score = new_score
    claim.override_risk_level = new_level
    claim.final_risk_score = new_score
    claim.final_risk_level = new_level
    claim.risk_score = new_score
    claim.risk_level = new_level

    await log_audit_event(
        db, investigator, "AI_RISK_OVERRIDDEN",
        "claim", claim_id,
        old_value={"score": old_score, "level": old_level},
        new_value={"score": new_score, "level": new_level, "reason": reason}
    )

    await db.commit()
    await db.refresh(case)
    return case

@router.post("/claim/{claim_id}/final-decision", response_model=InvestigationCaseResponse)
@router.post("/claim/{claim_id}/decision", response_model=InvestigationCaseResponse)
async def record_final_decision(
    claim_id: str,
    payload: FinalDecisionRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InvestigationCase).where(InvestigationCase.claim_id == claim_id)
    res = await db.execute(stmt)
    case = res.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    reason = getattr(payload, "reason", None) or getattr(payload, "rationale", "")
    decided_by = getattr(payload, "decided_by", None) or getattr(payload, "investigator_id", "Chief Adjuster Vance")

    case.final_determination = payload.decision
    case.final_decision = payload.decision
    case.determination_notes = reason
    case.decision_reason = reason
    case.decision_by = decided_by
    case.decided_by = decided_by
    case.decided_at = datetime.datetime.utcnow()
    case.status = "RESOLVED"

    if payload.decision in ["APPROVE", "APPROVED"]:
        claim.status = "FINAL_DECISION_APPROVED"
    elif payload.decision in ["REJECT", "REJECTED"]:
        claim.status = "FINAL_DECISION_REJECTED"
    elif payload.decision in ["ESCALATE_LEGAL", "ESCALATED_LEGAL"]:
        claim.status = "FINAL_DECISION_ESCALATED"
    else:
        claim.status = f"DECIDED_{payload.decision}"

    await log_audit_event(
        db, decided_by, "FINAL_HUMAN_DECISION",
        "claim", claim_id,
        new_value={"decision": payload.decision, "rationale": reason}
    )

    await db.commit()
    await db.refresh(case)
    return case
