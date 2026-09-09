import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import Claim, InvestigationCase
from app.schemas.fraud import (
    InvestigationCaseResponse,
    InvestigationNoteCreate,
    InvestigationOverrideRequest,
    FinalDecisionRequest
)
from app.services.audit_service import log_audit_event

router = APIRouter()

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
async def get_claim_investigation(
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

    # Determine risk level corresponding to override score
    new_score = payload.override_score
    if new_score <= 30.0:
        new_level = "LOW"
    elif new_score <= 60.0:
        new_level = "MEDIUM"
    elif new_score <= 80.0:
        new_level = "HIGH"
    else:
        new_level = "CRITICAL"

    # 1. Update Investigation Case
    case.ai_risk_overridden = True
    case.override_score = new_score
    case.override_reason = payload.override_reason
    case.final_effective_score = new_score
    case.status = "IN_REVIEW"

    # 2. Update Claim: KEEP original AI score completely intact!
    claim.override_risk_score = new_score
    claim.override_risk_level = new_level
    claim.final_risk_score = new_score
    claim.final_risk_level = new_level
    
    # Backwards compatibility aliases reflect the human determination
    claim.risk_score = new_score
    claim.risk_level = new_level

    await log_audit_event(
        db, payload.investigator or "Lead Investigator", "AI_RISK_OVERRIDDEN",
        "claim", claim.id,
        old_value={"original_ai_score": claim.ai_risk_score, "original_ai_level": claim.ai_risk_level},
        new_value={
            "override_score": new_score,
            "override_level": new_level,
            "final_score": new_score,
            "rationale": payload.override_reason,
            "investigator": payload.investigator
        }
    )
    await db.commit()
    await db.refresh(case)
    return case

@router.post("/claim/{claim_id}/final-decision", response_model=InvestigationCaseResponse)
async def submit_final_decision(
    claim_id: str,
    payload: FinalDecisionRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InvestigationCase).where(InvestigationCase.claim_id == claim_id)
    res = await db.execute(stmt)
    case = res.scalars().first()
    if not case:
        case = InvestigationCase(
            id=f"CASE-{uuid.uuid4().hex[:8].upper()}",
            claim_id=claim_id,
            status="RESOLVED",
            priority="ROUTINE"
        )
        db.add(case)

    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    case.final_decision = payload.decision
    case.decision_reason = payload.reason
    case.decided_by = payload.decided_by
    case.decided_at = datetime.datetime.utcnow()
    case.status = "RESOLVED"

    # Update claim workflow status
    claim.status = f"FINAL_DECISION_{payload.decision}"

    await log_audit_event(
        db, payload.decided_by or "Claims Supervisor", "FINAL_HUMAN_DECISION",
        "claim", claim.id,
        new_value={"decision": payload.decision, "reason": payload.reason, "decided_by": payload.decided_by}
    )
    await db.commit()
    await db.refresh(case)
    return case
