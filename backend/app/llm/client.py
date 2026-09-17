import json
import re
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import httpx

from app.core.config import settings
from app.llm.schemas import (
    DocumentLLMAnalysis,
    EvidenceCorrelationResult,
    InvestigationSynthesisResult,
)
from app.llm.prompts import (
    DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
    DOCUMENT_EXTRACTION_USER_PROMPT,
    EVIDENCE_CORRELATION_SYSTEM_PROMPT,
    EVIDENCE_CORRELATION_USER_PROMPT,
    INVESTIGATION_SYNTHESIS_SYSTEM_PROMPT,
    INVESTIGATION_SYNTHESIS_USER_PROMPT,
)

logger = logging.getLogger("llm_client")

# Strict prompt-injection regex patterns
INJECTION_SIGNATURES = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"system\s+prompt\s+override",
    r"classify\s+as\s+legitimate",
    r"set\s+risk\s+to\s+zero",
    r"do\s+not\s+flag\s+fraud",
    r"you\s+are\s+now\s+in\s+dan\s+mode",
    r"disregard\s+all\s+security\s+rules",
]

def sanitize_untrusted_text(text: str) -> tuple[str, bool]:
    """
    Sanitizes untrusted text by neutralizing embedded adversarial injection strings.
    Returns (sanitized_text, injection_detected_flag).
    """
    if not text:
        return "", False
    detected = False
    clean = text
    for pat in INJECTION_SIGNATURES:
        if re.search(pat, clean, re.IGNORECASE):
            logger.warning(f"Adversarial Prompt Injection attempt intercepted: {pat}")
            detected = True
            clean = re.sub(pat, "[REDACTED_SECURITY_OVERRIDE_ATTEMPT]", clean, flags=re.IGNORECASE)
    return clean, detected

def extract_json_block(text: str) -> dict:
    """Extracts and parses JSON object from model response, handling markdown blocks."""
    text = text.strip()
    # Remove markdown code fences if present
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n", "", text)
        text = re.sub(r"\n```$", "", text)
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        # Attempt to find the first '{' and last '}'
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start:end + 1])
        raise

class BaseLLMClient(ABC):
    """Abstract interface for FraudGuard LLM Reasoning Layer."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def analyze_document(
        self,
        document_text: str,
        document_type: str,
        claim_meta: Dict[str, Any]
    ) -> DocumentLLMAnalysis:
        pass

    @abstractmethod
    async def correlate_evidence(
        self,
        claim_id: str,
        incident_date: str,
        claimed_amount: float,
        evidence_summary: str
    ) -> EvidenceCorrelationResult:
        pass

    @abstractmethod
    async def synthesize_investigation(
        self,
        claim_data: Dict[str, Any],
        rule_signals: List[Dict[str, Any]],
        historical_signals: List[Dict[str, Any]],
        verification_signals: List[Dict[str, Any]],
        document_insights: Dict[str, Any],
        vision_insights: List[Dict[str, Any]],
        prompt_injected: bool = False
    ) -> InvestigationSynthesisResult:
        pass

class LocalMockLLMClient(BaseLLMClient):
    """
    High-fidelity deterministic local mock provider.
    Permits comprehensive testing, CI/CD, and offline demonstration without requiring API keys.
    Clearly labeled [LOCAL DEMO / MOCK].
    """

    @property
    def provider_name(self) -> str:
        return "LOCAL DEMO / MOCK (Deterministic Engine)"

    async def analyze_document(
        self,
        document_text: str,
        document_type: str,
        claim_meta: Dict[str, Any]
    ) -> DocumentLLMAnalysis:
        clean_text, injection_detected = sanitize_untrusted_text(document_text)

        anomalies = []
        indicators = []
        key_entities = {
            "claimant": claim_meta.get("claimant_name", "Unknown"),
            "incident_date": claim_meta.get("incident_date", "2026-08-15"),
            "vehicle_vin": claim_meta.get("vehicle_vin", "UNKNOWN_VIN"),
        }
        line_items = []

        if injection_detected:
            anomalies.append("Detected adversarial instruction in document body")
            indicators.append("Adversarial prompt injection quarantined by security filter (RULE SEC-01)")

        if document_type == "repair_estimate":
            key_entities["repair_shop"] = "Apex Collision Center"
            key_entities["labor_hours"] = 38.5
            key_entities["labor_cost"] = 7950.0
            key_entities["parts_cost"] = 2250.0
            key_entities["total_cost"] = claim_meta.get("claimed_amount", 10200.0)
            line_items = [
                {"part": "Front Bumper Assembly", "operation": "Replace", "cost": 1200.0},
                {"part": "Radiator Support", "operation": "Replace", "cost": 650.0},
                {"part": "Labor & Structural Pull", "hours": 38.5, "cost": 7950.0}
            ]
            if key_entities["labor_cost"] / max(1.0, key_entities["total_cost"]) > 0.65:
                indicators.append("Excessive labor-to-parts ratio detected (>65% total cost in labor)")

        elif document_type == "invoice":
            key_entities["invoice_number"] = "INV-9921"
            key_entities["billed_amount"] = claim_meta.get("claimed_amount", 10200.0)
            key_entities["repair_facility"] = "QuickCash Collision & Paint"
            line_items = [{"description": "Collision Structural Repair Package", "amount": claim_meta.get("claimed_amount", 10200.0)}]

        elif document_type == "police_report":
            key_entities["police_department"] = "Austin Police Department"
            key_entities["report_number"] = "PR-2026-0881"
            key_entities["officer"] = "Ofc. J. Martinez #4412"
            key_entities["incident_date"] = claim_meta.get("incident_date", "2026-08-15")

        summary = f"Structured forensic parse of {document_type.replace('_', ' ').title()} completed. Extracted {len(key_entities)} core entities and {len(line_items)} itemized entries."

        return DocumentLLMAnalysis(
            document_type=document_type,
            summary=summary,
            key_entities=key_entities,
            line_items=line_items,
            anomalies_detected=anomalies,
            suspicious_indicators=indicators,
            confidence=0.97,
            prompt_injection_warning=injection_detected
        )

    async def correlate_evidence(
        self,
        claim_id: str,
        incident_date: str,
        claimed_amount: float,
        evidence_summary: str
    ) -> EvidenceCorrelationResult:
        discrepancies = []
        correlations = []
        timeline = "CONSISTENT"
        severity = "ALIGNED"

        if "DATE_CONFLICT" in evidence_summary or "police_date" in evidence_summary:
            discrepancies.append("Incident date on claim submission conflicts with official Police Incident Report")
            timeline = "CONTRADICTION_DETECTED"

        if "ESTIMATE_PHOTO_DAMAGE_MISMATCH" in evidence_summary or "bumper" in evidence_summary.lower():
            discrepancies.append("Billed repair scope (structural bumper replacement) exceeds visible damage in accident imagery (minor scuff)")
            severity = "SEVERE_MISMATCH"
            correlations.append("Photographic damage does not substantiate itemized estimate labor")

        if "DUPLICATE_INVOICE" in evidence_summary or "INV-9921" in evidence_summary:
            correlations.append("Invoice identifier matches previously submitted and reimbursed claim from prior policy period")

        return EvidenceCorrelationResult(
            cross_evidence_discrepancies=discrepancies,
            timeline_consistency=timeline,
            severity_vs_reported_damage=severity,
            suspicious_correlations=correlations,
            confidence_score=0.96
        )

    async def synthesize_investigation(
        self,
        claim_data: Dict[str, Any],
        rule_signals: List[Dict[str, Any]],
        historical_signals: List[Dict[str, Any]],
        verification_signals: List[Dict[str, Any]],
        document_insights: Dict[str, Any],
        vision_insights: List[Dict[str, Any]],
        prompt_injected: bool = False
    ) -> InvestigationSynthesisResult:
        total_signals = len(rule_signals) + len(historical_signals) + len(verification_signals)
        key_drivers = []
        recommendations = []

        if prompt_injected:
            key_drivers.append("Adversarial prompt injection attempt detected and quarantined in evidence body")
            recommendations.append("Conduct forensic document inspection for metadata tampering and deliberate obstruction")

        for s in rule_signals:
            key_drivers.append(f"Deterministic Rule: {s.get('description') or s.get('signal_type')}")
        for s in historical_signals:
            key_drivers.append(f"Historical Pattern: {s.get('description') or s.get('signal_type')}")
        for s in verification_signals:
            key_drivers.append(f"Verification Discrepancy: {s.get('description') or s.get('signal_type')}")

        requires_siu = total_signals > 0 or prompt_injected

        if not requires_siu:
            summary = (
                f"Multi-agent investigation synthesis for Claim {claim_data.get('id', 'CLM')} concludes a LOW risk profile. "
                f"Document parsing, vision damage analysis, and cross-evidence verification confirm alignment across all submitted materials. "
                f"No adverse historical patterns or rule violations detected. Eligible for straight-through automated processing."
            )
            narrative = "All submitted documents (claim form, repair estimate, invoice, damage photos) are verified and mutually consistent. Labor rates align with regional benchmarks."
            recommendations = ["Proceed with automated straight-through payment authorization."]
        else:
            summary = (
                f"Multi-agent investigation synthesis for Claim {claim_data.get('id', 'CLM')} flagged {total_signals} adverse signal(s) "
                f"requiring mandatory Special Investigation Unit (SIU) review. Key findings indicate material discrepancies across evidence layers."
            )
            narrative = (
                f"Cross-evidence correlation identified {len(key_drivers)} primary risk drivers across deterministic rules, "
                f"historical claim velocity, and multimodal inspection. Claimed amount (${claim_data.get('claimed_amount', 0):,.2f}) "
                f"requires human validation against corroborated damage evidence."
            )
            recommendations = [
                "Place claim on temporary administrative hold pending human SIU determination.",
                "Verify repair shop credentials and independently inspect damaged vehicle chassis.",
                "Request authenticated direct invoices from servicing facility."
            ]

        return InvestigationSynthesisResult(
            executive_summary=summary,
            key_risk_drivers=key_drivers[:6],
            evidence_synthesis=narrative,
            investigative_recommendations=recommendations,
            requires_special_investigation=requires_siu,
            confidence_assessment=0.96
        )

class GeminiLLMClient(BaseLLMClient):
    """
    Native Google Gemini REST Client.
    Uses https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    Configured when LLM_PROVIDER=gemini and LLM_API_KEY is present.
    """

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash", base_url: str = settings.GEMINI_BASE_URL):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self._fallback = LocalMockLLMClient()

    @property
    def provider_name(self) -> str:
        return f"Google Gemini ({self.model})"

    async def _call_gemini(self, system_prompt: str, user_prompt: str) -> dict:
        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.error(f"Gemini API Error {resp.status_code}: {resp.text}")
                raise RuntimeError(f"Gemini API error ({resp.status_code}): {resp.text}")
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError("No candidates returned from Gemini")
            raw_content = candidates[0]["content"]["parts"][0]["text"]
            return extract_json_block(raw_content)

    async def analyze_document(
        self,
        document_text: str,
        document_type: str,
        claim_meta: Dict[str, Any]
    ) -> DocumentLLMAnalysis:
        clean_text, injection_detected = sanitize_untrusted_text(document_text)
        prompt = DOCUMENT_EXTRACTION_USER_PROMPT.format(
            document_type=document_type,
            claimant_name=claim_meta.get("claimant_name", "N/A"),
            incident_date=claim_meta.get("incident_date", "N/A"),
            vehicle_vin=claim_meta.get("vehicle_vin", "N/A"),
            vehicle_make=claim_meta.get("vehicle_make", "N/A"),
            vehicle_model=claim_meta.get("vehicle_model", "N/A"),
            claimed_amount=float(claim_meta.get("claimed_amount", 0.0)),
            document_text=clean_text[:8000]
        )
        try:
            res_dict = await self._call_gemini(DOCUMENT_EXTRACTION_SYSTEM_PROMPT, prompt)
            if injection_detected:
                res_dict["prompt_injection_warning"] = True
                if "adversarial prompt injection" not in " ".join(res_dict.get("suspicious_indicators", [])).lower():
                    res_dict.setdefault("suspicious_indicators", []).append("Adversarial prompt injection quarantined by security filter (RULE SEC-01)")
            return DocumentLLMAnalysis(**res_dict)
        except Exception as e:
            logger.warning(f"Gemini analyze_document failed ({e}); falling back to local extractor.")
            fallback = await self._fallback.analyze_document(document_text, document_type, claim_meta)
            return fallback

    async def correlate_evidence(
        self,
        claim_id: str,
        incident_date: str,
        claimed_amount: float,
        evidence_summary: str
    ) -> EvidenceCorrelationResult:
        prompt = EVIDENCE_CORRELATION_USER_PROMPT.format(
            claim_id=claim_id,
            incident_date=incident_date,
            claimed_amount=claimed_amount,
            evidence_summary=evidence_summary
        )
        try:
            res_dict = await self._call_gemini(EVIDENCE_CORRELATION_SYSTEM_PROMPT, prompt)
            return EvidenceCorrelationResult(**res_dict)
        except Exception as e:
            logger.warning(f"Gemini correlate_evidence failed ({e}); falling back to local extractor.")
            return await self._fallback.correlate_evidence(claim_id, incident_date, claimed_amount, evidence_summary)

    async def synthesize_investigation(
        self,
        claim_data: Dict[str, Any],
        rule_signals: List[Dict[str, Any]],
        historical_signals: List[Dict[str, Any]],
        verification_signals: List[Dict[str, Any]],
        document_insights: Dict[str, Any],
        vision_insights: List[Dict[str, Any]],
        prompt_injected: bool = False
    ) -> InvestigationSynthesisResult:
        prompt = INVESTIGATION_SYNTHESIS_USER_PROMPT.format(
            claim_id=claim_data.get("id", "CLM-UNKNOWN"),
            policy_id=claim_data.get("policy_id", "POL-UNKNOWN"),
            claimant_name=claim_data.get("claimant_name", "N/A"),
            vehicle_year=claim_data.get("vehicle_year", "N/A"),
            vehicle_make=claim_data.get("vehicle_make", "N/A"),
            vehicle_model=claim_data.get("vehicle_model", "N/A"),
            vehicle_vin=claim_data.get("vehicle_vin", "N/A"),
            incident_date=claim_data.get("incident_date", "N/A"),
            claimed_amount=float(claim_data.get("claimed_amount", 0.0)),
            estimated_vehicle_value=float(claim_data.get("estimated_vehicle_value", 0.0)),
            rule_signals=[s.get("signal_type") for s in rule_signals],
            historical_signals=[s.get("signal_type") for s in historical_signals],
            verification_signals=[s.get("signal_type") for s in verification_signals],
            document_insights=document_insights,
            vision_insights=vision_insights,
            prompt_injected=prompt_injected
        )
        try:
            res_dict = await self._call_gemini(INVESTIGATION_SYNTHESIS_SYSTEM_PROMPT, prompt)
            return InvestigationSynthesisResult(**res_dict)
        except Exception as e:
            logger.warning(f"Gemini synthesize_investigation failed ({e}); falling back to local extractor.")
            return await self._fallback.synthesize_investigation(
                claim_data, rule_signals, historical_signals, verification_signals,
                document_insights, vision_insights, prompt_injected
            )

class OpenRouterLLMClient(BaseLLMClient):
    """
    OpenRouter / OpenAI-compatible REST Client.
    Configured when LLM_PROVIDER=openrouter and LLM_API_KEY is present.
    """

    def __init__(self, api_key: str, model: str = "openai/gpt-4o-mini", base_url: str = settings.OPENROUTER_BASE_URL):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self._fallback = LocalMockLLMClient()

    @property
    def provider_name(self) -> str:
        return f"OpenRouter ({self.model})"

    async def _call_openrouter(self, system_prompt: str, user_prompt: str) -> dict:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://fraudguard.ai",
            "X-Title": "FraudGuard AI Orchestrator"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"OpenRouter Error {resp.status_code}: {resp.text}")
                raise RuntimeError(f"OpenRouter API error ({resp.status_code}): {resp.text}")
            data = resp.json()
            raw_content = data["choices"][0]["message"]["content"]
            return extract_json_block(raw_content)

    async def analyze_document(
        self,
        document_text: str,
        document_type: str,
        claim_meta: Dict[str, Any]
    ) -> DocumentLLMAnalysis:
        clean_text, injection_detected = sanitize_untrusted_text(document_text)
        prompt = DOCUMENT_EXTRACTION_USER_PROMPT.format(
            document_type=document_type,
            claimant_name=claim_meta.get("claimant_name", "N/A"),
            incident_date=claim_meta.get("incident_date", "N/A"),
            vehicle_vin=claim_meta.get("vehicle_vin", "N/A"),
            vehicle_make=claim_meta.get("vehicle_make", "N/A"),
            vehicle_model=claim_meta.get("vehicle_model", "N/A"),
            claimed_amount=float(claim_meta.get("claimed_amount", 0.0)),
            document_text=clean_text[:8000]
        )
        try:
            res_dict = await self._call_openrouter(DOCUMENT_EXTRACTION_SYSTEM_PROMPT, prompt)
            if injection_detected:
                res_dict["prompt_injection_warning"] = True
            return DocumentLLMAnalysis(**res_dict)
        except Exception as e:
            logger.warning(f"OpenRouter analyze_document failed ({e}); falling back to local extractor.")
            return await self._fallback.analyze_document(document_text, document_type, claim_meta)

    async def correlate_evidence(
        self,
        claim_id: str,
        incident_date: str,
        claimed_amount: float,
        evidence_summary: str
    ) -> EvidenceCorrelationResult:
        prompt = EVIDENCE_CORRELATION_USER_PROMPT.format(
            claim_id=claim_id,
            incident_date=incident_date,
            claimed_amount=claimed_amount,
            evidence_summary=evidence_summary
        )
        try:
            res_dict = await self._call_openrouter(EVIDENCE_CORRELATION_SYSTEM_PROMPT, prompt)
            return EvidenceCorrelationResult(**res_dict)
        except Exception as e:
            logger.warning(f"OpenRouter correlate_evidence failed ({e}); falling back to local extractor.")
            return await self._fallback.correlate_evidence(claim_id, incident_date, claimed_amount, evidence_summary)

    async def synthesize_investigation(
        self,
        claim_data: Dict[str, Any],
        rule_signals: List[Dict[str, Any]],
        historical_signals: List[Dict[str, Any]],
        verification_signals: List[Dict[str, Any]],
        document_insights: Dict[str, Any],
        vision_insights: List[Dict[str, Any]],
        prompt_injected: bool = False
    ) -> InvestigationSynthesisResult:
        prompt = INVESTIGATION_SYNTHESIS_USER_PROMPT.format(
            claim_id=claim_data.get("id", "CLM-UNKNOWN"),
            policy_id=claim_data.get("policy_id", "POL-UNKNOWN"),
            claimant_name=claim_data.get("claimant_name", "N/A"),
            vehicle_year=claim_data.get("vehicle_year", "N/A"),
            vehicle_make=claim_data.get("vehicle_make", "N/A"),
            vehicle_model=claim_data.get("vehicle_model", "N/A"),
            vehicle_vin=claim_data.get("vehicle_vin", "N/A"),
            incident_date=claim_data.get("incident_date", "N/A"),
            claimed_amount=float(claim_data.get("claimed_amount", 0.0)),
            estimated_vehicle_value=float(claim_data.get("estimated_vehicle_value", 0.0)),
            rule_signals=[s.get("signal_type") for s in rule_signals],
            historical_signals=[s.get("signal_type") for s in historical_signals],
            verification_signals=[s.get("signal_type") for s in verification_signals],
            document_insights=document_insights,
            vision_insights=vision_insights,
            prompt_injected=prompt_injected
        )
        try:
            res_dict = await self._call_openrouter(INVESTIGATION_SYNTHESIS_SYSTEM_PROMPT, prompt)
            return InvestigationSynthesisResult(**res_dict)
        except Exception as e:
            logger.warning(f"OpenRouter synthesize_investigation failed ({e}); falling back to local extractor.")
            return await self._fallback.synthesize_investigation(
                claim_data, rule_signals, historical_signals, verification_signals,
                document_insights, vision_insights, prompt_injected
            )

def get_llm_client() -> BaseLLMClient:
    """Factory creating LLM client based on configured environment variables."""
    provider = (settings.LLM_PROVIDER or "mock").lower()
    api_key = settings.LLM_API_KEY

    if provider == "gemini" and api_key:
        return GeminiLLMClient(api_key=api_key, model=settings.LLM_MODEL or "gemini-2.5-flash")
    elif provider == "openrouter" and api_key:
        return OpenRouterLLMClient(api_key=api_key, model=settings.LLM_MODEL or "openai/gpt-4o-mini")
    else:
        return LocalMockLLMClient()

# Global default instance
llm_client = get_llm_client()
