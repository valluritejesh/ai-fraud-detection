import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import Claim, InvestigationCase

router = APIRouter()

class ExternalSyncRequest(BaseModel):
    external_system: str = "Guidewire ClaimCenter"
    target_environment: str = "production"

class ExternalSyncResponse(BaseModel):
    sync_status: str
    external_reference_id: str
    synchronized_at: str
    synced_claim_id: str
    current_status: str
    risk_level: str
    human_decision: Optional[str] = None
    message: str

@router.post("/sync/{claim_id}", response_model=ExternalSyncResponse)
async def sync_claim_to_external_system(
    claim_id: str,
    payload: ExternalSyncRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Mock integration adapter for external core claims systems (Guidewire / Duck Creek).
    Can be seamlessly swapped with real REST/SOAP/Kafka endpoints.
    """
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    case = await db.get(InvestigationCase, claim_id)

    return ExternalSyncResponse(
        sync_status="SYNCHRONIZED",
        external_reference_id=f"GW-CC-{claim.id.replace('CLM-', '')}",
        synchronized_at=datetime.datetime.utcnow().isoformat(),
        synced_claim_id=claim.id,
        current_status=claim.status,
        risk_level=claim.risk_level,
        human_decision=case.final_decision if case else None,
        message=f"Claim {claim_id} state synced to {payload.external_system} successfully."
    )

@router.get("/status/{claim_id}")
async def get_external_claim_status(
    claim_id: str,
    db: AsyncSession = Depends(get_db)
):
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    return {
        "claim_id": claim.id,
        "external_system": "Guidewire / Duck Creek Mock Adapter",
        "integration_active": True,
        "last_ping": datetime.datetime.utcnow().isoformat(),
        "status": claim.status,
        "risk_level": claim.risk_level
    }
