import logging
from typing import Dict, Any, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import HistoricalClaim, Claim

logger = logging.getLogger("historical_agent")

KNOWN_SUSPICIOUS_SHOPS = [
    "QuickCash Collision",
    "Phantom Auto Restorations",
    "Apex Collision Center - Unregistered Branch"
]

VEHICLE_REPAIR_BENCHMARKS = {
    "honda": 3200.0,
    "toyota": 3100.0,
    "ford": 3600.0,
    "bmw": 6500.0,
    "mercedes": 7200.0,
    "default": 3500.0
}

class HistoricalPatternAgent:
    """
    Historical Analysis & Anomaly Detection Agent.
    Evaluates claimant claim velocity, repair shop risk profiles, invoice uniqueness,
    and cost anomaly deviations against historical claim baselines.
    """

    async def analyze_claim_patterns(
        self,
        db: AsyncSession,
        current_claim: Claim,
        extracted_invoice: Dict[str, Any] = None,
        extracted_estimate: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        anomalies = []

        # 1. Claimant Velocity / Frequency Anomaly
        stmt = select(func.count(HistoricalClaim.id)).where(
            (HistoricalClaim.claimant_id == current_claim.claimant_id) |
            (HistoricalClaim.policy_id == current_claim.policy_id)
        )
        result = await db.execute(stmt)
        past_claim_count = result.scalar() or 0

        stmt_current = select(func.count(Claim.id)).where(
            Claim.claimant_id == current_claim.claimant_id,
            Claim.id != current_claim.id
        )
        result_curr = await db.execute(stmt_current)
        other_current_count = result_curr.scalar() or 0

        total_prior_claims = past_claim_count + other_current_count
        if total_prior_claims >= 2:
            anomalies.append({
                "signal_type": "CLAIM_FREQUENCY_SPIKE",
                "category": "HISTORICAL_ANOMALY",
                "severity": "CRITICAL" if total_prior_claims >= 3 else "HIGH",
                "score_impact": 40.0 if total_prior_claims >= 3 else 25.0,
                "description": (
                    f"Claimant {current_claim.claimant_name} ({current_claim.claimant_id}) has filed "
                    f"{total_prior_claims} prior claims in the past 24 months (regional avg is 0.28 per policyholder)."
                ),
                "metadata": {
                    "total_prior_claims": total_prior_claims,
                    "claimant_id": current_claim.claimant_id
                }
            })

        # 2. Duplicate Invoice Number Check
        invoice_num = None
        if extracted_invoice and extracted_invoice.get("invoice_number"):
            invoice_num = str(extracted_invoice.get("invoice_number")).strip()

        if invoice_num:
            dup_stmt = select(HistoricalClaim).where(
                HistoricalClaim.invoice_number == invoice_num
            )
            dup_res = await db.execute(dup_stmt)
            prior_dup = dup_res.scalars().first()

            if prior_dup:
                anomalies.append({
                    "signal_type": "DUPLICATE_INVOICE_RECYCLED",
                    "category": "HISTORICAL_ANOMALY",
                    "severity": "CRITICAL",
                    "score_impact": 45.0,
                    "description": (
                        f"Invoice number '{invoice_num}' was previously submitted and settled on "
                        f"{prior_dup.incident_date} under historical claim {prior_dup.id} for ${prior_dup.claim_amount:,.2f}."
                    ),
                    "metadata": {
                        "recycled_invoice_number": invoice_num,
                        "prior_claim_id": prior_dup.id,
                        "prior_incident_date": prior_dup.incident_date,
                        "prior_claim_amount": prior_dup.claim_amount
                    }
                })

        # 3. Suspicious or Repeat Offender Repair Shop
        shop_name = ""
        if extracted_estimate and extracted_estimate.get("repair_shop"):
            shop_name = extracted_estimate.get("repair_shop")
        elif extracted_invoice and extracted_invoice.get("vendor_name"):
            shop_name = extracted_invoice.get("vendor_name")

        if shop_name:
            if any(susp.lower() in shop_name.lower() for susp in KNOWN_SUSPICIOUS_SHOPS):
                anomalies.append({
                    "signal_type": "HIGH_RISK_REPAIR_SHOP",
                    "category": "HISTORICAL_ANOMALY",
                    "severity": "HIGH",
                    "score_impact": 25.0,
                    "description": f"Repair facility '{shop_name}' is on the Special Investigation Unit (SIU) watchlist for recurring estimate inflation.",
                    "metadata": {"repair_shop": shop_name}
                })

            shop_stmt = select(func.count(HistoricalClaim.id)).where(
                HistoricalClaim.repair_shop.ilike(f"%{shop_name}%"),
                HistoricalClaim.fraud_label == True
            )
            shop_res = await db.execute(shop_stmt)
            fraudulent_shop_claims = shop_res.scalar() or 0

            if fraudulent_shop_claims >= 2:
                anomalies.append({
                    "signal_type": "REPEAT_FRAUDULENT_VENDOR",
                    "category": "HISTORICAL_ANOMALY",
                    "severity": "HIGH",
                    "score_impact": 20.0,
                    "description": f"Repair shop '{shop_name}' is associated with {fraudulent_shop_claims} historically confirmed fraudulent claims.",
                    "metadata": {"shop_name": shop_name, "prior_fraud_cases": fraudulent_shop_claims}
                })

        # 4. Repair Cost Anomaly vs Vehicle Benchmark
        make = (current_claim.vehicle_make or "default").lower()
        benchmark = VEHICLE_REPAIR_BENCHMARKS.get(make, VEHICLE_REPAIR_BENCHMARKS["default"])
        claim_amount = current_claim.claimed_amount

        if claim_amount > benchmark * 2.5 and current_claim.status != "TOTAL_LOSS":
            anomalies.append({
                "signal_type": "ABNORMAL_REPAIR_COST_MAGNITUDE",
                "category": "HISTORICAL_ANOMALY",
                "severity": "MEDIUM",
                "score_impact": 20.0,
                "description": (
                    f"Claimed repair cost of ${claim_amount:,.2f} is {claim_amount / benchmark:.1f}x higher "
                    f"than the average collision repair benchmark (${benchmark:,.2f}) for a {current_claim.vehicle_year} {current_claim.vehicle_make} {current_claim.vehicle_model}."
                ),
                "metadata": {
                    "claimed_amount": claim_amount,
                    "benchmark_amount": benchmark,
                    "deviation_multiplier": round(claim_amount / benchmark, 2)
                }
            })

        return anomalies

historical_agent = HistoricalPatternAgent()
