import os
import json
import hashlib
import asyncio
from pathlib import Path
from app.db.session import AsyncSessionLocal, init_db
from app.db.models import HistoricalClaim, Claim, Evidence
from app.agents.orchestrator import orchestrator
from app.core.config import settings

SAMPLE_HISTORICAL_CLAIMS = [
    {
        "id": "HIST-001",
        "policy_id": "POL-10029",
        "claimant_id": "CUST-9021",
        "claimant_name": "Elena Rostova",
        "vehicle_vin": "1HGCR2F83HA002100",
        "vehicle_make": "Honda",
        "vehicle_model": "Civic",
        "vehicle_year": 2021,
        "incident_date": "2025-02-14",
        "claim_amount": 2450.00,
        "repair_shop": "Metro Certified Collision",
        "invoice_number": "INV-MC-2025-104",
        "fraud_label": False,
        "status": "PAID"
    },
    {
        "id": "HIST-002",
        "policy_id": "POL-10044",
        "claimant_id": "CUST-9044",
        "claimant_name": "David Miller",
        "vehicle_vin": "4T1B11HK5JU100440",
        "vehicle_make": "Toyota",
        "vehicle_model": "Camry",
        "vehicle_year": 2020,
        "incident_date": "2025-04-18",
        "claim_amount": 3100.00,
        "repair_shop": "Precision Auto Body",
        "invoice_number": "INV-PAB-8821",
        "fraud_label": False,
        "status": "PAID"
    },
    {
        "id": "HIST-003",
        "policy_id": "POL-PRIOR-DUP",
        "claimant_id": "CUST-8812",
        "claimant_name": "Gary Thorne",
        "vehicle_vin": "3FA6P0H78HR100999",
        "vehicle_make": "Ford",
        "vehicle_model": "Fusion",
        "vehicle_year": 2019,
        "incident_date": "2025-06-20",
        "claim_amount": 5420.00,
        "repair_shop": "QuickCash Collision",
        "invoice_number": "INV-RECYCLED-9901",
        "fraud_label": True,
        "fraud_type": "RECYCLED_INVOICE",
        "status": "DENIED"
    },
    {
        "id": "HIST-004",
        "policy_id": "POL-FREQ-01",
        "claimant_id": "CUST-VELOCITY-SPIKE",
        "claimant_name": "Arthur Pendelton",
        "vehicle_vin": "1HGCR2F83HA008881",
        "vehicle_make": "Honda",
        "vehicle_model": "Accord",
        "vehicle_year": 2018,
        "incident_date": "2025-08-01",
        "claim_amount": 4200.00,
        "repair_shop": "QuickCash Collision",
        "invoice_number": "INV-QC-401",
        "fraud_label": False,
        "status": "PAID"
    },
    {
        "id": "HIST-005",
        "policy_id": "POL-FREQ-01",
        "claimant_id": "CUST-VELOCITY-SPIKE",
        "claimant_name": "Arthur Pendelton",
        "vehicle_vin": "1HGCR2F83HA008881",
        "vehicle_make": "Honda",
        "vehicle_model": "Accord",
        "vehicle_year": 2018,
        "incident_date": "2025-11-15",
        "claim_amount": 3800.00,
        "repair_shop": "QuickCash Collision",
        "invoice_number": "INV-QC-799",
        "fraud_label": False,
        "status": "PAID"
    },
    {
        "id": "HIST-006",
        "policy_id": "POL-FREQ-01",
        "claimant_id": "CUST-VELOCITY-SPIKE",
        "claimant_name": "Arthur Pendelton",
        "vehicle_vin": "1HGCR2F83HA008881",
        "vehicle_make": "Honda",
        "vehicle_model": "Accord",
        "vehicle_year": 2018,
        "incident_date": "2026-03-10",
        "claim_amount": 4900.00,
        "repair_shop": "QuickCash Collision",
        "invoice_number": "INV-QC-1102",
        "fraud_label": False,
        "status": "PAID"
    },
    {
        "id": "HIST-007",
        "policy_id": "POL-11002",
        "claimant_id": "CUST-3310",
        "claimant_name": "Samantha Lee",
        "vehicle_vin": "WBA3N5C59FK100222",
        "vehicle_make": "BMW",
        "vehicle_model": "330i",
        "vehicle_year": 2022,
        "incident_date": "2025-09-05",
        "claim_amount": 6200.00,
        "repair_shop": "Bavarian Motor Works Certified",
        "invoice_number": "INV-BMW-902",
        "fraud_label": False,
        "status": "PAID"
    }
]

def create_evidence_file(claim_id: str, filename: str, content: str) -> Path:
    claim_dir = settings.UPLOAD_DIR / claim_id
    claim_dir.mkdir(parents=True, exist_ok=True)
    file_path = claim_dir / filename
    file_path.write_text(content, encoding="utf-8")
    return file_path

async def seed_database():
    print("Initializing DB...")
    await init_db()

    async with AsyncSessionLocal() as db:
        print("Seeding historical claims benchmark data...")
        for h in SAMPLE_HISTORICAL_CLAIMS:
            existing = await db.get(HistoricalClaim, h["id"])
            if not existing:
                claim_hist = HistoricalClaim(**h)
                db.add(claim_hist)
        await db.commit()
        print(f"Seeded {len(SAMPLE_HISTORICAL_CLAIMS)} historical benchmark records.")

        # Seed the 6 Target Scenarios
        print("\nCreating 6 End-to-End Test Scenarios...")

        # -------------------------------------------------------------
        # SCENARIO A: Normal Legitimate Claim
        # -------------------------------------------------------------
        claim_a = Claim(
            id="CLM-SCENARIO-A",
            policy_id="POL-90100",
            claimant_id="CUST-5510",
            claimant_name="Sarah Jenkins",
            claimant_email="sarah.j@example.com",
            claimant_phone="+1-555-234-5678",
            incident_date="2026-08-10",
            incident_location="Oak Street & 4th Ave, Austin, TX",
            incident_description="Minor rear bumper scuff while parked at grocery store.",
            vehicle_make="Honda",
            vehicle_model="Civic",
            vehicle_year=2023,
            vehicle_vin="1HGCV1F34NA990001",
            vehicle_plate="TX-SK-892",
            estimated_vehicle_value=24500.0,
            claimed_amount=1450.00,
            status="CLAIM_RECEIVED"
        )
        db.add(claim_a)
        await db.commit()

        # Evidence: Claim Form, Repair Estimate, Invoice, Photo
        f_cf = create_evidence_file("CLM-SCENARIO-A", "claim_form.json", json.dumps({
            "policy_id": "POL-90100",
            "claimant_name": "Sarah Jenkins",
            "incident_date": "2026-08-10",
            "incident_location": "Oak Street & 4th Ave, Austin, TX",
            "incident_description": "Minor bumper scrape while backing out.",
            "vehicle_vin": "1HGCV1F34NA990001",
            "vehicle_make": "Honda",
            "vehicle_model": "Civic",
            "estimated_damage": 1450.00
        }))
        f_est = create_evidence_file("CLM-SCENARIO-A", "repair_estimate.json", json.dumps({
            "repair_shop": "Austin Precision Collision",
            "estimate_date": "2026-08-11",
            "vehicle_vin": "1HGCV1F34NA990001",
            "vehicle_make": "Honda",
            "vehicle_model": "Civic",
            "items": [
                {"part_name": "Rear Bumper Cover Refinish", "operation": "refinish", "part_cost": 450.0, "labor_hours": 3.0, "labor_cost": 450.0, "total_item_cost": 900.0},
                {"part_name": "Bumper Sensor Clip Re-align", "operation": "repair", "part_cost": 150.0, "labor_hours": 1.0, "labor_cost": 150.0, "total_item_cost": 300.0}
            ],
            "total_parts_cost": 600.0,
            "total_labor_cost": 600.0,
            "tax_cost": 250.0,
            "total_cost": 1450.00
        }))
        f_inv = create_evidence_file("CLM-SCENARIO-A", "invoice.json", json.dumps({
            "invoice_number": "INV-APC-2026-881",
            "invoice_date": "2026-08-12",
            "vendor_name": "Austin Precision Collision",
            "customer_name": "Sarah Jenkins",
            "subtotal": 1200.0,
            "tax": 250.0,
            "total_amount": 1450.00
        }))
        f_photo = create_evidence_file("CLM-SCENARIO-A", "photo_minor_scratch.jpg", "JPEG_DATA_PLACEHOLDER_MINOR_REAR_BUMPER_SCRATCH")

        for fpath, dtype in [(f_cf, "claim_form"), (f_est, "repair_estimate"), (f_inv, "invoice"), (f_photo, "damage_photo")]:
            content_b = fpath.read_bytes()
            ev = Evidence(
                id=f"EVD-A-{dtype[:3].upper()}",
                claim_id=claim_a.id,
                filename=fpath.name,
                stored_path=str(fpath),
                mime_type="application/json" if fpath.suffix == ".json" else "image/jpeg",
                document_type=dtype,
                file_size_bytes=len(content_b),
                sha256_hash=hashlib.sha256(content_b).hexdigest()
            )
            db.add(ev)
        await db.commit()

        # -------------------------------------------------------------
        # SCENARIO B: Suspicious Claim (Extreme Cost Anomaly & Suspicious Shop)
        # -------------------------------------------------------------
        claim_b = Claim(
            id="CLM-SCENARIO-B",
            policy_id="POL-90200",
            claimant_id="CUST-7740",
            claimant_name="Viktor Thorne",
            incident_date="2026-08-15",
            incident_location="Highway 183 South",
            incident_description="Single car sideswipe with safety guardrail.",
            vehicle_make="Ford",
            vehicle_model="Focus",
            vehicle_year=2017,
            vehicle_vin="1FADP3F29HL990002",
            estimated_vehicle_value=9500.0,
            claimed_amount=10200.00,
            status="CLAIM_RECEIVED"
        )
        db.add(claim_b)
        await db.commit()

        f_est_b = create_evidence_file("CLM-SCENARIO-B", "repair_estimate.json", json.dumps({
            "repair_shop": "QuickCash Collision",
            "estimate_date": "2026-08-16",
            "vehicle_vin": "1FADP3F29HL990002",
            "items": [
                {"part_name": "Full Body Panel Replacement", "part_cost": 2500.0, "labor_hours": 18.0, "labor_cost": 5000.0, "total_item_cost": 7500.0},
                {"part_name": "Custom Paint Resurfacing", "part_cost": 700.0, "labor_hours": 10.0, "labor_cost": 2000.0, "total_item_cost": 2700.0}
            ],
            "total_parts_cost": 3200.0,
            "total_labor_cost": 7000.0,
            "total_cost": 10200.00
        }))
        f_inv_b = create_evidence_file("CLM-SCENARIO-B", "invoice.json", json.dumps({
            "invoice_number": "INV-QC-9990",
            "invoice_date": "2026-08-17",
            "vendor_name": "QuickCash Collision",
            "total_amount": 10200.00
        }))
        for fpath, dtype in [(f_est_b, "repair_estimate"), (f_inv_b, "invoice")]:
            cb = fpath.read_bytes()
            db.add(Evidence(
                id=f"EVD-B-{dtype[:3].upper()}",
                claim_id=claim_b.id,
                filename=fpath.name,
                stored_path=str(fpath),
                mime_type="application/json",
                document_type=dtype,
                file_size_bytes=len(cb),
                sha256_hash=hashlib.sha256(cb).hexdigest()
            ))
        await db.commit()

        # -------------------------------------------------------------
        # SCENARIO C: Document Inconsistency (Accident Date Conflict)
        # -------------------------------------------------------------
        claim_c = Claim(
            id="CLM-SCENARIO-C",
            policy_id="POL-90300",
            claimant_id="CUST-1049",
            claimant_name="Jennifer Gomez",
            incident_date="2026-08-12",  # Claim says Aug 12
            incident_location="Congress Ave & 6th St",
            incident_description="Sideswiped at red light.",
            vehicle_make="Toyota",
            vehicle_model="RAV4",
            vehicle_year=2021,
            vehicle_vin="2T3F1RFV8MC990003",
            estimated_vehicle_value=22000.0,
            claimed_amount=4200.00,
            status="CLAIM_RECEIVED"
        )
        db.add(claim_c)
        await db.commit()

        f_cf_c = create_evidence_file("CLM-SCENARIO-C", "claim_form.json", json.dumps({
            "claimant_name": "Jennifer Gomez",
            "incident_date": "2026-08-12",
            "incident_location": "Congress Ave & 6th St",
            "estimated_damage": 4200.00
        }))
        f_police_c = create_evidence_file("CLM-SCENARIO-C", "police_report.json", json.dumps({
            "report_number": "PR-TX-99410",
            "police_department": "Austin Police Dept",
            "incident_date": "2026-08-28",  # Police report recorded Aug 28 (16 days later!)
            "incident_location": "Congress Ave & 6th St",
            "damage_description": "Moderate quarter panel scrape."
        }))
        for fpath, dtype in [(f_cf_c, "claim_form"), (f_police_c, "police_report")]:
            cb = fpath.read_bytes()
            db.add(Evidence(
                id=f"EVD-C-{dtype[:3].upper()}",
                claim_id=claim_c.id,
                filename=fpath.name,
                stored_path=str(fpath),
                mime_type="application/json",
                document_type=dtype,
                file_size_bytes=len(cb),
                sha256_hash=hashlib.sha256(cb).hexdigest()
            ))
        await db.commit()

        # -------------------------------------------------------------
        # SCENARIO D: Repair Estimate vs. Photo Mismatch (Ghost Repairs)
        # -------------------------------------------------------------
        claim_d = Claim(
            id="CLM-SCENARIO-D",
            policy_id="POL-90400",
            claimant_id="CUST-3901",
            claimant_name="Robert Sterling",
            incident_date="2026-08-14",
            incident_location="Lamar Blvd",
            incident_description="Low speed parking lot collision.",
            vehicle_make="BMW",
            vehicle_model="X3",
            vehicle_year=2022,
            vehicle_vin="5UXTY5C04N990004",
            estimated_vehicle_value=36000.0,
            claimed_amount=8750.00,
            status="CLAIM_RECEIVED"
        )
        db.add(claim_d)
        await db.commit()

        # Photo shows minor passenger rear door dent
        f_photo_d = create_evidence_file("CLM-SCENARIO-D", "photo_mismatch_rear_dent.jpg", "JPEG_DATA_PLACEHOLDER_PASSENGER_REAR_DOOR_SCRATCH")
        # Estimate charges for entire front clip, hood, engine rebuild
        f_est_d = create_evidence_file("CLM-SCENARIO-D", "repair_estimate.json", json.dumps({
            "repair_shop": "Metro Collision Specialists",
            "estimate_date": "2026-08-15",
            "items": [
                {"part_name": "Front Bumper Assembly", "part_cost": 2200.0, "labor_hours": 6.0, "labor_cost": 900.0, "total_item_cost": 3100.0},
                {"part_name": "Aluminum Hood Replacement", "part_cost": 1800.0, "labor_hours": 5.0, "labor_cost": 750.0, "total_item_cost": 2550.0},
                {"part_name": "Radiator Support & Condenser", "part_cost": 2100.0, "labor_hours": 6.5, "labor_cost": 1000.0, "total_item_cost": 3100.0}
            ],
            "total_parts_cost": 6100.0,
            "total_labor_cost": 2650.0,
            "total_cost": 8750.00
        }))
        for fpath, dtype in [(f_photo_d, "damage_photo"), (f_est_d, "repair_estimate")]:
            cb = fpath.read_bytes()
            db.add(Evidence(
                id=f"EVD-D-{dtype[:3].upper()}",
                claim_id=claim_d.id,
                filename=fpath.name,
                stored_path=str(fpath),
                mime_type="image/jpeg" if "photo" in dtype else "application/json",
                document_type=dtype,
                file_size_bytes=len(cb),
                sha256_hash=hashlib.sha256(cb).hexdigest()
            ))
        await db.commit()

        # -------------------------------------------------------------
        # SCENARIO E: Duplicate Invoice (Recycled Invoice from Settled Claim)
        # -------------------------------------------------------------
        claim_e = Claim(
            id="CLM-SCENARIO-E",
            policy_id="POL-90500",
            claimant_id="CUST-8812",
            claimant_name="Gary Thorne",
            incident_date="2026-08-18",
            incident_location="Riverside Dr",
            incident_description="Fender bender collision.",
            vehicle_make="Ford",
            vehicle_model="Fusion",
            vehicle_year=2019,
            vehicle_vin="3FA6P0H78HR990005",
            estimated_vehicle_value=12000.0,
            claimed_amount=5420.00,
            status="CLAIM_RECEIVED"
        )
        db.add(claim_e)
        await db.commit()

        # Recycles exact invoice number INV-RECYCLED-9901 from HIST-003!
        f_inv_e = create_evidence_file("CLM-SCENARIO-E", "invoice.json", json.dumps({
            "invoice_number": "INV-RECYCLED-9901",
            "invoice_date": "2026-08-18",
            "vendor_name": "QuickCash Collision",
            "customer_name": "Gary Thorne",
            "total_amount": 5420.00
        }))
        cb = f_inv_e.read_bytes()
        db.add(Evidence(
            id="EVD-E-INV",
            claim_id=claim_e.id,
            filename=f_inv_e.name,
            stored_path=str(f_inv_e),
            mime_type="application/json",
            document_type="invoice",
            file_size_bytes=len(cb),
            sha256_hash=hashlib.sha256(cb).hexdigest()
        ))
        await db.commit()

        # -------------------------------------------------------------
        # SCENARIO F: Historical Frequency Anomaly (Velocity Spike)
        # -------------------------------------------------------------
        claim_f = Claim(
            id="CLM-SCENARIO-F",
            policy_id="POL-FREQ-01",
            claimant_id="CUST-VELOCITY-SPIKE",
            claimant_name="Arthur Pendelton",
            incident_date="2026-08-20",
            incident_location="Airport Blvd & MLK",
            incident_description="Rear-ended at traffic signal.",
            vehicle_make="Honda",
            vehicle_model="Accord",
            vehicle_year=2018,
            vehicle_vin="1HGCR2F83HA008881",
            estimated_vehicle_value=14000.0,
            claimed_amount=4600.00,
            status="CLAIM_RECEIVED"
        )
        db.add(claim_f)
        await db.commit()

        f_inv_f = create_evidence_file("CLM-SCENARIO-F", "invoice.json", json.dumps({
            "invoice_number": "INV-QC-2026-90",
            "invoice_date": "2026-08-20",
            "vendor_name": "QuickCash Collision",
            "customer_name": "Arthur Pendelton",
            "total_amount": 4600.00
        }))
        cb = f_inv_f.read_bytes()
        db.add(Evidence(
            id="EVD-F-INV",
            claim_id=claim_f.id,
            filename=f_inv_f.name,
            stored_path=str(f_inv_f),
            mime_type="application/json",
            document_type="invoice",
            file_size_bytes=len(cb),
            sha256_hash=hashlib.sha256(cb).hexdigest()
        ))
        await db.commit()

        print("Seeded Scenarios A through F successfully.")

        # Run pipeline on all 6 scenarios to populate fraud signals, risk assessments, and routing
        print("\nExecuting Fraud Detection Orchestrator across Scenarios A - F...")
        for scenario_id in [
            "CLM-SCENARIO-A",
            "CLM-SCENARIO-B",
            "CLM-SCENARIO-C",
            "CLM-SCENARIO-D",
            "CLM-SCENARIO-E",
            "CLM-SCENARIO-F"
        ]:
            print(f"-> Analyzing {scenario_id}...")
            analyzed_claim = await orchestrator.run_fraud_analysis_pipeline(db, scenario_id)
            print(f"   Done: Status={analyzed_claim.status} | Risk Score={analyzed_claim.risk_score} | Level={analyzed_claim.risk_level}")

        print("\nSeed and Pipeline Execution Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
