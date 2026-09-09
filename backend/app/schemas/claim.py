from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime
from app.schemas.evidence import EvidenceResponse
from app.schemas.fraud import FraudSignalResponse, RiskAssessmentResponse, InvestigationCaseResponse

class ClaimCreate(BaseModel):
    policy_id: str = Field(..., json_schema_extra={"example": "POL-992140"})
    claimant_id: str = Field(..., json_schema_extra={"example": "CUST-10482"})
    claimant_name: str = Field(..., json_schema_extra={"example": "Marcus Vance"})
    claimant_email: Optional[str] = Field(None, json_schema_extra={"example": "marcus.vance@example.com"})
    claimant_phone: Optional[str] = Field(None, json_schema_extra={"example": "+1-555-0199"})

    incident_date: str = Field(..., json_schema_extra={"example": "2026-08-14"})
    incident_location: str = Field(..., json_schema_extra={"example": "Route 9 & Elm St, Austin, TX"})
    incident_description: Optional[str] = Field(None, json_schema_extra={"example": "Rear-ended at stop light during evening commute."})

    vehicle_make: str = Field(..., json_schema_extra={"example": "Honda"})
    vehicle_model: str = Field(..., json_schema_extra={"example": "Accord"})
    vehicle_year: int = Field(..., json_schema_extra={"example": 2022})
    vehicle_vin: str = Field(..., json_schema_extra={"example": "1HGCV1F34NA001928"})
    vehicle_plate: Optional[str] = Field(None, json_schema_extra={"example": "TX-982-XYZ"})
    estimated_vehicle_value: float = Field(default=24000.0, ge=500.0)

    claimed_amount: float = Field(default=0.0, ge=0.0)

class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
    risk_score: float
    risk_level: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

class ClaimDetailResponse(ClaimResponse):
    evidence_items: List[EvidenceResponse] = []
    fraud_signals: List[FraudSignalResponse] = []
    risk_assessments: List[RiskAssessmentResponse] = []
    investigation_case: Optional[InvestigationCaseResponse] = None
