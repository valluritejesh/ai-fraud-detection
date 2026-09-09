# Implementation Plan — AI Fraud Detection Agent Platform

## 1. Project Overview & Architecture
The AI Fraud Detection Agent Platform is an enterprise-grade, explainable, multimodal insurance claim verification and fraud-risk investigation system. The architecture adheres to human-in-the-loop principles: AI agents analyze multimodal evidence, detect discrepancies, and compute transparent risk scores, while licensed human investigators retain ultimate decision authority.

```
                  +--------------------------+
                  |  Claim Intake / Web UI   |
                  +-------------+------------+
                                |
                                v
                  +--------------------------+
                  |    Claims Intake API     |
                  +-------------+------------+
                                |
                                v
                  +--------------------------+
                  | Evidence Storage & Repo  |
                  +-------------+------------+
                                |
        +-----------------------+-----------------------+
        |                       |                       |
        v                       v                       v
+---------------+       +---------------+       +---------------+
| Document      |       | Vision        |       | Historical    |
| Agent         |       | Agent         |       | Pattern Agent |
+-------+-------+       +-------+-------+       +-------+-------+
        |                       |                       |
        +-----------------------+-----------------------+
                                |
                                v
                  +--------------------------+
                  | Deterministic Rules Engine|
                  +-------------+------------+
                                |
                                v
                  +--------------------------+
                  |   Verification Agent     |
                  +-------------+------------+
                                |
                                v
                  +--------------------------+
                  |    Fraud Risk Engine     |
                  +-------------+------------+
                                |
                 +--------------+--------------+
                 |                             |
      Score <= 60 (LOW/MED)         Score > 60 (HIGH/CRITICAL)
                 |                             |
                 v                             v
       +-------------------+         +-------------------+
       | Normal Processing |         | Investigation Case|
       +-------------------+         +---------+---------+
                                               |
                                               v
                                     +-------------------+
                                     | Human Investigator|
                                     | (Override/Decide) |
                                     +---------+---------+
                                               |
                                               v
                                     +-------------------+
                                     | External Claims   |
                                     | Management System |
                                     +-------------------+
```

---

## 2. Technical Stack
- **Backend**: Python 3.11, FastAPI (async/await), Pydantic v2 schemas, SQLAlchemy 2.0 (async SQLite for local, Azure SQL/PostgreSQL compatible), Uvicorn.
- **Agent Runtimes**: Pluggable agent architecture with local deterministic/heuristic parsers + mock providers + Azure OpenAI / Document Intelligence / Computer Vision SDK adapters.
- **Frontend**: React 18 / 19, TypeScript, Vite, Tailwind CSS, Lucide React, Axios.
- **Testing**: Pytest, Pytest-Asyncio, HTTPX, Coverage.
- **Persistence & Evidence**: Local file storage with SHA-256 integrity verification, extensible to Azure Blob Storage.
- **Audit Logging**: Immutable event log tracking every ingestion, agent run, fraud signal, and investigator action.

---

## 3. Phased Implementation Roadmap

### Phase 1: Architecture, Project Scaffolding & Documentation
- Setup directory structure for `backend`, `frontend`, and `docs`.
- Create Python virtual environment and dependencies using `uv`.
- Write documentation: `CURRENT_STATE.md`, `IMPLEMENTATION_PLAN.md`, `AZURE_ARCHITECTURE.md`, `SECURITY.md`.

### Phase 2: Relational Database & Evidence Data Layer
- Design SQLAlchemy 2.0 models:
  - `Claim`: ID, policy_id, claimant, incident_date, location, claimed_amount, vehicle info, status, risk_score, risk_level.
  - `Evidence`: ID, claim_id, file_path, filename, mime_type, document_type, sha256_hash, extracted_data (JSON), extraction_status, confidence.
  - `FraudSignal`: ID, claim_id, signal_type, category, severity, score_impact, description, evidence_refs (JSON), metadata.
  - `RiskAssessment`: ID, claim_id, overall_score, risk_level, breakdown (JSON), explanation, recommended_action, generated_at.
  - `InvestigationCase`: ID, claim_id, status (QUEUED, IN_REVIEW, ESCALATED, APPROVED, REJECTED), assigned_to, investigator_notes, ai_override_reason, final_decision, decided_at, decided_by.
  - `AuditLog`: ID, timestamp, actor, action, resource_type, resource_id, old_value (JSON), new_value (JSON), metadata.
  - `HistoricalClaim`: Reference benchmark dataset table for repeat claimant/shop/invoice pattern queries.

### Phase 3 & 4: Claim Intake API & Evidence Storage
- Fast, secure file upload and claim creation endpoints:
  - `POST /api/v1/claims`: Submit new claim with vehicle, claimant, incident details.
  - `POST /api/v1/claims/{claim_id}/evidence`: Upload documents (PDF, JPG, PNG) with automatic SHA-256 computation, MIME sniffing, and storage.
  - Evidence integrity verification and metadata tracking.

### Phase 5: Document Processing Agent
- Structured data extraction for:
  - Claim forms: Claimant, incident date, location, driver, description, reported damages.
  - Repair estimates: Shop name, parts list, labor rate, labor hours, parts total, tax, total cost.
  - Invoices: Invoice number, date, vendor, line items, total amount, payment terms.
  - Police reports: Officer badge, report number, incident date/time, weather/road conditions, citation/fault determination.
- Pydantic schema validation for all extractions. Local fallback/mock engine for offline testing + Azure AI Document Intelligence connector interface.

### Phase 6: Vision Analysis Agent
- Multimodal damage evaluation:
  - Damage localization (bumper, fender, hood, door, windshield, undercarriage).
  - Severity assessment (minor scratch vs. structural frame destruction).
  - Cross-photo vehicle consistency (make, model, color, license plate).
  - Estimate vs. visual mismatch detection (e.g. estimate claims new transmission/engine rebuild while photo shows bumper scuff).

### Phase 7: Historical Pattern & Anomaly Detection Agent
- Frequency analysis: Claims per policyholder in rolling 12/24 months.
- Repair shop profiling: High-frequency collision center collusions, average markup vs. regional average.
- Duplicate invoice checking across past claims.
- Cost anomaly statistical analysis against vehicle make/year repair benchmarks.

### Phase 8: Deterministic Rules Engine
- Configurable rules:
  1. `R01_DUPLICATE_INVOICE`: Invoice number matches an existing paid claim.
  2. `R02_DATE_INCONSISTENCY`: Accident date on claim form does not match police report or estimate date.
  3. `R03_EXCESSIVE_CLAIM_RATIO`: Claimed repair amount > 85% of vehicle fair market value without total loss declaration.
  4. `R04_UNSUPPORTED_REPAIR_PARTS`: Repair estimate includes major components not reported in accident narrative or visible in photos.
  5. `R05_POLICY_LAPSE_PROXIMITY`: Incident occurred within 48 hours of policy inception or renewal reinstatement.

### Phase 9: Verification Agent (Cross-Evidence Reconciliation)
- Cross-evidence matrix:
  - Claim Form vs. Police Report (dates, locations, contributing factors).
  - Claim Form vs. Repair Estimate (damage items, costs).
  - Photos vs. Repair Estimate (visible damage vs. billed items).
  - Invoice vs. Repair Estimate (billed amounts vs. estimated parts/labor).
  - Current Claim vs. Historical Records (prior damage on same vehicle, repeat VIN claims).

### Phase 10: Fraud Risk Engine & Explainability
- Composite scoring formula:
  $$\text{RiskScore} = \min(100, \sum w_i \cdot \text{SignalSeverity}_i + \text{RulePenalties})$$
- Scoring bands:
  - 0–30: LOW (Fast-track straight-through processing)
  - 31–60: MEDIUM (Standard review)
  - 61–80: HIGH (Mandatory Special Investigation Unit - SIU referral)
  - 81–100: CRITICAL (Immediate freeze & comprehensive audit)
- Natural language explanation generation with explicit citations to evidence items (`DOC-001`, `IMG-002`).

### Phase 11: Agent Orchestrator & Asynchronous Processing
- Background orchestration engine:
  - Dispatches parallel workers for document, vision, and historical analysis.
  - Aggregates extractions into verification agent.
  - Executes rules engine and risk calculation.
  - Transitions claim status: `CLAIM_RECEIVED -> PROCESSING -> EVIDENCE_EXTRACTED -> ANALYZING -> RISK_ASSESSED -> REVIEW_REQUIRED / NORMAL_PROCESSING`.

### Phase 12 & 13: Human-in-the-Loop Investigation Workflow & UI Dashboard
- React + Vite + Tailwind investigator portal:
  - Overview KPI metrics cards (total, flagged, avg score, review queue).
  - Investigation Queue table with risk badges and filter controls.
  - Claim Detail Investigation Workspace:
    - Side-by-side evidence discrepancy viewer.
    - Interactive visual damage inspector.
    - Fraud signals breakdown with evidence anchors.
    - AI audit explanation & recommended next steps.
    - Decision console: Approve, Reject, Escalate, Override Risk Score with mandatory investigator rationale.
    - Immutable audit trail timeline.
  - Claim Intake / Upload Wizard: submit new claims and drop files.

### Phase 14: Claims Management Integration Layer
- RESTful integration adapter:
  - `POST /claims/{id}/analyze`
  - `GET /claims/{id}/risk`
  - `GET /claims/{id}/investigation`
  - `POST /claims/{id}/final-decision`
  - Mock external claims management synchronization simulating Guidewire / Duck Creek / internal Core Claims systems.

### Phase 15: Security, Authentication & Prompt Injection Defense
- Document text sanitization to protect LLMs against indirect prompt injection embedded in receipts or police reports.
- File upload restrictions: MIME verification, file extension whitelisting, 25MB max size limit.
- Role-Based Access Control (RBAC) ready schema (Investigator, Supervisor, Auditor).
- Sensitive PII masking in logs.

### Phase 16: Automated Test Suites
- Unit tests: Rules engine, scoring algorithm, schema validators, anomaly detectors.
- Integration tests: End-to-end API workflows, file upload, database transactions.
- E2E Evaluation Scenarios:
  - Scenario A: Normal Claim (Low Risk, clean match)
  - Scenario B: Suspicious Claim (High Risk, cost anomaly + repeat history)
  - Scenario C: Document Inconsistency (Accident date discrepancy)
  - Scenario D: Repair Estimate / Image Mismatch (Ghost repairs)
  - Scenario E: Duplicate Invoice (Recycled invoice from prior claim)
  - Scenario F: Historical Frequency Anomaly (Velocity spike)

### Phase 17: Observability & Health Monitoring
- Health endpoints: `/api/v1/health` with system metrics, DB latency, agent statuses.
- Structured JSON logging with correlation IDs (`claim_id`).

### Phase 18 & 19: Azure Cloud Architecture & End-to-End Verification
- Complete Azure deployment blueprint (`docs/AZURE_ARCHITECTURE.md`).
- Synthetic data seeder script (`scripts/seed_demo_data.py`).
- Full system verification and walkthrough.
