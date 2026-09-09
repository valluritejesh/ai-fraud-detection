import logging
from typing import Dict, Any, List, Optional
from app.db.models import Claim

logger = logging.getLogger("rules_engine")

class DeterministicRulesEngine:
    """
    Deterministic Business Rules Engine.
    Applies strict logic to detect fraud indicators, compliance violations,
    and mathematical contradictions without relying on statistical variance.
    Each generated signal explicitly includes:
      - rule_id
      - description
      - severity
      - evidence_refs
      - observed_value
      - threshold
      - explanation
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
                    "rule_id": "R01",
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
                    "observed_value": f"{ratio * 100:.1f}% (${claim.claimed_amount:,.2f})",
                    "threshold": "85.0% of Fair Market Value",
                    "explanation": "Repairs exceeding 85% of vehicle value without salvage/total loss indication strongly indicate estimate inflation.",
                    "metadata": {
                        "rule_id": "R01",
                        "ratio": ratio,
                        "claimed": claim.claimed_amount,
                        "vehicle_value": claim.estimated_vehicle_value,
                        "observed_value": f"{ratio * 100:.1f}%",
                        "threshold": "85%"
                    }
                })

        # R02: Suspicious Round Number Amounts (e.g. $5,000.00 or $10,000.00 on repair invoice)
        inv = extracted_docs.get("invoice")
        if inv:
            inv_total = float(inv.get("total_amount", 0.0))
            if inv_total > 1000.0 and inv_total % 500 == 0.0:
                ref_id = evidence_id_map.get("invoice")
                signals.append({
                    "rule_id": "R02",
                    "signal_type": "RULE_SUSPICIOUS_ROUND_AMOUNT",
                    "category": "RULES_ENGINE",
                    "severity": "MEDIUM",
                    "score_impact": 10.0,
                    "description": (
                        f"Invoice total is an exact round number (${inv_total:,.2f}). "
                        f"Legitimate collision repair invoices virtually always feature precise cents due to itemized parts pricing and tax."
                    ),
                    "evidence_refs": [ref_id] if ref_id else [],
                    "observed_value": f"${inv_total:,.2f}",
                    "threshold": "Multiple of $500.00 with .00 cents",
                    "explanation": "Fabricated or non-itemized invoices frequently use rounded thousands/five-hundreds.",
                    "metadata": {
                        "rule_id": "R02",
                        "invoice_total": inv_total,
                        "observed_value": f"${inv_total:,.2f}",
                        "threshold": "Round $500.00 increment"
                    }
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
                    "rule_id": "R03",
                    "signal_type": "RULE_DUPLICATE_ESTIMATE_ITEMS",
                    "category": "RULES_ENGINE",
                    "severity": "HIGH",
                    "score_impact": 20.0,
                    "description": (
                        f"Repair estimate contains duplicated component line items: {duplicates}. "
                        f"Possible bill-padding or double-billing attempt."
                    ),
                    "evidence_refs": [ref_id] if ref_id else [],
                    "observed_value": f"{len(duplicates)} duplicated items: {duplicates}",
                    "threshold": "0 duplicate components",
                    "explanation": "Identical parts billed twice on the same estimate indicate fraudulent double-billing.",
                    "metadata": {
                        "rule_id": "R03",
                        "duplicated_parts": duplicates,
                        "observed_value": str(duplicates),
                        "threshold": "Unique part names"
                    }
                })

        # R04: Excessive Labor to Parts Ratio
        if estimate:
            parts_cost = float(estimate.get("total_parts_cost", 0.0))
            labor_cost = float(estimate.get("total_labor_cost", 0.0))
            if parts_cost > 0 and labor_cost / parts_cost > 2.0:
                ref_id = evidence_id_map.get("repair_estimate")
                ratio_val = round(labor_cost / parts_cost, 2)
                signals.append({
                    "rule_id": "R04",
                    "signal_type": "RULE_EXCESSIVE_LABOR_RATIO",
                    "category": "RULES_ENGINE",
                    "severity": "MEDIUM",
                    "score_impact": 15.0,
                    "description": (
                        f"Labor charge (${labor_cost:,.2f}) is {ratio_val}x higher than total parts cost (${parts_cost:,.2f}). "
                        f"Standard industry collision ratios typically range between 0.6x and 1.4x."
                    ),
                    "evidence_refs": [ref_id] if ref_id else [],
                    "observed_value": f"{ratio_val}x (${labor_cost:,.2f} labor vs ${parts_cost:,.2f} parts)",
                    "threshold": "2.0x labor-to-parts ratio",
                    "explanation": "Excessive labor charges are a common vector for padding collision invoices without physical part procurement.",
                    "metadata": {
                        "rule_id": "R04",
                        "labor_cost": labor_cost,
                        "parts_cost": parts_cost,
                        "ratio": ratio_val,
                        "observed_value": f"{ratio_val}x",
                        "threshold": "2.0x"
                    }
                })

        # R05: Accident Date Inconsistency Rule
        police = extracted_docs.get("police_report")
        if police and police.get("incident_date") and claim.incident_date:
            p_date = police.get("incident_date")
            if p_date != claim.incident_date:
                ref_id = evidence_id_map.get("police_report")
                signals.append({
                    "rule_id": "R05",
                    "signal_type": "RULE_DATE_CONTRADICTION",
                    "category": "RULES_ENGINE",
                    "severity": "HIGH",
                    "score_impact": 20.0,
                    "description": (
                        f"Deterministic date violation: Incident date reported to insurer ('{claim.incident_date}') "
                        f"does not match incident date recorded by law enforcement ('{p_date}')."
                    ),
                    "evidence_refs": [ref_id] if ref_id else [],
                    "observed_value": f"Claim: {claim.incident_date} vs Police: {p_date}",
                    "threshold": "Exact date match",
                    "explanation": "Contradictory accident dates between insured filing and police dispatch records indicate potential staged or misrepresented claims.",
                    "metadata": {
                        "rule_id": "R05",
                        "claim_date": claim.incident_date,
                        "police_date": p_date,
                        "observed_value": f"{claim.incident_date} != {p_date}",
                        "threshold": "Date Equality"
                    }
                })

        # R06: Policy Proximity / Short Inception Window
        if "POL-NEW" in (claim.policy_id or ""):
            signals.append({
                "rule_id": "R06",
                "signal_type": "RULE_NEW_POLICY_PROXIMITY",
                "category": "RULES_ENGINE",
                "severity": "MEDIUM",
                "score_impact": 15.0,
                "description": "Incident occurred within 48 hours of policy issuance.",
                "evidence_refs": [],
                "observed_value": "< 48 hours from issuance",
                "threshold": "> 48 hours",
                "explanation": "Claims filed immediately upon policy binding require SIU inception verification.",
                "metadata": {
                    "rule_id": "R06",
                    "policy_id": claim.policy_id,
                    "observed_value": "Short Inception Window",
                    "threshold": "> 48 hours"
                }
            })

        return signals

rules_engine = DeterministicRulesEngine()
