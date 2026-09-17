import hashlib
import uuid
import shutil
import base64
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import get_db
from app.db.models import Claim, Evidence, FraudSignal, RiskAssessment, InvestigationCase, AuditLog
from app.schemas.claim import (
    ClaimCreate,
    ClaimResponse,
    ClaimDetailResponse,
    ClaimInvestigationResponse,
)
from app.schemas.evidence import EvidenceResponse
from app.schemas.fraud import FraudSignalResponse, RiskAssessmentResponse, AuditLogResponse
from app.orchestration.fraud_graph import execute_langgraph_investigation, investigation_registry
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.post("", response_model=ClaimInvestigationResponse, status_code=201)
async def create_claim(
    payload: ClaimCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Intake endpoint for new insurance claims.
    Accepts claimant, vehicle, and incident details, plus optional inline documents/photos.
    Runs the full LangGraph multi-agent investigation pipeline and returns structured risk findings.
    """
    claim_id = f"CLM-{uuid.uuid4().hex[:8].upper()}"
    desc_text = payload.incident_description or payload.description or ""
    
    claim = Claim(
        id=claim_id,
        policy_id=payload.policy_id,
        claimant_id=payload.claimant_id,
        claimant_name=payload.claimant_name,
        claimant_email=payload.claimant_email,
        claimant_phone=payload.claimant_phone,
        incident_date=payload.incident_date,
        incident_location=payload.incident_location,
        incident_description=desc_text,
        vehicle_make=payload.vehicle_make,
        vehicle_model=payload.vehicle_model,
        vehicle_year=payload.vehicle_year,
        vehicle_vin=payload.vehicle_vin.strip().upper(),
        vehicle_plate=payload.vehicle_plate,
        estimated_vehicle_value=payload.estimated_vehicle_value,
        claimed_amount=payload.claimed_amount,
        status="CLAIM_RECEIVED",
        risk_score=0.0,
        risk_level="UNASSESSED"
    )
    db.add(claim)
    await db.commit()
    await db.refresh(claim)

    await log_audit_event(
        db, "system", "CLAIM_CREATED", "claim", claim.id,
        new_value={"claimed_amount": claim.claimed_amount, "vehicle_vin": claim.vehicle_vin}
    )
    await db.commit()

    # Process any inline evidence provided in payload
    all_inline = []
    if payload.documents:
        all_inline.extend(payload.documents)
    if payload.photos:
        all_inline.extend(payload.photos)
    if payload.evidence:
        all_inline.extend(payload.evidence)

    claim_upload_dir = settings.UPLOAD_DIR / claim_id
    claim_upload_dir.mkdir(parents=True, exist_ok=True)

    evidence_records = []
    for item in all_inline:
        ev_id = f"EVD-{uuid.uuid4().hex[:8].upper()}"
        fname = item.filename or f"{item.document_type}_{ev_id}.txt"
        saved_path = claim_upload_dir / f"{ev_id}_{fname}"
        
        file_bytes = b""
        if item.content_json is not None:
            import json
            file_bytes = json.dumps(item.content_json, indent=2).encode("utf-8")
        elif item.content_text is not None:
            file_bytes = item.content_text.encode("utf-8")
        elif item.file_base64 is not None:
            file_bytes = base64.b64decode(item.file_base64)
        else:
            file_bytes = f"Document type: {item.document_type}".encode("utf-8")

        saved_path.write_bytes(file_bytes)
        sha256_h = hashlib.sha256(file_bytes).hexdigest()

        ev = Evidence(
            id=ev_id,
            claim_id=claim.id,
            filename=fname,
            stored_path=str(saved_path),
            mime_type="application/json" if item.content_json else "text/plain",
            document_type=item.document_type,
            file_size_bytes=len(file_bytes),
            sha256_hash=sha256_h,
            extraction_status="PENDING",
            extracted_data={},
            confidence=1.0
        )
        db.add(ev)
        evidence_records.append(ev)

    if evidence_records:
        await db.commit()

    # Execute LangGraph investigation if evidence is present or requested
    inv_state: Dict[str, Any] = {}
    if payload.run_investigation and evidence_records:
        inv_state = await execute_langgraph_investigation(claim.id) or {}
        # Reload claim to get updated scores
        await db.refresh(claim)

    return ClaimInvestigationResponse(
        claim_id=claim.id,
        id=claim.id,
        investigation_id=inv_state.get("investigation_id"),
        risk_score=claim.risk_score,
        risk_level=claim.risk_level,
        status=claim.status,
        processing_status=inv_state.get("processing_status", "CLAIM_RECEIVED"),
        findings=inv_state.get("all_signals", []),
        rule_findings=inv_state.get("rule_signals", []),
        document_findings=inv_state.get("document_extractions", {}),
        vision_findings=inv_state.get("vision_insights", []),
        historical_findings=inv_state.get("historical_signals", []),
        llm_summary=inv_state.get("llm_investigation_summary"),
        requires_human_review=inv_state.get("requires_human_review", False),
        policy_id=claim.policy_id,
        claimant_id=claim.claimant_id,
        claimant_name=claim.claimant_name,
        claimant_email=claim.claimant_email,
        claimant_phone=claim.claimant_phone,
        incident_date=claim.incident_date,
        incident_location=claim.incident_location,
        incident_description=claim.incident_description,
        vehicle_make=claim.vehicle_make,
        vehicle_model=claim.vehicle_model,
        vehicle_year=claim.vehicle_year,
        vehicle_vin=claim.vehicle_vin,
        vehicle_plate=claim.vehicle_plate,
        estimated_vehicle_value=claim.estimated_vehicle_value,
        claimed_amount=claim.claimed_amount,
        ai_risk_score=claim.ai_risk_score,
        ai_risk_level=claim.ai_risk_level,
        override_risk_score=claim.override_risk_score,
        override_risk_level=claim.override_risk_level,
        final_risk_score=claim.final_risk_score,
        final_risk_level=claim.final_risk_level,
        top_signal=claim.top_signal,
        assigned_investigator=claim.assigned_investigator,
        created_at=claim.created_at,
        updated_at=claim.updated_at
    )

@router.get("", response_model=List[ClaimResponse])
async def list_claims(
    status: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Claim).order_by(desc(Claim.created_at)).limit(limit)
    if status:
        stmt = stmt.where(Claim.status == status)
    if risk_level:
        stmt = stmt.where(Claim.risk_level == risk_level)
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.get("/{claim_id}", response_model=ClaimDetailResponse)
async def get_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Claim)
        .where(Claim.id == claim_id)
        .options(
            selectinload(Claim.evidence_items),
            selectinload(Claim.fraud_signals),
            selectinload(Claim.risk_assessments),
            selectinload(Claim.investigation_case)
        )
    )
    result = await db.execute(stmt)
    claim = result.scalars().first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

@router.get("/{claim_id}/investigation", response_model=ClaimInvestigationResponse)
async def get_claim_investigation(
    claim_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the latest LangGraph investigation state and findings for a claim.
    """
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    reg = investigation_registry.get_by_claim(claim_id)
    if reg:
        return ClaimInvestigationResponse(
            claim_id=claim.id,
            id=claim.id,
            investigation_id=reg.get("investigation_id"),
            risk_score=reg.get("risk_score", claim.risk_score),
            risk_level=reg.get("risk_level", claim.risk_level),
            status=claim.status,
            processing_status=reg.get("processing_status", "COMPLETED"),
            findings=reg.get("all_signals", []),
            rule_findings=reg.get("rule_signals", []),
            document_findings=reg.get("document_extractions", {}),
            vision_findings=reg.get("vision_insights", []),
            historical_findings=reg.get("historical_signals", []),
            llm_summary=reg.get("llm_investigation_summary"),
            requires_human_review=reg.get("requires_human_review", False),
            policy_id=claim.policy_id,
            claimant_id=claim.claimant_id,
            claimant_name=claim.claimant_name,
            incident_date=claim.incident_date,
            incident_location=claim.incident_location,
            vehicle_make=claim.vehicle_make,
            vehicle_model=claim.vehicle_model,
            vehicle_year=claim.vehicle_year,
            vehicle_vin=claim.vehicle_vin,
            claimed_amount=claim.claimed_amount,
            ai_risk_score=claim.ai_risk_score,
            ai_risk_level=claim.ai_risk_level,
            final_risk_score=claim.final_risk_score,
            final_risk_level=claim.final_risk_level,
            top_signal=claim.top_signal,
            assigned_investigator=claim.assigned_investigator,
            created_at=claim.created_at,
            updated_at=claim.updated_at
        )

    # Fallback from DB records
    sig_stmt = select(FraudSignal).where(FraudSignal.claim_id == claim_id)
    sig_res = await db.execute(sig_stmt)
    signals = list(sig_res.scalars().all())

    rsk_stmt = select(RiskAssessment).where(RiskAssessment.claim_id == claim_id).order_by(desc(RiskAssessment.generated_at))
    rsk_res = await db.execute(rsk_stmt)
    assessment = rsk_res.scalars().first()

    raw_signals = [
        {
            "signal_type": s.signal_type,
            "category": s.category,
            "severity": s.severity,
            "score_impact": s.score_impact,
            "description": s.description
        }
        for s in signals
    ]

    return ClaimInvestigationResponse(
        claim_id=claim.id,
        id=claim.id,
        investigation_id=f"HIST-{claim.id}",
        risk_score=claim.risk_score,
        risk_level=claim.risk_level,
        status=claim.status,
        processing_status="COMPLETED" if claim.status != "PROCESSING" else "PROCESSING",
        findings=raw_signals,
        rule_findings=[s for s in raw_signals if "RULE" in s.get("category", "") or "RULE" in s.get("signal_type", "")],
        document_findings={},
        vision_findings=[],
        historical_findings=[s for s in raw_signals if "HISTORICAL" in s.get("category", "")],
        llm_summary=assessment.explanation if assessment else None,
        requires_human_review=claim.risk_level in ["HIGH", "CRITICAL"],
        policy_id=claim.policy_id,
        claimant_id=claim.claimant_id,
        claimant_name=claim.claimant_name,
        incident_date=claim.incident_date,
        incident_location=claim.incident_location,
        vehicle_make=claim.vehicle_make,
        vehicle_model=claim.vehicle_model,
        vehicle_year=claim.vehicle_year,
        vehicle_vin=claim.vehicle_vin,
        claimed_amount=claim.claimed_amount,
        ai_risk_score=claim.ai_risk_score,
        ai_risk_level=claim.ai_risk_level,
        final_risk_score=claim.final_risk_score,
        final_risk_level=claim.final_risk_level,
        top_signal=claim.top_signal,
        assigned_investigator=claim.assigned_investigator,
        created_at=claim.created_at,
        updated_at=claim.updated_at
    )

@router.post("/{claim_id}/evidence", response_model=EvidenceResponse)
async def upload_evidence(
    claim_id: str,
    file: UploadFile = File(...),
    document_type: str = Form("other"),
    db: AsyncSession = Depends(get_db)
):
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    filename = file.filename or "uploaded_file"
    ext = Path(filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension {ext} not permitted. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )

    claim_upload_dir = settings.UPLOAD_DIR / claim_id
    claim_upload_dir.mkdir(parents=True, exist_ok=True)
    evidence_id = f"EVD-{uuid.uuid4().hex[:8].upper()}"
    saved_path = claim_upload_dir / f"{evidence_id}_{filename}"

    sha256 = hashlib.sha256()
    size_bytes = 0

    with open(saved_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            size_bytes += len(chunk)
            if size_bytes > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
                saved_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds maximum allowed size ({settings.MAX_UPLOAD_SIZE_MB}MB)"
                )
            sha256.update(chunk)
            f.write(chunk)

    file_hash = sha256.hexdigest()

    evidence = Evidence(
        id=evidence_id,
        claim_id=claim.id,
        filename=filename,
        stored_path=str(saved_path),
        mime_type=file.content_type or "application/octet-stream",
        document_type=document_type,
        file_size_bytes=size_bytes,
        sha256_hash=file_hash,
        extraction_status="PENDING",
        extracted_data={},
        confidence=1.0
    )
    db.add(evidence)
    await db.commit()
    await db.refresh(evidence)

    await log_audit_event(
        db, "claimant", "EVIDENCE_UPLOADED", "claim", claim.id,
        new_value={"filename": filename, "sha256": file_hash, "document_type": document_type, "evidence_id": evidence.id}
    )
    await db.commit()
    return evidence

@router.post("/{claim_id}/analyze", response_model=ClaimDetailResponse)
async def analyze_claim(
    claim_id: str,
    background_tasks: BackgroundTasks,
    run_async: bool = Query(False, description="Set true for non-blocking background analysis"),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes the LangGraph fraud investigation pipeline for the claim.
    """
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if run_async:
        async def _run_bg():
            await execute_langgraph_investigation(claim_id)

        background_tasks.add_task(_run_bg)
        return await get_claim(claim_id, db)
    else:
        await execute_langgraph_investigation(claim_id)
        return await get_claim(claim_id, db)

@router.get("/{claim_id}/risk", response_model=Optional[RiskAssessmentResponse])
async def get_claim_risk(
    claim_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RiskAssessment).where(RiskAssessment.claim_id == claim_id).order_by(desc(RiskAssessment.generated_at))
    res = await db.execute(stmt)
    return res.scalars().first()

@router.get("/{claim_id}/signals", response_model=List[FraudSignalResponse])
async def get_claim_signals(
    claim_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FraudSignal).where(FraudSignal.claim_id == claim_id).order_by(desc(FraudSignal.score_impact))
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.get("/{claim_id}/audit-trail", response_model=List[AuditLogResponse])
async def get_claim_audit_trail(
    claim_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(AuditLog)
        .where(AuditLog.resource_id == claim_id)
        .order_by(desc(AuditLog.timestamp))
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())
