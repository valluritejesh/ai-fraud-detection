export interface Claim {
  id: string;
  policy_id: string;
  claimant_id: string;
  claimant_name: string;
  claimant_email?: string;
  claimant_phone?: string;
  incident_date: string;
  incident_location: string;
  incident_description?: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_vin: string;
  vehicle_plate?: string;
  estimated_vehicle_value: number;
  claimed_amount: number;
  status: string;
  
  // Explicit separation of AI score vs override
  ai_risk_score: number;
  ai_risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNASSESSED";
  override_risk_score?: number | null;
  override_risk_level?: string | null;
  final_risk_score: number;
  final_risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNASSESSED";

  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNASSESSED";
  top_signal?: string;
  assigned_investigator?: string;

  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  claim_id: string;
  filename: string;
  mime_type: string;
  document_type: string;
  file_size_bytes: number;
  sha256_hash: string;
  extraction_status: string;
  extracted_data: Record<string, any>;
  confidence: number;
  provider_mode: string;
  created_at: string;
}

export interface FraudSignal {
  id: string;
  claim_id: string;
  signal_type: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score_impact: number;
  description: string;
  evidence_refs: string[];
  metadata_json: Record<string, any>;
  created_at: string;
}

export interface RiskAssessment {
  id: string;
  claim_id: string;
  overall_score: number;
  risk_level: string;
  score_breakdown: Record<string, number>;
  explanation: string;
  recommended_action: string;
  generated_at: string;
}

export interface InvestigationNote {
  author: string;
  text: string;
  timestamp: string;
}

export interface InvestigationCase {
  id: string;
  claim_id: string;
  status: string;
  assigned_to?: string;
  priority: string;
  investigator_notes: InvestigationNote[];
  
  original_ai_score: number;
  original_ai_level: string;
  ai_risk_overridden: boolean;
  override_score?: number | null;
  override_reason?: string | null;
  final_effective_score: number;

  final_decision?: string;
  decision_reason?: string;
  decided_by?: string;
  decided_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  metadata_json: Record<string, any>;
}

export interface ClaimDetail extends Claim {
  evidence_items: Evidence[];
  fraud_signals: FraudSignal[];
  risk_assessments: RiskAssessment[];
  investigation_case?: InvestigationCase;
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  uptime_seconds: number;
  database: {
    status: string;
    latency_ms: number;
  };
  agents: Record<string, string>;
  metrics: {
    total_claims: number;
    claims_under_review: number;
    high_critical_risk_claims: number;
    total_fraud_signals_generated: number;
    average_risk_score: number;
  };
}
