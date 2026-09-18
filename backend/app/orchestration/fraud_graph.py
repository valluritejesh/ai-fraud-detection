import uuid
import time
import asyncio
import logging
from typing import Dict, Any, Optional, AsyncGenerator, Callable, List
from langgraph.graph import StateGraph, START, END

from app.orchestration.state import FraudGraphState
from app.orchestration.nodes import (
    load_claim,
    collect_evidence,
    document_analysis,
    vision_analysis,
    historical_analysis,
    rules_analysis,
    verification,
    llm_investigation_synthesis,
    risk_calculation,
    risk_routing,
    human_review,
    audit,
    claims_sync,
)

logger = logging.getLogger("fraud_graph")

def create_fraud_graph():
    """
    Constructs and compiles the hybrid LangGraph StateGraph for FraudGuard AI.
    Executes parallel document, vision, and historical agents safely before
    deterministic rules and multi-source verification.
    """
    builder = StateGraph(FraudGraphState)

    # Register Nodes
    builder.add_node("load_claim", load_claim)
    builder.add_node("collect_evidence", collect_evidence)
    builder.add_node("document_analysis", document_analysis)
    builder.add_node("vision_analysis", vision_analysis)
    builder.add_node("historical_analysis", historical_analysis)
    builder.add_node("rules_analysis", rules_analysis)
    builder.add_node("verification", verification)
    builder.add_node("llm_investigation_synthesis", llm_investigation_synthesis)
    builder.add_node("risk_calculation", risk_calculation)
    builder.add_node("risk_routing", risk_routing)
    builder.add_node("human_review", human_review)
    builder.add_node("audit", audit)
    builder.add_node("claims_sync", claims_sync)

    # Edges: Pipeline Sequence & Parallel Fan-Out
    builder.add_edge(START, "load_claim")
    builder.add_edge("load_claim", "collect_evidence")

    # Fan-Out to Parallel Branches
    builder.add_edge("collect_evidence", "document_analysis")
    builder.add_edge("collect_evidence", "vision_analysis")
    builder.add_edge("collect_evidence", "historical_analysis")

    # Fan-In Join into Rules Analysis
    builder.add_edge("document_analysis", "rules_analysis")
    builder.add_edge("vision_analysis", "rules_analysis")
    builder.add_edge("historical_analysis", "rules_analysis")

    # Downstream Synthesis & Governance
    builder.add_edge("rules_analysis", "verification")
    builder.add_edge("verification", "risk_calculation")
    builder.add_edge("risk_calculation", "risk_routing")
    builder.add_edge("risk_routing", "llm_investigation_synthesis")
    builder.add_edge("llm_investigation_synthesis", "human_review")
    builder.add_edge("human_review", "audit")
    builder.add_edge("audit", "claims_sync")
    builder.add_edge("claims_sync", END)

    return builder.compile()

# Global compiled graph singleton
compiled_fraud_graph = create_fraud_graph()

class InvestigationRegistry:
    """
    In-memory registry tracking live and completed LangGraph investigations.
    Supports WebSocket streaming, status polling, and historical lookup.
    """
    def __init__(self):
        self._investigations: Dict[str, Dict[str, Any]] = {}
        self._claim_to_inv: Dict[str, str] = {}
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}

    def get(self, investigation_id: str) -> Optional[Dict[str, Any]]:
        return self._investigations.get(investigation_id)

    def get_by_claim(self, claim_id: str) -> Optional[Dict[str, Any]]:
        inv_id = self._claim_to_inv.get(claim_id)
        if inv_id:
            return self._investigations.get(inv_id)
        return None

    def register(self, investigation_id: str, claim_id: str, initial_state: Dict[str, Any]):
        self._investigations[investigation_id] = initial_state
        self._claim_to_inv[claim_id] = investigation_id

    def update(self, investigation_id: str, updates: Dict[str, Any]):
        if investigation_id in self._investigations:
            self._investigations[investigation_id].update(updates)
            # Broadcast to any active WebSocket / streaming subscribers
            queues = self._subscribers.get(investigation_id, [])
            for q in queues:
                try:
                    q.put_nowait(dict(self._investigations[investigation_id]))
                except Exception:
                    pass

    async def subscribe(self, investigation_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.setdefault(investigation_id, []).append(queue)
        # Yield current state immediately if available
        curr = self.get(investigation_id)
        if curr:
            yield curr

        try:
            while True:
                item = await queue.get()
                yield item
                if item.get("processing_status") in ["COMPLETED", "FAILED"]:
                    break
        finally:
            if investigation_id in self._subscribers and queue in self._subscribers[investigation_id]:
                self._subscribers[investigation_id].remove(queue)

investigation_registry = InvestigationRegistry()

async def execute_langgraph_investigation(
    claim_id: str,
    claim_data: Optional[Dict[str, Any]] = None,
    evidence_items: Optional[List[Dict[str, Any]]] = None,
    on_update: Optional[Callable[[Dict[str, Any]], None]] = None
) -> Dict[str, Any]:
    """
    Executes the compiled LangGraph pipeline for a claim.
    Updates the live registry on each node transition and returns the final state.
    """
    investigation_id = f"INV-{uuid.uuid4().hex[:8].upper()}"

    initial_state: FraudGraphState = {
        "claim_id": claim_id,
        "investigation_id": investigation_id,
        "claim_data": claim_data or {},
        "evidence_items": evidence_items or [],
        "evidence_id_map": {},
        "document_extractions": {},
        "document_insights": {},
        "document_signals": [],
        "prompt_injections_detected": [],
        "photo_extractions": [],
        "vision_insights": [],
        "vision_signals": [],
        "historical_signals": [],
        "historical_insights": {},
        "rule_signals": [],
        "verification_signals": [],
        "all_signals": [],
        "llm_document_analyses": {},
        "llm_correlation": None,
        "llm_investigation_summary": None,
        "llm_synthesis": None,
        "risk_score": 0.0,
        "risk_level": "UNASSESSED",
        "score_breakdown": {},
        "risk_explanation": "",
        "recommended_action": "",
        "top_signal": "NO_ADVERSE_SIGNALS",
        "requires_human_review": False,
        "assigned_investigator": None,
        "case_id": None,
        "case_status": None,
        "current_stage": "Claim Received",
        "stage_history": [],
        "processing_status": "INITIALIZING",
        "claims_sync_result": None,
        "audit_events": [],
        "errors": []
    }

    investigation_registry.register(investigation_id, claim_id, initial_state)

    logger.info(f"Starting LangGraph investigation {investigation_id} for claim {claim_id}")

    try:
        # Stream intermediate node steps
        current_state = dict(initial_state)
        async for chunk in compiled_fraud_graph.astream(initial_state):
            # chunk is a dict mapping node_name -> output_dict
            for node_name, node_output in chunk.items():
                if isinstance(node_output, dict):
                    current_state.update(node_output)
                    investigation_registry.update(investigation_id, current_state)
                    if on_update:
                        on_update(current_state)

        current_state["processing_status"] = "COMPLETED"
        investigation_registry.update(investigation_id, current_state)
        return current_state

    except Exception as e:
        logger.exception(f"LangGraph execution failed for {claim_id}: {e}")
        error_state = {
            "processing_status": "FAILED",
            "errors": [str(e)],
            "current_stage": "Failed"
        }
        investigation_registry.update(investigation_id, error_state)
        raise
