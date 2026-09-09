from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime

class RepairEstimateItem(BaseModel):
    part_name: str
    operation: str = "replace"
    part_cost: float = 0.0
    labor_hours: float = 0.0
    labor_cost: float = 0.0
    total_item_cost: float = 0.0

class RepairEstimateExtraction(BaseModel):
    document_type: str = "repair_estimate"
    provider_mode: str = "LOCAL HEURISTIC PARSER"
    claim_id: Optional[str] = None
    repair_shop: str
    repair_shop_address: Optional[str] = None
    estimate_date: str
    vehicle_vin: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    items: List[RepairEstimateItem] = []
    total_parts_cost: float = 0.0
    total_labor_cost: float = 0.0
    tax_cost: float = 0.0
    total_cost: float = 0.0
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)

class InvoiceItem(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float = 0.0
    total_price: float = 0.0

class InvoiceExtraction(BaseModel):
    document_type: str = "invoice"
    provider_mode: str = "LOCAL HEURISTIC PARSER"
    invoice_number: str
    invoice_date: str
    vendor_name: str
    customer_name: Optional[str] = None
    items: List[InvoiceItem] = []
    subtotal: float = 0.0
    tax: float = 0.0
    total_amount: float = 0.0
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)

class PoliceReportExtraction(BaseModel):
    document_type: str = "police_report"
    provider_mode: str = "LOCAL HEURISTIC PARSER"
    report_number: str
    police_department: str
    officer_badge: Optional[str] = None
    incident_date: str
    incident_time: Optional[str] = None
    incident_location: str
    weather_condition: Optional[str] = "Clear"
    involved_vehicles: List[Dict[str, Any]] = []
    fault_assessment: Optional[str] = None
    damage_description: Optional[str] = None
    citations_issued: List[str] = []
    confidence: float = Field(default=0.92, ge=0.0, le=1.0)

class ClaimFormExtraction(BaseModel):
    document_type: str = "claim_form"
    provider_mode: str = "LOCAL HEURISTIC PARSER"
    claim_id: Optional[str] = None
    policy_id: str
    claimant_name: str
    incident_date: str
    incident_location: str
    incident_description: str
    vehicle_vin: str
    vehicle_make: str
    vehicle_model: str
    estimated_damage: float = 0.0
    police_notified: bool = True
    confidence: float = Field(default=0.96, ge=0.0, le=1.0)

class DamageFinding(BaseModel):
    component: str
    damage_type: str
    severity: str
    confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    notes: Optional[str] = None

class DamagePhotoExtraction(BaseModel):
    document_type: str = "damage_photo"
    provider_mode: str = "LOCAL DEMO / MOCK"
    image_id: Optional[str] = None
    vehicle_detected: bool = True
    vehicle_make: Optional[str] = None
    vehicle_color: Optional[str] = None
    visible_plate: Optional[str] = None
    findings: List[DamageFinding] = []
    overall_visual_damage_severity: str = "moderate"
    estimated_visual_repair_cost_range: Dict[str, float] = Field(default_factory=lambda: {"min": 500.0, "max": 2500.0})
    photo_quality: str = "high"
    confidence: float = Field(default=0.91, ge=0.0, le=1.0)

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    claim_id: str
    filename: str
    mime_type: str
    document_type: str
    file_size_bytes: int
    sha256_hash: str
    extraction_status: str
    extracted_data: Dict[str, Any] = {}
    confidence: float
    provider_mode: str = "LOCAL DEMO / MOCK"
    created_at: datetime.datetime
