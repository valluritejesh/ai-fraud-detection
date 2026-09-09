import hashlib
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import get_db
from app.db.models import Claim, Evidence, FraudSignal, RiskAssessment, InvestigationCase, AuditLog
from app.schemas.claim import ClaimCreate, ClaimResponse, ClaimDetailResponse
from app.schemas.evidence import EvidenceResponse
from app.schemas.fraud import FraudSignalResponse, RiskAssessmentResponse, AuditLogResponse
from app.agents.orchestrator import orchestrator
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.post("", response_model=ClaimResponse, status_code=201)
async def create_claim(
    payload: ClaimCreate,
    db: AsyncSession = Depends(get_db)
):
    claim_id = f"CLM-{uuid.uuid4().hex[:8].upper()}"
    claim = Claim(
        id=claim_id,
        policy_id=payload.policy_id,
        claimant_id=payload.claimant_id,
        claimant_name=payload.claimant_name,
        claimant_email=payload.claimant_email,
        claimant_phone=payload.claimant_phone,
        incident_date=payload.incident_date,
        incident_location=payload.incident_location,
        incident_description=payload.incident_description,
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
    return claim

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
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if run_async:
        async def _run_bg():
            from app.db.session import AsyncSessionLocal
            async with AsyncSessionLocal() as bg_db:
                await orchestrator.run_fraud_analysis_pipeline(bg_db, claim_id)

        background_tasks.add_task(_run_bg)
        return await get_claim(claim_id, db)
    else:
        await orchestrator.run_fraud_analysis_pipeline(db, claim_id)
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
