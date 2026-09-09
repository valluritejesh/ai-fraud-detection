import logging
from typing import Dict, Any, List, Optional
from app.db.models import Claim
from app.agents.vision_agent import vision_agent
from app.schemas.evidence import DamagePhotoExtraction

logger = logging.getLogger("verification_agent")

class EvidenceVerificationAgent:
    """
    Verification Agent for Cross-Evidence Reconciliation.
    Performs multi-source comparison across claim forms, police reports, repair estimates,
    invoices, crash photographs, and historical files.
    Every discrepancy anchors directly to specific evidence IDs.
    """

    def verify_all_evidence(
        self,
        claim: Claim,
        extracted_docs: Dict[str, Dict[str, Any]],
        photo_extractions: List[DamagePhotoExtraction],
        evidence_id_map: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        discrepancies = []

        claim_form = extracted_docs.get("claim_form") or {}
        police_report = extracted_docs.get("police_report")
        repair_estimate = extracted_docs.get("repair_estimate")
        invoice = extracted_docs.get("invoice")

        # 1. CROSS-CHECK: Claim Form vs. Police Report (Incident Date & Location)
        if police_report:
            p_date = police_report.get("incident_date")
            c_date = claim.incident_date or claim_form.get("incident_date")

            if p_date and c_date and p_date != c_date:
                ref_claim = evidence_id_map.get("claim_form")
                ref_police = evidence_id_map.get("police_report")
                refs = [r for r in [ref_claim, ref_police] if r]
                discrepancies.append({
                    "signal_type": "DATE_CONFLICT_CLAIM_VS_POLICE",
                    "category": "VERIFICATION_DISCREPANCY",
                    "severity": "CRITICAL",
                    "score_impact": 50.0,
                    "description": (
                        f"Critical incident date conflict: Claim submission states accident occurred on '{c_date}', "
                        f"whereas official Police Incident Report records event date as '{p_date}'."
                    ),
                    "evidence_refs": refs,
                    "metadata": {"claim_date": c_date, "police_date": p_date}
                })

            # Location conflict
            p_loc = (police_report.get("incident_location") or "").lower()
            c_loc = (claim.incident_location or "").lower()
            if p_loc and c_loc and not any(word in c_loc for word in p_loc.split() if len(word) > 4):
                ref_police = evidence_id_map.get("police_report")
                discrepancies.append({
                    "signal_type": "LOCATION_CONFLICT_CLAIM_VS_POLICE",
                    "category": "VERIFICATION_DISCREPANCY",
                    "severity": "MEDIUM",
                    "score_impact": 20.0,
                    "description": (
                        f"Reported incident location '{claim.incident_location}' conflicts with "
                        f"official police report location '{police_report.get('incident_location')}'."
                    ),
                    "evidence_refs": [ref_police] if ref_police else [],
                    "metadata": {"claim_location": claim.incident_location, "police_location": police_report.get("incident_location")}
                })

        # 2. CROSS-CHECK: Repair Estimate vs. Accident Photos (Ghost Repairs)
        if repair_estimate and photo_extractions:
            mismatch = vision_agent.detect_estimate_photo_mismatch(photo_extractions, repair_estimate)
            if mismatch:
                ref_estimate = evidence_id_map.get("repair_estimate")
                photo_refs = [v for k, v in evidence_id_map.items() if "photo" in k or "image" in k]
                all_refs = ([ref_estimate] if ref_estimate else []) + photo_refs
                
                # Severe discrepancy: estimate claims major front repairs while photo shows minor cosmetic rear dent
                discrepancies.append({
                    "signal_type": "ESTIMATE_PHOTO_DAMAGE_MISMATCH",
                    "category": "VISION_MISMATCH",
                    "severity": "HIGH",
                    "score_impact": 40.0,
                    "description": (
                        f"Significant discrepancy between crash imagery and repair estimate: "
                        f"{mismatch['discrepancy_summary']}"
                    ),
                    "evidence_refs": all_refs,
                    "metadata": mismatch
                })

                if mismatch.get("unsupported_parts"):
                    discrepancies.append({
                        "signal_type": "UNSUPPORTED_BILLED_PARTS",
                        "category": "DOCUMENT_INTEGRITY",
                        "severity": "HIGH",
                        "score_impact": 30.0,
                        "description": (
                            f"Repair estimate contains {len(mismatch['unsupported_parts'])} billed components "
                            f"not visible or damaged in photographic evidence: {mismatch['unsupported_parts']}."
                        ),
                        "evidence_refs": all_refs,
                        "metadata": {"unsupported_parts": mismatch["unsupported_parts"]}
                    })

        # 3. CROSS-CHECK: Invoice vs. Repair Estimate (Billing & Amount Discrepancies)
        if invoice and repair_estimate:
            inv_total = float(invoice.get("total_amount", 0.0))
            est_total = float(repair_estimate.get("total_cost", 0.0))

            if est_total > 0 and abs(inv_total - est_total) > 500.0:
                diff = inv_total - est_total
                ref_inv = evidence_id_map.get("invoice")
                ref_est = evidence_id_map.get("repair_estimate")
                refs = [r for r in [ref_inv, ref_est] if r]
                discrepancies.append({
                    "signal_type": "INVOICE_ESTIMATE_AMOUNT_MISMATCH",
                    "category": "VERIFICATION_DISCREPANCY",
                    "severity": "HIGH" if diff > 1500.0 else "MEDIUM",
                    "score_impact": 25.0 if diff > 1500.0 else 15.0,
                    "description": (
                        f"Invoice total (${inv_total:,.2f}) deviates by ${abs(diff):,.2f} "
                        f"from authorized repair estimate total (${est_total:,.2f})."
                    ),
                    "evidence_refs": refs,
                    "metadata": {"invoice_total": inv_total, "estimate_total": est_total, "difference": diff}
                })

            # Shop name check
            inv_shop = (invoice.get("vendor_name") or "").lower()
            est_shop = (repair_estimate.get("repair_shop") or "").lower()
            if inv_shop and est_shop and inv_shop != est_shop:
                refs = [r for r in [evidence_id_map.get("invoice"), evidence_id_map.get("repair_estimate")] if r]
                discrepancies.append({
                    "signal_type": "VENDOR_MISMATCH_INVOICE_VS_ESTIMATE",
                    "category": "VERIFICATION_DISCREPANCY",
                    "severity": "MEDIUM",
                    "score_impact": 15.0,
                    "description": (
                        f"Repair vendor name inconsistency: Invoice vendor is '{invoice.get('vendor_name')}', "
                        f"whereas repair estimate was generated by '{repair_estimate.get('repair_shop')}'."
                    ),
                    "evidence_refs": refs,
                    "metadata": {"invoice_vendor": invoice.get("vendor_name"), "estimate_vendor": repair_estimate.get("repair_shop")}
                })

        # 4. CROSS-CHECK: Claim VIN vs. Document VINs
        if repair_estimate:
            est_vin = repair_estimate.get("vehicle_vin")
            if est_vin and claim.vehicle_vin and est_vin.strip().upper() != claim.vehicle_vin.strip().upper():
                ref_est = evidence_id_map.get("repair_estimate")
                discrepancies.append({
                    "signal_type": "VIN_MISMATCH_CLAIM_VS_ESTIMATE",
                    "category": "DOCUMENT_INTEGRITY",
                    "severity": "CRITICAL",
                    "score_impact": 40.0,
                    "description": (
                        f"Vehicle Identification Number (VIN) mismatch: Policy vehicle VIN '{claim.vehicle_vin}' "
                        f"does not match VIN '{est_vin}' on submitted repair estimate."
                    ),
                    "evidence_refs": [ref_est] if ref_est else [],
                    "metadata": {"claim_vin": claim.vehicle_vin, "estimate_vin": est_vin}
                })

        return discrepancies

verification_agent = EvidenceVerificationAgent()
