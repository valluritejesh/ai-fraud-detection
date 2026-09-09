from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime

class FraudSignalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    claim_id: str
    signal_type: str
    category: str
    severity: str
    score_impact: float
    description: str
    evidence_refs: List[str] = []
    metadata_json: Dict[str, Any] = {}
    created_at: datetime.datetime

class RiskAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    claim_id: str
    overall_score: float
    risk_level: str
    score_breakdown: Dict[str, Any] = {}
    explanation: str
    recommended_action: str
    generated_at: datetime.datetime

class InvestigationNoteCreate(BaseModel):
    text: str
    author: Optional[str] = "Investigator"

class InvestigationOverrideRequest(BaseModel):
    override_score: float = Field(..., ge=0.0, le=100.0)
    override_reason: str = Field(..., min_length=10)
    investigator: Optional[str] = "Lead Investigator"

class FinalDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVED, REJECTED, ESCALATED_LEGAL")
    reason: str = Field(..., min_length=5)
    decided_by: Optional[str] = "SIU Lead"

class InvestigationCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    claim_id: str
    status: str
    assigned_to: Optional[str] = None
    priority: str
    investigator_notes: List[Dict[str, Any]] = []
    ai_risk_overridden: bool = False
    override_score: Optional[float] = None
    override_reason: Optional[str] = None
    final_decision: Optional[str] = None
    decision_reason: Optional[str] = None
    decided_by: Optional[str] = None
    decided_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime.datetime
    actor: str
    action: str
    resource_type: str
    resource_id: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    metadata_json: Dict[str, Any] = {}
