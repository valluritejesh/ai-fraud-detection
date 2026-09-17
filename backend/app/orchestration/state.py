from typing import TypedDict, Optional, List, Dict, Any, Annotated

def reduce_latest(current: Any, update: Any) -> Any:
    return update

def reduce_list(current: Optional[List[Any]], update: Optional[List[Any]]) -> List[Any]:
    curr = list(current or [])
    new_items = list(update or [])
    # Avoid duplicate stage entries if identical
    for item in new_items:
        if item not in curr:
            curr.append(item)
    return curr

def reduce_dict(current: Optional[Dict[str, Any]], update: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    res = dict(current or {})
    res.update(update or {})
    return res

class FraudGraphState(TypedDict, total=False):
    """
    Typed shared state for the FraudGuard AI LangGraph investigation graph.
    Maintains complete end-to-end evidence, agent findings, deterministic signals,
    LLM reasoning outputs, risk scores, and real-time pipeline status.
    """
    # Core Identifiers
    claim_id: str
    investigation_id: str
    policy_id: str
    claimant_id: str
    
    # Claim Record Metadata
    claim_data: Dict[str, Any]
    
    # Attached Evidence & Artifacts
    evidence_items: List[Dict[str, Any]]
    evidence_id_map: Annotated[Dict[str, str], reduce_dict]
    
    # Parallel Agent Outputs
    document_extractions: Dict[str, Any]
    document_insights: Dict[str, Any]
    document_signals: List[Dict[str, Any]]
    prompt_injections_detected: List[Dict[str, Any]]
    
    photo_extractions: List[Dict[str, Any]]
    vision_insights: List[Dict[str, Any]]
    vision_signals: List[Dict[str, Any]]
    
    historical_signals: List[Dict[str, Any]]
    historical_insights: Dict[str, Any]
    
    # Downstream Synthesis Agents
    rule_signals: List[Dict[str, Any]]
    verification_signals: List[Dict[str, Any]]
    all_signals: List[Dict[str, Any]]
    
    # LLM Reasoning & Understanding Layer
    llm_document_analyses: Dict[str, Any]
    llm_correlation: Optional[Dict[str, Any]]
    llm_investigation_summary: Optional[str]
    llm_synthesis: Optional[Dict[str, Any]]
    
    # Deterministic Risk Engine Outputs (Authoritative)
    risk_score: float
    risk_level: str
    score_breakdown: Dict[str, float]
    risk_explanation: str
    recommended_action: str
    top_signal: str
    
    # Human Review & Routing
    requires_human_review: bool
    assigned_investigator: Optional[str]
    case_id: Optional[str]
    case_status: Optional[str]
    
    # Real-Time Execution Lifecycle & Auditing
    current_stage: Annotated[str, reduce_latest]
    stage_history: Annotated[List[Dict[str, Any]], reduce_list]
    processing_status: Annotated[str, reduce_latest]
    claims_sync_result: Optional[Dict[str, Any]]
    audit_events: List[Dict[str, Any]]
    errors: List[str]

