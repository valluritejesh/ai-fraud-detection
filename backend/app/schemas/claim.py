from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime
from app.schemas.evidence import EvidenceResponse
from app.schemas.fraud import FraudSignalResponse, RiskAssessmentResponse, InvestigationCaseResponse

class InlineEvidenceInput(BaseModel):
    document_type: str = Field(..., description="Document type: claim_form, repair_estimate, invoice, police_report, damage_photo")
    filename: Optional[str] = "evidence_file"
    content_text: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    file_base64: Optional[str] = None

class ClaimCreate(BaseModel):
    policy_id: str = Field(..., json_schema_extra={"example": "POL-992140"})
    claimant_id: str = Field(..., json_schema_extra={"example": "CUST-10482"})
    claimant_name: str = Field(..., json_schema_extra={"example": "Marcus Vance"})
    claimant_email: Optional[str] = Field(None, json_schema_extra={"example": "marcus.vance@example.com"})
    claimant_phone: Optional[str] = Field(None, json_schema_extra={"example": "+1-555-0199"})

    incident_date: str = Field(..., json_schema_extra={"example": "2026-08-14"})
    incident_location: str = Field(..., json_schema_extra={"example": "Route 9 & Elm St, Austin, TX"})
    incident_description: Optional[str] = Field(None, json_schema_extra={"example": "Rear-ended at stop light during evening commute."})
    description: Optional[str] = Field(None, description="Optional alias for incident_description")

    vehicle_make: str = Field(..., json_schema_extra={"example": "Honda"})
    vehicle_model: str = Field(..., json_schema_extra={"example": "Accord"})
    vehicle_year: int = Field(..., json_schema_extra={"example": 2022})
    vehicle_vin: str = Field(..., json_schema_extra={"example": "1HGCV1F34NA001928"})
    vehicle_plate: Optional[str] = Field(None, json_schema_extra={"example": "TX-982-XYZ"})
    estimated_vehicle_value: float = Field(default=24000.0, ge=500.0)

    claimed_amount: float = Field(default=0.0, ge=0.0)

    # Optional inline documents/photos for real-time investigation intake
    documents: Optional[List[InlineEvidenceInput]] = None
    photos: Optional[List[InlineEvidenceInput]] = None
    evidence: Optional[List[InlineEvidenceInput]] = None
    run_investigation: Optional[bool] = True

class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="allow")

    id: str
    policy_id: str
    claimant_id: str
    claimant_name: str
    claimant_email: Optional[str] = None
    claimant_phone: Optional[str] = None
    incident_date: str
    incident_location: str
    incident_description: Optional[str] = None
    vehicle_make: str
    vehicle_model: str
    vehicle_year: int
    vehicle_vin: str
    vehicle_plate: Optional[str] = None
    estimated_vehicle_value: float
    claimed_amount: float
    status: str
    
    # Explicit separation of AI score vs override
    ai_risk_score: float = 0.0
    ai_risk_level: str = "UNASSESSED"
    override_risk_score: Optional[float] = None
    override_risk_level: Optional[str] = None
    final_risk_score: float = 0.0
    final_risk_level: str = "UNASSESSED"

    risk_score: float = 0.0
    risk_level: str = "UNASSESSED"
    top_signal: Optional[str] = "PENDING_ANALYSIS"
    assigned_investigator: Optional[str] = "Unassigned"

    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

class ClaimDetailResponse(ClaimResponse):
    evidence_items: List[EvidenceResponse] = []
    fraud_signals: List[FraudSignalResponse] = []
    risk_assessments: List[RiskAssessmentResponse] = []
    investigation_case: Optional[InvestigationCaseResponse] = None

class ClaimInvestigationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="allow")

    claim_id: str
    id: str  # alias for backward compatibility
    investigation_id: Optional[str] = None
    risk_score: float = 0.0
    risk_level: str = "UNASSESSED"
    status: str = "PROCESSING"
    processing_status: str = "COMPLETED"
    findings: List[Dict[str, Any]] = Field(default_factory=list)
    rule_findings: List[Dict[str, Any]] = Field(default_factory=list)
    document_findings: Dict[str, Any] = Field(default_factory=dict)
    vision_findings: List[Dict[str, Any]] = Field(default_factory=list)
    historical_findings: List[Dict[str, Any]] = Field(default_factory=list)
    llm_summary: Optional[str] = None
    requires_human_review: bool = False

    # Preserved ClaimResponse fields for 100% backward compatibility
    policy_id: Optional[str] = None
    claimant_id: Optional[str] = None
    claimant_name: Optional[str] = None
    incident_date: Optional[str] = None
    incident_location: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[int] = None
    vehicle_vin: Optional[str] = None
    claimed_amount: Optional[float] = 0.0
    estimated_vehicle_value: Optional[float] = 24000.0
    ai_risk_score: Optional[float] = 0.0
    ai_risk_level: Optional[str] = "UNASSESSED"
    final_risk_score: Optional[float] = 0.0
    final_risk_level: Optional[str] = "UNASSESSED"
    top_signal: Optional[str] = "PENDING_ANALYSIS"
    assigned_investigator: Optional[str] = "Unassigned"
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

class InvestigationStatusResponse(BaseModel):
    investigation_id: str
    claim_id: str
    current_stage: str
    processing_status: str
    stages: List[Dict[str, Any]] = []
    risk_score: float = 0.0
    risk_level: str = "UNASSESSED"
    requires_human_review: bool = False
    llm_summary: Optional[str] = None
    signal_count: int = 0
    signals: List[Dict[str, Any]] = []
    agent_statuses: Dict[str, str] = {}

