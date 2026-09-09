# FraudGuard AI — Enterprise AI Fraud Detection & Investigation Platform

> **An autonomous, explainable, multimodal insurance fraud investigation platform.**  
> Combines deterministic business rules, computer vision damage inspection, historical statistical anomaly modeling, and cross-evidence reconciliation to produce transparent fraud risk scores (0–100) while strictly preserving human investigator authority.

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38bdf8.svg)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-20%2F20%20Passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

---

## 1. Problem Statement & Core Philosophy

Insurance claims fraud accounts for over **\$300 billion in annual losses** globally across property, casualty, and auto insurance. Conventional automated systems typically rely either on rigid keyword blacklists or opaque "black-box" LLM prompts that fail regulatory compliance and cannot be challenged in court.

### The Fundamental Rule:
> **The system NEVER automatically convicts or denies a claim based solely on an AI prediction.**  
> AI models generate explainable risk signals, calculate transparent multi-agent composite scores, and route high-risk files to the **Special Investigation Unit (SIU)**. Only a licensed human investigator or adjuster makes the final binding decision.

---

## 2. System Architecture

```
                  +-------------------------------------------------------+
                  |                 CLAIM INTAKE LAYER                    |
                  |     (Web Portal / REST API: PDF, JPG, JSON, Forms)    |
                  +---------------------------+---------------------------+
                                              |
                                              v
                  +-------------------------------------------------------+
                  |               EVIDENCE STORAGE REPOSITORY             |
                  |        (SHA-256 Checksums, MIME Sniffing, WORM)       |
                  +---------------------------+---------------------------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
                     v                        v                        v
         +-----------------------+ +--------------------+ +-----------------------+
         |    DOCUMENT AGENT     | |    VISION AGENT    | | HISTORICAL PATTERN    |
         | - Schema Validation   | | - Damage Detect    | | - Frequency Spikes    |
         | - Invoices/Estimates  | | - Severity Grade   | | - Repeat Bad Shops    |
         | - Police Reports      | | - Angle Consistency| | - Repair Benchmarks   |
         +-----------+-----------+ +----------+---------+ +-----------+-----------+
                     |                        |                       |
                     +------------------------+-----------------------+
                                              |
                                              v
                  +-------------------------------------------------------+
                  |               DETERMINISTIC RULES ENGINE              |
                  |   (Duplicate Invoices, Date Violations, Parts Math)   |
                  +---------------------------+---------------------------+
                                              |
                                              v
                  +-------------------------------------------------------+
                  |                   VERIFICATION AGENT                  |
                  |  (Cross-Checks Claim vs. Police, Photo vs. Estimate)  |
                  +---------------------------+---------------------------+
                                              |
                                              v
                  +-------------------------------------------------------+
                  |                   FRAUD RISK ENGINE                   |
                  |     (Composite 0-100 Score, Configurable Bands)       |
                  +---------------------------+---------------------------+
                                              |
                             +----------------+----------------+
                             |                                 |
                 Risk <= 60 (LOW/MEDIUM)             Risk > 60 (HIGH/CRITICAL)
                             |                                 |
                             v                                 v
                  [ Standard Processing ]             [ Auto-Spawn SIU Case ]
                                                               |
                                                               v
                                                    [ Human Investigator UI ]
                                                    (Override, Notes, Decide)
                                                               |
                                                               v
                                                    [ Claims Management API ]
```

---

## 3. Key Modules & Independent AI Agents

1. **Document Processing Agent (`app/agents/document_agent.py`)**:
   - Parses Claim Forms, Repair Estimates, Invoices, and Police Reports.
   - Converts unstructured text into strictly validated Pydantic models.
   - Features active protection against indirect prompt injection embedded in receipts.

2. **Vision / Image Analysis Agent (`app/agents/vision_agent.py`)**:
   - Inspects crash and damage photography.
   - Identifies damaged panels (bumper, fender, hood, quarter panel, windshield).
   - Flags "ghost repairs" where estimates bill for components untouched in crash photos.

3. **Historical Pattern Agent (`app/agents/historical_agent.py`)**:
   - Evaluates policyholder claim velocity against regional averages (spikes in rolling 24mo).
   - Checks repair shops against SIU collusion watchlists.
   - Identifies recycled invoice numbers previously settled in historical claims.

4. **Deterministic Rules Engine (`app/agents/rules_engine.py`)**:
   - Applies strict logic constraints without statistical variance:
     - `R01`: Claim amount > 85% vehicle fair market value without total loss.
     - `R02`: Suspicious round number totals ($5,000.00 or $10,000.00).
     - `R03`: Duplicate line items within repair estimates.
     - `R04`: Excessive labor-to-parts ratio (> 2.0x).
     - `R05`: Direct date contradiction between claim and police report.

5. **Evidence Verification Agent (`app/agents/verification_agent.py`)**:
   - Cross-reconciles evidence sources: Claim vs. Police Report, Photo vs. Estimate, Invoice vs. Estimate, and Vehicle VIN consistency.

6. **Fraud Risk Engine (`app/agents/risk_engine.py`)**:
   - Composite scoring normalized to 0–100:
     - `0–30`: LOW (Fast-track automated payment)
     - `31–60`: MEDIUM (Standard adjuster review)
     - `61–80`: HIGH (Mandatory SIU referral)
     - `81–100`: CRITICAL (Immediate freeze & forensic audit)
   - Generates natural-language explainability citing specific evidence tokens (`DOC-001`, `IMG-002`).

7. **Human-in-the-Loop & Investigator Dashboard**:
   - Full React + Vite + Tailwind interface.
   - Complete dossier viewer, cross-evidence conflict matrix, and immutable audit trail.
   - Human decision console supporting overrides with mandatory rationale.

8. **Claims Management API (`app/api/v1/external_claims.py`)**:
   - RESTful adapters for external core claims platforms (Guidewire ClaimCenter / Duck Creek).

---

## 4. Technology Stack

- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0 (async), SQLite / Azure SQL, Uvicorn.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios.
- **Testing**: Pytest, Pytest-Asyncio, HTTPX.
- **Cloud Architecture**: Azure Container Apps, Azure Static Web Apps, Azure Blob Storage, Azure AI Document Intelligence, Azure OpenAI, Azure Key Vault.

---

## 5. Folder Structure

```
ai-fraud-detection-agent/
+-- backend/
¦   +-- app/
¦   ¦   +-- agents/            # Document, Vision, Historical, Rules, Verification, Risk
¦   ¦   +-- api/v1/            # Claims, Investigation, External Claims, Health
¦   ¦   +-- core/              # Configuration & settings
¦   ¦   +-- db/                # Models & session management
¦   ¦   +-- schemas/           # Pydantic v2 schemas
¦   ¦   +-- services/          # Audit logging
¦   ¦   +-- main.py            # FastAPI entrypoint & SPA hosting
¦   +-- scripts/
¦   ¦   +-- seed_demo_data.py  # Seeder for historical benchmarks & Scenarios A-F
¦   +-- tests/                 # Unit, integration, and E2E test suite
¦   +-- uploads/               # Evidence file storage
¦   +-- pyproject.toml         # Python dependencies
+-- frontend/
¦   +-- src/
¦   ¦   +-- components/        # Navbar, Metrics, Queue, Detail View, Intake Modal
¦   ¦   +-- services/          # Axios API client
¦   ¦   +-- types.ts           # TypeScript interfaces
¦   ¦   +-- App.tsx            # Main application layout
¦   ¦   +-- main.tsx           # React entrypoint
¦   +-- package.json
¦   +-- tailwind.config.js
¦   +-- vite.config.ts
+-- docs/
¦   +-- CURRENT_STATE.md
¦   +-- IMPLEMENTATION_PLAN.md
¦   +-- AZURE_ARCHITECTURE.md
¦   +-- SECURITY.md
+-- README.md
```

---

## 6. Local Setup & Quick Start

### Prerequisites
- Python 3.11+ (or `uv` package manager)
- Node.js v18+ with `npm`

### Step 1: Backend Setup
```powershell
cd ai-fraud-detection-agent/backend

# Create virtual environment and install dependencies
uv venv
uv pip install -e .

# Seed benchmark database and 6 test scenarios
uv run python -m scripts.seed_demo_data

# Start FastAPI backend server
uv run uvicorn app.main:app --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### Step 2: Frontend Setup
```powershell
cd ai-fraud-detection-agent/frontend

# Install dependencies
npm.cmd install

# Build production assets
npm.cmd run build

# Start Vite dev server (or open http://localhost:8000 directly!)
npm.cmd run dev
```
Open `http://localhost:5173` (Vite dev) or `http://localhost:8000` (FastAPI hosted SPA).

---

## 7. Running Automated Tests

Run the complete 20-test test suite:
```powershell
cd ai-fraud-detection-agent/backend
uv run pytest -v
```

### Test Coverage Breakdown:
| Test Module | Focus Area | Result |
|:---|:---|:---|
| `test_rules_engine.py` | Excessive claim ratio, round numbers, duplicate estimate items, date contradictions | PASS |
| `test_risk_engine.py` | Clean claim baseline, composite scoring, cap at 100, explainability narrative | PASS |
| `test_document_agent.py` | Pydantic schema validation, indirect prompt injection detection & redaction | PASS |
| `test_verification_agent.py` | Date conflict claim vs. police, VIN mismatch claim vs. estimate | PASS |
| `test_claims_api.py` | Claim creation, multi-part evidence upload, SHA-256 calculation, audit logging | PASS |
| `test_investigation_api.py` | Investigator notes, human score override, final determination submission | PASS |
| `test_e2e_scenarios.py` | Full E2E validation of Scenarios A through F | PASS |

---

## 8. End-to-End Scenarios

The test seeder (`scripts/seed_demo_data.py`) provisions 6 target test cases:

- **Scenario A (`CLM-SCENARIO-A`) — Legitimate Claim (LOW Risk, 5/100)**: Clean match, minor bumper scuff, matching invoice/estimate, fast-tracked.
- **Scenario B (`CLM-SCENARIO-B`) — Suspicious Claim (CRITICAL Risk, 85/100)**: Excessive repair claim (98.6% of vehicle value), excessive labor ratio, billed by watchlisted shop ("QuickCash Collision").
- **Scenario C (`CLM-SCENARIO-C`) — Document Inconsistency (HIGH Risk, 70/100)**: Claim form dates accident on Aug 12; official Police Report records event on Aug 28 (16 days later!).
- **Scenario D (`CLM-SCENARIO-D`) — Estimate / Photo Mismatch (HIGH Risk, 70/100)**: Photos show minor cosmetic rear door dent ($400-$900); repair estimate charges \$8,750 for front bumper, hood, and radiator rebuild.
- **Scenario E (`CLM-SCENARIO-E`) — Recycled Duplicate Invoice (HIGH Risk, 70/100)**: Submitted invoice (`INV-RECYCLED-9901`) was already paid 8 months earlier under historical claim `HIST-003`.
- **Scenario F (`CLM-SCENARIO-F`) — Historical Velocity Spike (HIGH Risk, 65/100)**: Claimant filed 4 collision claims in rolling 24 months, significantly exceeding regional baselines.

---

## 9. Security & Azure Readiness

- **Zero Hardcoded Credentials**: Environment variables managed via Pydantic Settings.
- **Prompt Injection Defense**: Untrusted documents sanitized with regex defenses and isolated from system prompt contexts.
- **SHA-256 Immutability**: Every uploaded evidence file is cryptographically fingerprinted.
- **Azure Enterprise Ready**: Documented blueprint for Azure Container Apps, Azure Blob Storage (WORM), Azure AI Document Intelligence, Azure OpenAI, and Azure SQL in `docs/AZURE_ARCHITECTURE.md`.
- **Security Blueprint**: Detailed in `docs/SECURITY.md`.
