# Azure Cloud Architecture Specification — AI Fraud Detection Agent

This document details the production-ready Microsoft Azure cloud deployment architecture for the **AI Fraud Detection Agent Platform**.

---

## 1. Architectural Blueprint & Component Diagram

```
                              +----------------------------+
                              |   Azure Front Door / CDN   |
                              |   (WAF, DDoS, SSL Offload)  |
                              +--------------+-------------+
                                             |
                      +----------------------+----------------------+
                      |                                             |
                      v                                             v
        +----------------------------+                +----------------------------+
        |   Azure Static Web Apps    |                |   Azure Container Apps     |
        |   (React Vite Frontend)    |                |   (FastAPI Backend APIs)   |
        +----------------------------+                +--------------+-------------+
                                                                     |
       +-------------------------------------------------------------+-----------------------+
       |                             |                               |                       |
       v                             v                               v                       v
+---------------+             +---------------+             +---------------+       +---------------+
| Azure Blob    |             | Azure Service |             | Azure SQL     |       | Azure Key     |
| Storage       |             | Bus           |             | Database      |       | Vault         |
| (Evidence &   |             | (Async Event  |             | (Claims,      |       | (Secrets,     |
| Raw Media)    |             | Pipeline)     |             | Evidence DB)  |       | API Keys)     |
+-------+-------+             +-------+-------+             +---------------+       +---------------+
        |                             |
        |                             v
        |                     +---------------+
        |                     | Azure         |
        |                     | Container App |
        |                     | (Worker Pool) |
        |                     +-------+-------+
        |                             |
        +----------------------+------+
                               |
        +----------------------+----------------------+
        |                                             |
        v                                             v
+----------------------------+                +----------------------------+
| Azure AI Document          |                | Azure OpenAI Service /     |
| Intelligence               |                | Azure AI Vision            |
| (Forms, Invoices, OCR)     |                | (Damage Analysis, LLM)     |
+----------------------------+                +----------------------------+
```

---

## 2. Component Roles & Cloud Services

| Service | Architectural Purpose | Production Configuration |
| :--- | :--- | :--- |
| **Azure Container Apps** | Hosts the containerized FastAPI backend and worker background consumers. Auto-scales from 1 to N replicas based on HTTP traffic and Service Bus queue depth. | Linux containers, managed serverless compute, scale-to-zero enabled for non-prod. |
| **Azure Static Web Apps** | Serves the production React/TypeScript Single Page Application (SPA). | Global CDN distribution, automated CI/CD via GitHub Actions. |
| **Azure Blob Storage** | Secure object store for uploaded evidence files (PDF claim forms, vehicle repair estimates, high-resolution crash photos). | Hot tier with immutability policies (WORM storage) for regulatory compliance. |
| **Azure Service Bus** | Message queue decoupling file upload ingestion from the asynchronous agent analysis pipeline. | Standard or Premium tier with Dead Letter Queues (DLQ) and TTL retries. |
| **Azure SQL Database** | ACID-compliant relational store for claims, structured extraction records, audit trails, and human decisions. | Hyperscale or General Purpose with Transparent Data Encryption (TDE) and Private Endpoints. |
| **Azure AI Document Intelligence** | Prebuilt models (`prebuilt-invoice`, `prebuilt-layout`, `prebuilt-contract`) for high-accuracy key-value extraction and bounding-box OCR. | Managed identity authentication, HIPAA/SOC-2 compliant. |
| **Azure AI Vision / OpenAI** | GPT-4o / Azure AI Vision for damaged component localization, severity scoring, and natural-language explainability synthesis. | Dedicated Azure OpenAI deployment behind Private Endpoints. |
| **Azure Key Vault** | Hardware Security Module (HSM) protected store for API credentials, connection strings, and certificates. | Azure RBAC integration, zero secrets in source code or container images. |
| **Azure Monitor & App Insights** | End-to-end distributed tracing, APM, telemetry, exception aggregation, and operational alerting. | Log Analytics workspace with alert rules on agent failure rates and queue backlogs. |

---

## 3. Data Flow & Processing Lifecycle

1. **Intake**: The claimant or broker uploads documents and accident photos via the React web UI. The request is routed via Azure Front Door to Azure Container Apps.
2. **Persistence**: Files are streamed directly into Azure Blob Storage with metadata and a client-side/server-side SHA-256 hash.
3. **Queueing**: A `ClaimSubmittedEvent` containing `claim_id` and evidence pointers is dispatched to Azure Service Bus.
4. **Parallel Agent Execution**:
   - Worker replicas consume the event.
   - **Document Agent** invokes Azure AI Document Intelligence.
   - **Vision Agent** invokes Azure AI Vision / GPT-4o Vision for crash photo analysis.
   - **Historical Agent** queries Azure SQL for velocity and repeat offender metrics.
5. **Deterministic Rules & Verification**: Structured outputs are reconciled against configurable deterministic business rules and cross-evidence conflict checks.
6. **Risk Engine & Scoring**: A unified score (0–100) is generated.
7. **Routing**:
   - If `score > 60` (HIGH or CRITICAL): An `InvestigationCase` is spawned and routed to the Special Investigation Unit (SIU) dashboard.
   - If `score <= 60` (LOW or MEDIUM): The claim is tagged for standard straight-through processing.
8. **Human Determination**: Licensed investigators review evidence, perform overrides if warranted, and submit final binding decisions.

---

## 4. Security & Compliance Architecture

- **Zero Trust Network**: All backend components, databases, and AI endpoints communicate within an Azure Virtual Network (VNet) using Private Endpoints.
- **Identity & Access Management**: Microsoft Entra ID (formerly Azure AD) handles investigator authentication and Role-Based Access Control (`SIU_INVESTIGATOR`, `CLAIMS_ADJUSTER`, `AUDITOR`).
- **Managed Identities**: Azure Container Apps utilize User-Assigned Managed Identities to communicate with Blob Storage, Key Vault, and Azure OpenAI without long-lived API keys.
- **Data Encryption**:
  - In Transit: TLS 1.3 enforced throughout.
  - At Rest: Customer-Managed Keys (CMK) via Key Vault for Blob Storage and Azure SQL TDE.

---

## 5. Cost Optimization & Sizing Strategy

- **Development/Testing**: Local SQLite and heuristic/mock engine adapters ensure zero cloud spend during local iterations.
- **Production Sizing**:
  - Container Apps: Consumption tier ($0 when idle, scales dynamically under load).
  - Azure AI Document Intelligence: Pay-per-page model (~$0.01 per document page).
  - Azure Service Bus: Standard tier ($10/month fixed + $0.05 per million operations).
  - Azure SQL: Serverless compute tier auto-pauses during off-peak hours.
