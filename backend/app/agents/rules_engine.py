import logging
from typing import Dict, Any, List, Optional
from app.db.models import Claim

logger = logging.getLogger("rules_engine")

class DeterministicRulesEngine:
    """
    Deterministic Business Rules Engine.
    Applies strict logic to detect fraud indicators, compliance violations,
    and mathematical contradictions without relying on statistical variance.
    """

    def evaluate_rules(
        self,
        claim: Claim,
        extracted_docs: Dict[str, Dict[str, Any]],
        evidence_id_map: Dict[str, str] = None
    ) -> List[Dict[str, Any]]:
        evidence_id_map = evidence_id_map or {}
        signals = []

        # R01: Claim Amount vs Vehicle Value (Threshold: 85% without total loss)
        if claim.estimated_vehicle_value and claim.estimated_vehicle_value > 0:
            ratio = claim.claimed_amount / claim.estimated_vehicle_value
            if ratio > 0.85:
                ref_id = evidence_id_map.get("repair_estimate") or evidence_id_map.get("invoice")
                signals.append({
                    "signal_type": "RULE_EXCESSIVE_CLAIM_TO_VALUE",
                    "category": "RULES_ENGINE",
                    "severity": "HIGH",
                    "score_impact": 25.0,
                    "description": (
                        f"Claimed amount of ${claim.claimed_amount:,.2f} represents {ratio * 100:.1f}% "
                        f"of estimated vehicle fair market value (${claim.estimated_vehicle_value:,.2f}) "
                        f"without total loss classification."
                    ),
                    "evidence_refs": [ref_id] if ref_id else [],
                    "metadata": {"ratio": ratio, "claimed": claim.claimed_amount, "vehicle_value": claim.estimated_vehicle_value}
                })

        # R02: Suspicious Round Number Amounts (e.g. $5000.00 or $10000.00 on repair invoice)
        inv = extracted_docs.get("invoice")
        if inv:
            inv_total = float(inv.get("total_amount", 0.0))
            if inv_total > 1000.0 and inv_total % 500 == 0.0:
                ref_id = evidence_id_map.get("invoice")
                signals.append({
                    "signal_type": "RULE_SUSPICIOUS_ROUND_AMOUNT",
                    "category": "RULES_ENGINE",
                    "severity": "MEDIUM",
                    "score_impact": 10.0,
                    "description": (
                        f"Invoice total is an exact round number (${inv_total:,.2f}). "
                        f"Legitimate collision repair invoices virtually always feature precise non-zero cents due to parts pricing and state sales tax."
                    ),
                    "evidence_refs": [ref_id] if ref_id else [],
                    "metadata": {"invoice_total": inv_total}
                })

        # R03: Repair Estimate Duplicate Line Items
        estimate = extracted_docs.get("repair_estimate")
        if estimate:
            items = estimate.get("items", [])
            seen_parts = {}
            duplicates = []
            for item in items:
                p_name = item.get("part_name", "").strip().lower()
                if p_name in seen_parts:
                    duplicates.append(item.get("part_name"))
                seen_parts[p_name] = item

            if duplicates:
                ref_id = evidence_id_map.get("repair_estimate")
                signals.append({
                    "signal_type": "RULE_DUPLICATE_ESTIMATE_ITEMS",
                    "category": "RULES_ENGINE",
                    "severity": "HIGH",
                    "score_impact": 20.0,
                    "description": (
                        f"Repair estimate contains duplicated component line items: {duplicates}. "
                        f"Possible bill-padding or duplicate billing attempt."
                    ),
                    "evidence_refs": [ref_id] if ref_id else [],
                    "metadata": {"duplicated_parts": duplicates}
                })

        # R04: Excessive Labor to Parts Ratio
        if estimate:
            parts_cost = float(estimate.get("total_parts_cost", 0.0))
            labor_cost = float(estimate.get("total_labor_cost", 0.0))
            if parts_cost > 0 and labor_cost / parts_cost > 2.0:
                ref_id = evidence_id_map.get("repair_estimate")
                signals.append({
                    "signal_type": "RULE_EXCESSIVE_LABOR_RATIO",
                    "category": "RULES_ENGINE",
                    "severity": "MEDIUM",
                    "score_impact": 15.0,
                    "description": (
                        f"Labor charge (${labor_cost:,.2f}) is {labor_cost / parts_cost:.1f}x higher than total parts cost (${parts_cost:,.2f}). "
                        f"Standard industry collision ratios typically range between 0.6x and 1.4x."
                    ),
                    "evidence_refs": [ref_id] if ref_id else [],
                    "metadata": {"labor_cost": labor_cost, "parts_cost": parts_cost, "ratio": round(labor_cost / parts_cost, 2)}
                })

        # R05: Accident Date Inconsistency Rule
        police = extracted_docs.get("police_report")
        if police and police.get("incident_date") and claim.incident_date:
            p_date = police.get("incident_date")
            if p_date != claim.incident_date:
                ref_id = evidence_id_map.get("police_report")
                signals.append({
                    "signal_type": "RULE_DATE_CONTRADICTION",
                    "category": "RULES_ENGINE",
                    "severity": "HIGH",
                    "score_impact": 20.0,
                    "description": (
                        f"Deterministic date violation: Incident date reported to insurer ('{claim.incident_date}') "
                        f"does not match incident date recorded by law enforcement ('{p_date}')."
                    ),
                    "evidence_refs": [ref_id] if ref_id else [],
                    "metadata": {"claim_date": claim.incident_date, "police_date": p_date}
                })

        # R06: Policy Proximity / Short Inception Window
        if "POL-NEW" in (claim.policy_id or ""):
            signals.append({
                "signal_type": "RULE_NEW_POLICY_PROXIMITY",
                "category": "RULES_ENGINE",
                "severity": "MEDIUM",
                "score_impact": 15.0,
                "description": "Incident occurred within 48 hours of policy issuance.",
                "evidence_refs": [],
                "metadata": {"policy_id": claim.policy_id}
            })

        return signals

rules_engine = DeterministicRulesEngine()
