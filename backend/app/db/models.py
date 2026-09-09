import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.session import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(50), primary_key=True, index=True)
    policy_id = Column(String(50), index=True, nullable=False)
    claimant_id = Column(String(50), index=True, nullable=False)
    claimant_name = Column(String(100), nullable=False)
    claimant_email = Column(String(100), nullable=True)
    claimant_phone = Column(String(50), nullable=True)

    incident_date = Column(String(50), nullable=False)
    incident_location = Column(String(255), nullable=False)
    incident_description = Column(Text, nullable=True)

    vehicle_make = Column(String(50), nullable=False)
    vehicle_model = Column(String(50), nullable=False)
    vehicle_year = Column(Integer, nullable=False)
    vehicle_vin = Column(String(50), index=True, nullable=False)
    vehicle_plate = Column(String(20), nullable=True)
    estimated_vehicle_value = Column(Float, default=15000.0)

    claimed_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default="CLAIM_RECEIVED", index=True)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="UNASSESSED", index=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    evidence_items = relationship("Evidence", back_populates="claim", cascade="all, delete-orphan")
    fraud_signals = relationship("FraudSignal", back_populates="claim", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="claim", cascade="all, delete-orphan")
    investigation_case = relationship("InvestigationCase", back_populates="claim", uselist=False, cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(50), primary_key=True, index=True)
    claim_id = Column(String(50), ForeignKey("claims.id", ondelete="CASCADE"), index=True, nullable=False)
    filename = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    document_type = Column(String(50), nullable=False)  # claim_form, repair_estimate, invoice, police_report, damage_photo, other
    file_size_bytes = Column(Integer, default=0)
    sha256_hash = Column(String(64), index=True, nullable=False)
    
    extraction_status = Column(String(50), default="PENDING")  # PENDING, COMPLETED, FAILED, SKIPPED
    extracted_data = Column(JSON, default=dict)
    confidence = Column(Float, default=1.0)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="evidence_items")


class FraudSignal(Base):
    __tablename__ = "fraud_signals"

    id = Column(String(50), primary_key=True, index=True)
    claim_id = Column(String(50), ForeignKey("claims.id", ondelete="CASCADE"), index=True, nullable=False)
    signal_type = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # RULES_ENGINE, HISTORICAL_ANOMALY, VISION_MISMATCH, VERIFICATION_DISCREPANCY, DOCUMENT_INTEGRITY
    severity = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    score_impact = Column(Float, default=0.0)
    description = Column(Text, nullable=False)
    evidence_refs = Column(JSON, default=list)  # List of Evidence IDs: ["EVD-001"]
    metadata_json = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="fraud_signals")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(50), primary_key=True, index=True)
    claim_id = Column(String(50), ForeignKey("claims.id", ondelete="CASCADE"), index=True, nullable=False)
    overall_score = Column(Float, nullable=False)  # 0.0 - 100.0
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    score_breakdown = Column(JSON, default=dict)  # {"rules": 25, "history": 15, "vision": 30, "verification": 20}
    explanation = Column(Text, nullable=False)
    recommended_action = Column(String(100), nullable=False)

    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="risk_assessments")


class InvestigationCase(Base):
    __tablename__ = "investigation_cases"

    id = Column(String(50), primary_key=True, index=True)
    claim_id = Column(String(50), ForeignKey("claims.id", ondelete="CASCADE"), index=True, nullable=False, unique=True)
    status = Column(String(50), default="QUEUED", index=True)  # QUEUED, ASSIGNED, IN_REVIEW, RESOLVED
    assigned_to = Column(String(100), nullable=True)
    priority = Column(String(20), default="HIGH")
    
    investigator_notes = Column(JSON, default=list)  # List of note objects [{"author": "...", "text": "...", "timestamp": "..."}]
    ai_risk_overridden = Column(Boolean, default=False)
    override_score = Column(Float, nullable=True)
    override_reason = Column(Text, nullable=True)

    final_decision = Column(String(50), nullable=True)  # APPROVED, REJECTED, ESCALATED_LEGAL, PENDING
    decision_reason = Column(Text, nullable=True)
    decided_by = Column(String(100), nullable=True)
    decided_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="investigation_case")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    actor = Column(String(100), nullable=False, default="system")
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(50), nullable=False, index=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    metadata_json = Column(JSON, default=dict)


class HistoricalClaim(Base):
    __tablename__ = "historical_claims"

    id = Column(String(50), primary_key=True, index=True)
    policy_id = Column(String(50), index=True, nullable=False)
    claimant_id = Column(String(50), index=True, nullable=False)
    claimant_name = Column(String(100), nullable=False)
    vehicle_vin = Column(String(50), index=True, nullable=False)
    vehicle_make = Column(String(50), nullable=False)
    vehicle_model = Column(String(50), nullable=False)
    vehicle_year = Column(Integer, nullable=False)
    incident_date = Column(String(50), nullable=False)
    claim_amount = Column(Float, nullable=False)
    repair_shop = Column(String(150), nullable=True, index=True)
    invoice_number = Column(String(100), nullable=True, index=True)
    fraud_label = Column(Boolean, default=False, index=True)
    fraud_type = Column(String(100), nullable=True)
    status = Column(String(50), default="PAID")
    notes = Column(Text, nullable=True)
