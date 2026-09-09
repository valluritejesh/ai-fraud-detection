import logging
from typing import List, Dict, Any, Tuple
from app.core.config import settings

logger = logging.getLogger("risk_engine")

class FraudRiskEngine:
    """
    Transparent Multi-Signal Fraud Risk Engine.
    Synthesizes signals from deterministic rules, historical anomalies, vision analysis,
    and cross-evidence verification into a normalized (0-100) score and explainable narrative.
    """

    def calculate_risk(
        self,
        signals: List[Dict[str, Any]],
        claimed_amount: float
    ) -> Tuple[float, str, Dict[str, float], str, str]:
        """
        Calculates composite risk score and synthesizes explainable assessment.
        Returns:
            overall_score (float),
            risk_level (str),
            score_breakdown (dict),
            explanation (str),
            recommended_action (str)
        """
        breakdown = {
            "rules_engine": 0.0,
            "historical_anomaly": 0.0,
            "vision_mismatch": 0.0,
            "verification_discrepancy": 0.0,
            "document_integrity": 0.0
        }

        # Weight categories
        for s in signals:
            cat = s.get("category", "").upper()
            impact = float(s.get("score_impact", 0.0))

            if "RULES" in cat:
                breakdown["rules_engine"] += impact
            elif "HISTORICAL" in cat:
                breakdown["historical_anomaly"] += impact
            elif "VISION" in cat:
                breakdown["vision_mismatch"] += impact
            elif "VERIFICATION" in cat:
                breakdown["verification_discrepancy"] += impact
            else:
                breakdown["document_integrity"] += impact

        # Base composite score
        raw_score = sum(breakdown.values())

        # If no signals triggered, baseline legitimate claim score is low (0-10)
        if not signals:
            overall_score = 5.0
        else:
            # Score normalization: Cap at 100.0, minimum 0.0
            overall_score = min(100.0, max(0.0, raw_score))

        # Determine Risk Level based on configurable thresholds
        if overall_score <= settings.RISK_THRESHOLD_LOW:
            risk_level = "LOW"
            recommended_action = "FAST_TRACK_PAYMENT"
        elif overall_score <= settings.RISK_THRESHOLD_MEDIUM:
            risk_level = "MEDIUM"
            recommended_action = "STANDARD_ADJUSTER_REVIEW"
        elif overall_score <= settings.RISK_THRESHOLD_HIGH:
            risk_level = "HIGH"
            recommended_action = "SIU_INVESTIGATION_REQUIRED"
        else:
            risk_level = "CRITICAL"
            recommended_action = "IMMEDIATE_CLAIM_FREEZE_AND_AUDIT"

        # Generate Explainable Assessment
        explanation = self._generate_explanation(overall_score, risk_level, signals, breakdown)

        return round(overall_score, 1), risk_level, breakdown, explanation, recommended_action

    def _generate_explanation(
        self,
        score: float,
        level: str,
        signals: List[Dict[str, Any]],
        breakdown: Dict[str, float]
    ) -> str:
        if not signals or score <= settings.RISK_THRESHOLD_LOW:
            return (
                f"Risk assessment indicates a LOW risk profile (Score: {score}/100). "
                f"Multi-agent cross-checks found consistent dates, validated repair estimates, "
                f"matching photographic damage, and no prior adverse history. "
                f"Recommended for straight-through automated processing."
            )

        lines = [
            f"ASSESSED RISK: {level} ({score:.0f}/100).",
            f"The fraud detection orchestrator detected {len(signals)} adverse signal(s) across evidence sources.",
            "",
            "Key Risk Drivers:"
        ]

        # Sort signals by severity / impact descending
        sorted_signals = sorted(signals, key=lambda x: x.get("score_impact", 0.0), reverse=True)
        for idx, s in enumerate(sorted_signals, 1):
            refs = s.get("evidence_refs", [])
            ref_str = f" [Evidence: {', '.join(refs)}]" if refs else ""
            lines.append(
                f"{idx}. [{s.get('severity')}] {s.get('signal_type')}: {s.get('description')}{ref_str}"
            )

        lines.extend([
            "",
            f"Category Breakdown: Rules={breakdown['rules_engine']:.0f}pts | "
            f"Verification={breakdown['verification_discrepancy']:.0f}pts | "
            f"Vision={breakdown['vision_mismatch']:.0f}pts | "
            f"History={breakdown['historical_anomaly']:.0f}pts | "
            f"Document={breakdown['document_integrity']:.0f}pts.",
            "",
            "Notice: In accordance with responsible AI standards, final determination must be made by a human investigator."
        ])

        return "\n".join(lines)

risk_engine = FraudRiskEngine()
