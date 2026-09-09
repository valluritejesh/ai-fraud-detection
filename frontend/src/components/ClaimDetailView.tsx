import React, { useState } from "react";
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  History,
  Car,
  Calendar,
  MapPin,
  SlidersHorizontal,
  Send,
  Camera,
  Scale,
  Cpu,
  UserCog,
  UserCheck,
  ExternalLink,
  Lock,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
  FileSpreadsheet,
  Award,
  Zap,
  Activity,
  ArrowRight,
  Database,
  Building,
  Check,
  X,
  Clock,
  Eye,
  Hash
} from "lucide-react";
import { ClaimDetail, Evidence, AuditLog } from "../types";
import { investigationApi, claimsApi } from "../services/api";
import { RiskBadge } from "./primitives/RiskBadge";

interface ClaimDetailViewProps {
  claim: ClaimDetail;
  onBack: () => void;
  onRefresh: () => void;
}

export const ClaimDetailView: React.FC<ClaimDetailViewProps> = ({
  claim,
  onBack,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "investigation" | "audit">("overview");
  const [noteText, setNoteText] = useState("");
  const [overrideScore, setOverrideScore] = useState<number>(
    claim.override_risk_score ?? claim.final_risk_score ?? claim.risk_score ?? 50
  );
  const [overrideReason, setOverrideReason] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const riskAssessment = claim.risk_assessments?.[0];
  const investigationCase = claim.investigation_case;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setActionLoading(true);
    try {
      await investigationApi.addNote(claim.id, noteText, "Sarah Johnson (SIU Lead)");
      setNoteText("");
      onRefresh();
    } catch (err) {
      alert("Failed to add note");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverrideScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert("A justification rationale is strictly required for AI risk overrides.");
      return;
    }
    setActionLoading(true);
    try {
      await investigationApi.overrideRisk(claim.id, Number(overrideScore), overrideReason, "Sarah Johnson (SIU Lead)");
      setOverrideReason("");
      onRefresh();
    } catch (err) {
      alert("Failed to override score");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalDecision = async (decision: "APPROVED" | "REJECTED" | "ESCALATED_LEGAL") => {
    const promptMsg = `Confirm final human determination '${decision}' for claim ${claim.id}. Enter binding decision rationale:`;
    const reason = window.prompt(promptMsg, decisionReason || "Multi-agent evidence thoroughly audited by SIU.");
    if (!reason) return;

    setActionLoading(true);
    try {
      await investigationApi.submitFinalDecision(claim.id, decision, reason, "Chief Claims Officer");
      onRefresh();
    } catch (err) {
      alert("Failed to record decision");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExternalSync = async () => {
    setSyncLoading(true);
    try {
      const res = await claimsApi.syncExternalClaims(claim.id);
      setSyncSuccess(`Synchronized with ${res.external_system} · Ref: ${res.claim_center_id}`);
      setTimeout(() => setSyncSuccess(null), 5000);
      onRefresh();
    } catch (err) {
      alert("Core sync simulation failed");
    } finally {
      setSyncLoading(false);
    }
  };

  const loadAuditTrail = async () => {
    setActiveTab("audit");
    setLoadingAudit(true);
    try {
      const logs = await claimsApi.getAuditTrail(claim.id);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const aiScore = claim.ai_risk_score ?? claim.risk_score ?? 0;
  const aiLevel = claim.ai_risk_level ?? claim.risk_level ?? "LOW";
  const overrideScoreVal = claim.override_risk_score;
  const overrideLevelVal = claim.override_risk_level;
  const effectiveScore = claim.final_risk_score ?? claim.risk_score ?? 0;
  const effectiveLevel = claim.final_risk_level ?? claim.risk_level ?? "LOW";

  // Check for Scenario F adversarial injection
  const hasPromptInjection = claim.fraud_signals?.some(
    (s) => s.signal_type.includes("INJECTION") || s.signal_type.includes("ADVERSARIAL")
  );

  // Shop history detection (Scenario B or from signals)
  const isScenarioB = claim.id.includes("SCENARIO-B");
  const hasShopSignal = claim.fraud_signals?.some((s) => s.signal_type.includes("SHOP") || s.description.toLowerCase().includes("shop"));
  const shopName = isScenarioB ? "QuickCash Collision" : hasShopSignal ? "Apex Auto Body" : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-cream-700/80 shadow-card-soft">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-800 hover:text-forest-950 px-3.5 py-1.5 rounded-xl hover:bg-cream-200 transition text-xs font-bold border border-cream-600/80 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </button>
          <div className="h-4 w-px bg-cream-600" />
          <div className="text-xs text-forest-700 font-mono">
            <span>Dossier / </span>
            <strong className="text-forest-950 font-sans text-sm">{claim.id}</strong>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <span className="text-[11px] font-mono text-forest-700 font-medium">Core Status:</span>
          <span className="px-3 py-1 rounded-xl text-xs font-black uppercase font-mono bg-cream-300 text-forest-950 border border-cream-600">
            {claim.status}
          </span>
          <button
            onClick={handleExternalSync}
            disabled={syncLoading}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-cream-200 text-forest-950 border border-cream-600 rounded-xl text-xs font-bold transition shadow-sm"
            title="Sync with Guidewire / Duck Creek Mock Adapter"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
            <span>{syncLoading ? "Syncing..." : "Sync Core Claims (Mock)"}</span>
          </button>
        </div>
      </div>

      {syncSuccess && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-xs font-mono text-emerald-900 flex items-center justify-between animate-in fade-in">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{syncSuccess}</span>
          </span>
          <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded font-bold font-mono">[MOCK / SIMULATION ADAPTER]</span>
        </div>
      )}

      {/* Cyber Security Alert Banner (Scenario F Prompt Injection) */}
      {hasPromptInjection && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950 via-forest-950 to-rose-950 border-2 border-rose-500 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-start space-x-4">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shrink-0 mt-0.5 shadow-md shadow-rose-900/50">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2 text-xs flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm uppercase tracking-wider text-rose-300 font-mono">
                    SECURITY THREAT DETECTED:
                  </span>
                  <span className="bg-rose-500/25 text-rose-200 border border-rose-400/50 font-mono font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                    INDIRECT PROMPT INJECTION SANITIZED
                  </span>
                </div>
                <span className="text-[11px] font-mono text-rose-300">RULE SEC-01 TRIGGERED</span>
              </div>
              <p className="text-rose-100 leading-relaxed font-medium">
                The Document Agent detected and neutralized adversarial instructions within uploaded evidence:{" "}
                <code className="bg-black/50 px-2 py-0.5 rounded text-rose-300 font-mono border border-rose-500/40">
                  [REDACTED_SECURITY_THREAT]
                </code>
                . Adversarial instructions quarantined; claim flagged for mandatory SIU investigation.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-rose-200 font-mono">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Evidence Integrity Verified</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SHA-256 Verified</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prompt Sanitized</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audit Logged</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 font-bold text-gold-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-gold-400" />
                  <span>Human Review Required</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Flag Banner (When No Prompt Injection) */}
      {claim.top_signal && !hasPromptInjection && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start space-x-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-black text-amber-900 uppercase tracking-wider mr-2 font-mono text-[11px]">
              PRIMARY ADVERSE SIGNAL:
            </span>
            <span className="text-forest-950 font-bold text-xs">{claim.top_signal}</span>
          </div>
        </div>
      )}

      {/* Executive Summary Header: Compact Information Cards */}
      <div className="bg-white/95 backdrop-blur-xl border border-cream-700/80 rounded-3xl p-6 shadow-card-soft relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent pointer-events-none" />

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-600/70 pb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-forest-700 font-mono">
                CLAIM INVESTIGATION DOSSIER
              </div>
              <div className="flex items-baseline space-x-3 mt-1">
                <h1 className="text-2xl md:text-3xl font-black text-forest-950 font-sans tracking-tight">
                  {claim.id}
                </h1>
                <RiskBadge level={effectiveLevel} score={effectiveScore} size="md" />
                <span className="text-xl font-black font-mono text-forest-900">
                  {effectiveScore.toFixed(0)} <span className="text-xs text-forest-600 font-normal">/ 100</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-forest-900 text-gold-300 border border-gold-400/40">
                AUDIT-GRADE DOSSIER
              </span>
            </div>
          </div>

          {/* 7 Compact Information Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-cream-100/70 border border-cream-600/70">
              <div className="text-[10px] font-bold uppercase text-forest-700 font-mono">Claimant</div>
              <div className="font-bold text-xs text-forest-950 truncate mt-0.5" title={claim.claimant_name}>
                {claim.claimant_name}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cream-100/70 border border-cream-600/70">
              <div className="text-[10px] font-bold uppercase text-forest-700 font-mono">Policy ID</div>
              <div className="font-bold text-xs text-forest-950 font-mono truncate mt-0.5" title={claim.policy_id}>
                {claim.policy_id}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cream-100/70 border border-cream-600/70">
              <div className="text-[10px] font-bold uppercase text-forest-700 font-mono">Vehicle VIN</div>
              <div className="font-bold text-xs text-forest-950 font-mono truncate mt-0.5" title={claim.vehicle_vin}>
                {claim.vehicle_vin}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cream-100/70 border border-cream-600/70">
              <div className="text-[10px] font-bold uppercase text-forest-700 font-mono">Incident Date</div>
              <div className="font-bold text-xs text-forest-950 font-mono mt-0.5">
                {claim.incident_date}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cream-100/70 border border-cream-600/70">
              <div className="text-[10px] font-bold uppercase text-forest-700 font-mono">Claim Amount</div>
              <div className="font-black text-xs text-emerald-900 font-mono mt-0.5">
                ${claim.claimed_amount.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cream-100/70 border border-cream-600/70">
              <div className="text-[10px] font-bold uppercase text-forest-700 font-mono">Investigator</div>
              <div className="font-bold text-xs text-forest-950 truncate mt-0.5" title={claim.assigned_investigator || "Sarah Johnson"}>
                {claim.assigned_investigator || "Sarah Johnson"}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cream-100/70 border border-cream-600/70">
              <div className="text-[10px] font-bold uppercase text-forest-700 font-mono">Workflow Status</div>
              <div className="font-bold text-xs text-forest-950 truncate mt-0.5">
                {claim.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 10 & 11: DOSSIER RISK PANEL & AI VS HUMAN VISUAL FLOW */}
      <div className="bg-gradient-to-br from-forest-950 via-emerald-950 to-forest-950 text-white rounded-3xl p-6 border border-emerald-700/60 shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent pointer-events-none" />

        {/* Header Statement: AI RECOMMENDS. HUMAN DECIDES. */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-gold-300 font-mono">
                RISK GOVERNANCE & SOVEREIGNTY STANDARD
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-white tracking-tight mt-0.5">
              AI RECOMMENDS. HUMAN DECIDES.
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-200/80 font-medium">3-Tier Deterministic Risk Separation</span>
            <div className="text-[10px] font-mono text-gold-300">Model Baseline Preserved in Audit Trail</div>
          </div>
        </div>

        {/* 3 Large Risk Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: AI Baseline (Teal) */}
          <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/40 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-teal-300">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-teal-400" />
                <span>AI BASELINE</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-teal-900/60 border border-teal-500/40 text-teal-200">
                {aiLevel}
              </span>
            </div>
            <div className="text-3xl font-black font-mono text-teal-200">
              {aiScore.toFixed(0)} <span className="text-xs text-teal-400 font-normal">/ 100</span>
            </div>
            <p className="text-[11px] text-teal-200/80 leading-snug">
              Synthesized by 6 multi-agent models. Immutable baseline recorded upon claim intake.
            </p>
          </div>

          {/* Card 2: Human Override (Gold) */}
          <div className="p-4 rounded-2xl bg-gold-950/40 border border-gold-400/50 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-gold-300">
              <span className="flex items-center space-x-1.5">
                <UserCog className="w-3.5 h-3.5 text-gold-400" />
                <span>HUMAN OVERRIDE</span>
              </span>
              {overrideScoreVal !== null && overrideScoreVal !== undefined ? (
                <span className="px-2 py-0.5 rounded bg-gold-500/20 border border-gold-400 text-gold-300">
                  {overrideLevelVal || "ADJUSTED"}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-white/10 text-cream-300 text-[10px]">
                  ACTIVE BASELINE
                </span>
              )}
            </div>
            <div className="text-3xl font-black font-mono text-gold-300">
              {overrideScoreVal !== null && overrideScoreVal !== undefined ? (
                <>
                  {overrideScoreVal.toFixed(0)} <span className="text-xs text-gold-400 font-normal">/ 100</span>
                </>
              ) : (
                <span className="text-base text-gold-200/60 font-sans font-medium">No override (Using AI)</span>
              )}
            </div>
            <p className="text-[11px] text-gold-200/80 leading-snug truncate" title={investigationCase?.override_reason || "Investigator has not modified baseline."}>
              {investigationCase?.override_reason || "Investigator has not modified automated baseline."}
            </p>
          </div>

          {/* Card 3: Effective Final Score (Semantic / Authoritative) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-forest-900 border border-emerald-400/60 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-200">
              <span className="flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-gold-300" />
                <span>EFFECTIVE FINAL SCORE</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-white/20 border border-white/30 text-white uppercase font-mono font-black">
                {effectiveLevel}
              </span>
            </div>
            <div className="text-3xl font-black font-mono text-white">
              {effectiveScore.toFixed(0)} <span className="text-xs text-emerald-300 font-normal">/ 100</span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-snug">
              Authoritative risk score dispatched to Core Claims (Guidewire / Duck Creek simulation).
            </p>
          </div>
        </div>

        {/* AI vs Human Visual Flow Pipeline */}
        <div className="pt-2 border-t border-emerald-800/80">
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-2 font-bold">
            FRAUDGUARD RISK TRIAGE PIPELINE
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50">
              <div className="text-[10px] font-mono text-emerald-300">STAGE 1</div>
              <div className="font-bold text-white mt-0.5">Multi-Agent AI</div>
              <div className="text-[10px] text-emerald-400 font-mono">6 Agents</div>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-900/40 border border-teal-600/50">
              <div className="text-[10px] font-mono text-teal-300">STAGE 2</div>
              <div className="font-bold text-teal-200 mt-0.5">AI Risk Score</div>
              <div className="text-[10px] font-mono font-black text-teal-300">{aiScore.toFixed(0)} / 100</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50">
              <div className="text-[10px] font-mono text-emerald-300">STAGE 3</div>
              <div className="font-bold text-white mt-0.5">SIU Review</div>
              <div className="text-[10px] text-emerald-400 font-mono">Sarah Johnson</div>
            </div>
            <div className="p-2.5 rounded-xl bg-gold-950/40 border border-gold-500/50">
              <div className="text-[10px] font-mono text-gold-300">STAGE 4</div>
              <div className="font-bold text-gold-200 mt-0.5">Human Override</div>
              <div className="text-[10px] font-mono font-black text-gold-300">
                {overrideScoreVal !== null && overrideScoreVal !== undefined ? `${overrideScoreVal.toFixed(0)} / 100` : "None"}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-800/60 border border-emerald-500/60">
              <div className="text-[10px] font-mono text-emerald-200">STAGE 5</div>
              <div className="font-bold text-white mt-0.5">Effective Score</div>
              <div className="text-[10px] font-mono font-black text-gold-300">{effectiveScore.toFixed(0)} / 100</div>
            </div>
            <div className="p-2.5 rounded-xl bg-forest-900/80 border border-gold-400/50">
              <div className="text-[10px] font-mono text-gold-300">STAGE 6</div>
              <div className="font-bold text-gold-300 mt-0.5">Human Decision</div>
              <div className="text-[10px] text-emerald-300 font-mono">{investigationCase?.final_decision || "Pending SIU"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-cream-700/80 space-x-2 sm:space-x-4 overflow-x-auto">
        {[
          { key: "overview", label: "AI Findings & Signals", icon: ShieldAlert, badge: claim.fraud_signals?.length },
          { key: "evidence", label: "Multimodal Evidence", icon: FileText, badge: claim.evidence_items?.length },
          { key: "investigation", label: "Human Investigation & Decision", icon: Scale },
          { key: "audit", label: "Immutable Audit Trail", icon: History, onClick: loadAuditTrail },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={tab.onClick || (() => setActiveTab(tab.key as any))}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-xs transition whitespace-nowrap ${
                isActive
                  ? "border-emerald-800 text-forest-950 font-black"
                  : "border-transparent text-forest-700 hover:text-forest-950"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                    isActive ? "bg-forest-950 text-gold-300" : "bg-cream-400 text-forest-800"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: AI Findings & Deterministic Rules */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* SECTION 12: AGENT FINDINGS (6 Intelligent Cards/Nodes) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-700" />
                <span>Multi-Agent Findings & Consensus Telemetry (6/6 Active)</span>
              </h3>
              <span className="text-[11px] font-mono text-forest-700">Real-Time Worker State</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Document Agent */}
              <div className="p-4 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-forest-950 font-mono">DOCUMENT AGENT</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                    ✓ Completed
                  </span>
                </div>
                <p className="text-xs text-forest-800 leading-snug">
                  {claim.evidence_items?.length ? `${claim.evidence_items.length} evidence artifacts ingested & OCR verified.` : "Extraction complete. Document schema parsed."}
                </p>
                <div className="text-[10px] font-mono text-forest-600 pt-1 border-t border-cream-600/50">
                  Mode: [LOCAL DEMO / MOCK]
                </div>
              </div>

              {/* Vision Agent */}
              <div className="p-4 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-forest-950 font-mono">VISION AGENT</span>
                  {claim.fraud_signals?.some((s) => s.signal_type.includes("MISMATCH") || s.signal_type.includes("PHOTO")) ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-950 border border-rose-300 font-mono">
                      ⚠ Damage Mismatch
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                      ✓ Damage Consistent
                    </span>
                  )}
                </div>
                <p className="text-xs text-forest-800 leading-snug">
                  {claim.fraud_signals?.some((s) => s.signal_type.includes("MISMATCH"))
                    ? "Photo evidence shows minor paint scuff vs billed structural replacement."
                    : "Accident photographs verified against billed repair estimate lines."}
                </p>
                <div className="text-[10px] font-mono text-forest-600 pt-1 border-t border-cream-600/50">
                  Model: Multimodal Vision [LOCAL HEURISTIC]
                </div>
              </div>

              {/* Pattern Agent */}
              <div className="p-4 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-forest-950 font-mono">PATTERN AGENT</span>
                  {hasShopSignal || isScenarioB ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-950 border border-orange-300 font-mono">
                      ⚠ Shop Pattern Flag
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                      ✓ No Adverse History
                    </span>
                  )}
                </div>
                <p className="text-xs text-forest-800 leading-snug">
                  {shopName ? `Repair vendor ${shopName} exhibits recurrent billing inflation patterns.` : "Cross-claim vendor graph checked. No recurring fraudulent syndicates detected."}
                </p>
                <div className="text-[10px] font-mono text-forest-600 pt-1 border-t border-cream-600/50">
                  Target: Entity & Network Graph
                </div>
              </div>

              {/* Rules Engine */}
              <div className="p-4 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-forest-950 font-mono">RULES ENGINE</span>
                  {claim.fraud_signals?.length ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-950 border border-rose-300 font-mono">
                      ⚠ {claim.fraud_signals.length} Rules Triggered
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                      ✓ Rules R01–R05 Passed
                    </span>
                  )}
                </div>
                <p className="text-xs text-forest-800 leading-snug">
                  Evaluated rules: R01 (Claim-to-Value), R02 (Labor Ratio), R03 (Shop Risk), R04 (Duplicate Invoice), R05 (Photo Mismatch).
                </p>
                <div className="text-[10px] font-mono text-forest-600 pt-1 border-t border-cream-600/50">
                  Deterministic Logic: 100% Audit-Grade
                </div>
              </div>

              {/* Verification Agent */}
              <div className="p-4 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-forest-950 font-mono">VERIFICATION AGENT</span>
                  {claim.fraud_signals?.some((s) => s.signal_type.includes("DUPLICATE") || s.signal_type.includes("CONFLICT")) ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-950 border border-rose-300 font-mono">
                      ⚠ Conflict Flagged
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                      ✓ Cross-Check Pass
                    </span>
                  )}
                </div>
                <p className="text-xs text-forest-800 leading-snug">
                  Cross-checked dates, VINs, invoice amounts, line-item totals, and damage locations across all submitted evidence files.
                </p>
                <div className="text-[10px] font-mono text-forest-600 pt-1 border-t border-cream-600/50">
                  Verification Type: Multi-Document Matrix
                </div>
              </div>

              {/* Risk Engine */}
              <div className="p-4 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-forest-950 font-mono">RISK ENGINE</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-900 text-gold-300 font-mono">
                    Score: {aiScore.toFixed(0)} / 100
                  </span>
                </div>
                <p className="text-xs text-forest-800 leading-snug">
                  Weighted Bayesian consensus of deterministic rules, model confidence, and historical risk exposure.
                </p>
                <div className="text-[10px] font-mono text-forest-600 pt-1 border-t border-cream-600/50">
                  Recommendation: {riskAssessment?.recommended_action || "SIU Review"}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 15 & 16: FRAUD SIGNALS & HISTORICAL PATTERN PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Fraud Signals */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                  {claim.fraud_signals?.length || 0} FRAUD SIGNALS DETECTED
                </h3>
                <span className="text-[10px] font-mono text-forest-700">Deterministic Rule Triggers</span>
              </div>

              {(!claim.fraud_signals || claim.fraud_signals.length === 0) ? (
                <div className="p-8 text-center bg-white/95 rounded-3xl border border-cream-700/80 text-forest-700 text-xs shadow-card-soft space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-forest-950">No adverse fraud signals detected</p>
                  <p className="text-xs text-forest-700">All submitted invoices, repair estimates, and accident photographs align.</p>
                </div>
              ) : (
                claim.fraud_signals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-4 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft hover:shadow-card-elevated transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RiskBadge level={sig.severity} size="sm" />
                        <span className="text-xs font-mono font-bold text-forest-700">[{sig.category}]</span>
                        <span className="text-xs font-bold text-forest-950">{sig.signal_type}</span>
                      </div>
                      <span className="text-xs font-black text-rose-700 font-mono">+{sig.score_impact} pts</span>
                    </div>
                    <p className="text-xs text-forest-900 leading-relaxed font-medium">{sig.description}</p>

                    {/* Rule Metadata Details */}
                    {sig.metadata_json && sig.metadata_json.rule_id && (
                      <div className="p-3 rounded-xl bg-cream-100 border border-cream-600/80 text-xs space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px] text-forest-900 font-bold">
                          <span>Rule Code: {sig.metadata_json.rule_id}</span>
                          <span className="text-forest-700 font-normal">Threshold: {sig.metadata_json.threshold}</span>
                        </div>
                        <div className="text-[11px] text-forest-950 font-mono">
                          <span className="text-forest-700 font-medium">Observed Value: </span>
                          <span className="font-bold text-emerald-900">{String(sig.metadata_json.observed_value)}</span>
                        </div>
                        {sig.metadata_json.explanation && (
                          <div className="text-[11px] text-forest-800 italic pt-0.5">
                            {sig.metadata_json.explanation}
                          </div>
                        )}
                      </div>
                    )}

                    {sig.evidence_refs && sig.evidence_refs.length > 0 && (
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[11px] text-forest-700 font-medium">Evidence Anchors:</span>
                        {sig.evidence_refs.map((ref) => (
                          <span
                            key={ref}
                            className="text-[10px] bg-forest-900 text-gold-300 px-2 py-0.5 rounded border border-gold-400/30 font-mono font-semibold"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Right Col: Historical Pattern & Financial Profile */}
            <div className="space-y-4">
              {/* SECTION 16: HISTORICAL PATTERN PANEL */}
              {shopName && (
                <div className="p-5 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-forest-800" />
                      <span>HISTORICAL PATTERN</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-950 border border-rose-300">
                      HIGH RISK SHOP
                    </span>
                  </div>
                  <div className="text-sm font-black text-forest-950 font-sans">
                    {shopName}
                  </div>
                  <div className="space-y-2 text-xs border-t border-cream-600/60 pt-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-forest-700">Previous Related Claims:</span>
                      <span className="font-bold text-forest-950">7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest-700">Prior Denials:</span>
                      <span className="font-bold text-rose-700">4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest-700">Duplicate Invoice Matches:</span>
                      <span className="font-bold text-rose-700">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest-700">Vendor Risk Rating:</span>
                      <span className="font-black text-rose-700">HIGH (Recurrent SIU Flag)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle & Financial Profile */}
              <div className="p-5 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                  Vehicle & Financial Exposure
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-cream-600/50">
                    <span className="text-forest-700">Vehicle:</span>
                    <span className="text-forest-950 font-bold">
                      {claim.vehicle_year} {claim.vehicle_make} {claim.vehicle_model}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-cream-600/50">
                    <span className="text-forest-700">Fair Market Value:</span>
                    <span className="text-forest-950 font-bold font-mono">
                      ${claim.estimated_vehicle_value?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-cream-600/50">
                    <span className="text-forest-700">Claim / Value Ratio:</span>
                    <span
                      className={`font-bold font-mono ${
                        claim.claimed_amount / (claim.estimated_vehicle_value || 1) > 0.8
                          ? "text-rose-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {((claim.claimed_amount / (claim.estimated_vehicle_value || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-cream-600/50">
                    <span className="text-forest-700">Incident Location:</span>
                    <span className="text-forest-950 font-medium truncate max-w-[170px]" title={claim.incident_location}>
                      {claim.incident_location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explainable AI Narrative */}
              {riskAssessment && (
                <div className="p-5 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans flex items-center space-x-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Explainable Triage Narrative</span>
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-cream-100/70 border border-cream-600/70 font-mono text-xs text-forest-950 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {riskAssessment.explanation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Multimodal Evidence & Forensic Inspection */}
      {activeTab === "evidence" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-forest-700 font-mono">
                SECTION 2: MULTIMODAL EVIDENCE INSPECTOR
              </div>
              <p className="text-xs text-forest-700 mt-0.5">
                Cryptographically hashed and OCR-parsed claim documentation
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cream-300 text-forest-900 border border-cream-600">
              {claim.evidence_items?.length || 0} Artifacts Hashed
            </span>
          </div>

          {/* SECTION 13: EVIDENCE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {claim.evidence_items?.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvidence(ev)}
                className={`p-4 rounded-3xl border transition cursor-pointer shadow-card-soft group hover:-translate-y-0.5 ${
                  selectedEvidence?.id === ev.id
                    ? "bg-cream-100 border-forest-900 shadow-md ring-2 ring-forest-900/20"
                    : "bg-white/95 border-cream-700/80 hover:border-forest-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-forest-900/10 text-forest-900 border border-forest-700/20">
                      {ev.document_type === "damage_photo" ? (
                        <Camera className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <FileText className="w-4 h-4 text-forest-800" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-forest-950 truncate max-w-[140px]" title={ev.filename}>
                        {ev.filename}
                      </div>
                      <div className="text-[10px] font-mono text-forest-600">
                        {ev.mime_type} · {(ev.file_size_bytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-cream-300 text-forest-900 px-2 py-0.5 rounded-md font-mono font-bold">
                    {ev.document_type}
                  </span>
                </div>

                <div className="text-xs text-forest-800 space-y-1.5 pt-2 border-t border-cream-600/60 font-mono">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-800 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>SHA-256 VERIFIED</span>
                    </span>
                    <span className="text-forest-600">{ev.sha256_hash.slice(0, 10)}...</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="text-forest-700">OCR Confidence:</span>
                    <span className="font-bold text-emerald-800">
                      {(ev.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[9px]">
                    <span className="px-1.5 py-0.5 rounded bg-cream-300 text-forest-900 border border-cream-600 font-semibold">
                      {ev.provider_mode || "[LOCAL DEMO / MOCK]"}
                    </span>
                    <span className="text-emerald-800 font-bold group-hover:underline flex items-center space-x-1">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 14: FORENSIC EVIDENCE PREVIEW MODAL / INSPECTION VIEWER */}
          {selectedEvidence && (
            <div className="p-6 rounded-3xl bg-white/95 border border-cream-700/80 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-cream-600/70 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-forest-900 text-gold-300">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-forest-950 flex items-center space-x-2 font-sans">
                      <span>Forensic Evidence Inspector:</span>
                      <span className="font-mono text-emerald-800">{selectedEvidence.filename}</span>
                    </h4>
                    <p className="text-xs text-forest-700 font-mono mt-0.5">
                      Artifact ID: {selectedEvidence.id} · MIME: {selectedEvidence.mime_type} · {(selectedEvidence.file_size_bytes / 1024).toFixed(1)} KB · [LOCAL DEMO / MOCK]
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="px-3 py-1.5 rounded-xl bg-cream-300 hover:bg-cream-400 text-forest-900 font-bold text-xs transition"
                >
                  Close Inspector
                </button>
              </div>

              {/* Split Viewer: Left Document Visual / Right Extraction Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                {/* Left: Document / Photo Visual Rendering */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-cream-200/50 border border-cream-600/70 space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-wider text-forest-800 font-mono flex items-center justify-between">
                    <span>Artifact Visual Preview</span>
                    <span className="px-2 py-0.5 rounded bg-white text-emerald-800 font-bold border border-cream-600">
                      Tamper-Evident
                    </span>
                  </div>

                  {selectedEvidence.document_type === "damage_photo" ? (
                    <div className="relative rounded-2xl overflow-hidden border border-cream-700 bg-forest-950 aspect-video flex items-center justify-center">
                      <div className="text-center p-4 text-emerald-200 space-y-2">
                        <Camera className="w-10 h-10 text-emerald-400 mx-auto" />
                        <div className="text-xs font-bold font-mono">SCENE PHOTOGRAPH: {selectedEvidence.filename}</div>
                        <p className="text-[10px] text-emerald-300/80 font-mono">
                          LiDAR / Pixel Discrepancy Scanned · Front Bumper Conflict
                        </p>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-gold-300">
                        Resolution: 1920x1080 · EXIF Date: {claim.incident_date}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white border border-cream-600 font-mono text-xs space-y-2 min-h-[220px]">
                      <div className="flex justify-between border-b pb-1.5 text-[11px] font-bold text-forest-900">
                        <span>DOCUMENT HEADER</span>
                        <span>CONFIDENTIAL</span>
                      </div>
                      <div className="text-[11px] text-forest-800 space-y-1">
                        <div>Claimant: <strong>{claim.claimant_name}</strong></div>
                        <div>Policy: <strong>{claim.policy_id}</strong></div>
                        <div>Incident Date: <strong>{claim.incident_date}</strong></div>
                        <div>Claimed Billed: <strong>${claim.claimed_amount.toLocaleString()}</strong></div>
                      </div>
                      <div className="pt-2 border-t text-[10px] text-forest-600">
                        OCR Status: Extracted with 98% field recognition accuracy.
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-white/80 border border-cream-600 text-xs font-mono space-y-1">
                    <div className="text-[10px] text-forest-700 font-bold">SHA-256 HASH VERIFICATION</div>
                    <div className="text-[10px] text-forest-950 break-all">{selectedEvidence.sha256_hash}</div>
                  </div>
                </div>

                {/* Right: Structured Key-Value Fields & Findings */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-wider text-forest-800 font-mono">
                    Structured Schema Extractions & Fraud Signals
                  </div>
                  <div className="p-4 bg-forest-950 rounded-2xl text-xs font-mono text-emerald-200 overflow-x-auto max-h-96 border border-emerald-900">
                    <pre>{JSON.stringify(selectedEvidence.extracted_data, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Human-in-the-Loop Investigation & Final Determination */}
      {activeTab === "investigation" && (
        <div className="space-y-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-forest-700 font-mono">
            SECTION 3: HUMAN INVESTIGATION & FINAL DETERMINATION
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SECTION 17: INVESTIGATOR NOTES (Timeline Stream) */}
            <div className="p-6 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-4">
              <div className="flex items-center justify-between border-b border-cream-600/70 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                  INVESTIGATOR NOTES & INTERVIEWS
                </h3>
                <span className="text-[10px] font-mono text-forest-700 font-bold">
                  {investigationCase?.investigator_notes?.length || 0} Entries
                </span>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {(!investigationCase?.investigator_notes || investigationCase.investigator_notes.length === 0) ? (
                  <p className="text-xs text-forest-700 italic py-4 text-center">
                    No notes recorded yet. Add interview notes or surveillance observations below.
                  </p>
                ) : (
                  investigationCase.investigator_notes.map((n, i) => (
                    <div key={i} className="relative pl-6 pb-2 border-l-2 border-emerald-800/30 last:border-l-0">
                      <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-emerald-800 ring-4 ring-white" />
                      <div className="p-3.5 bg-cream-100/70 rounded-2xl border border-cream-600/70 text-xs space-y-1">
                        <div className="flex justify-between items-center text-forest-800">
                          <span className="text-forest-950 font-bold text-xs">{n.author}</span>
                          <span className="text-[10px] text-forest-700 font-mono">
                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        <p className="text-forest-950 leading-relaxed font-medium pt-0.5">{n.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="pt-3 border-t border-cream-600/70 space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter investigation observation, vendor interview findings, or witness statement..."
                  rows={2}
                  className="w-full bg-cream-100/60 border border-cream-600/80 rounded-2xl px-3.5 py-2.5 text-xs text-forest-950 placeholder-forest-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-forest-950 hover:bg-emerald-900 text-gold-300 hover:text-white rounded-xl text-xs font-bold transition shadow-sm border border-gold-400/40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>+ Add Investigation Note</span>
                </button>
              </form>
            </div>

            {/* Decision & Override Console */}
            <div className="space-y-6">
              {/* AI Risk Override Slider */}
              <div className="p-6 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-4">
                <div className="flex items-center justify-between border-b border-cream-600/70 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                    OVERRIDE AI RISK SCORE
                  </h3>
                  <span className="text-[10px] bg-gold-400/20 text-gold-950 px-2.5 py-0.5 rounded-full border border-gold-400/40 font-bold font-mono">
                    Preserves AI Baseline ({aiScore.toFixed(0)})
                  </span>
                </div>
                <p className="text-xs text-forest-800 leading-relaxed">
                  Licensed investigators may adjust the effective score when physical inspection or subpoenaed evidence counters the automated model. The original AI baseline ({aiScore.toFixed(0)}) remains permanently preserved.
                </p>

                <form onSubmit={handleOverrideScore} className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-forest-950">
                        Adjust Effective Score (0 - 100):
                      </label>
                      <span className="text-sm font-black font-mono text-gold-900 bg-gold-400/20 px-2.5 py-0.5 rounded-md border border-gold-400">
                        {overrideScore}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={overrideScore}
                      onChange={(e) => setOverrideScore(Number(e.target.value))}
                      className="w-full h-2 bg-cream-400 rounded-lg cursor-pointer accent-forest-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-forest-950 block mb-1">
                      Mandatory Justification Rationale:
                    </label>
                    <textarea
                      required
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Document exact justification for overriding automated AI score..."
                      rows={2}
                      className="w-full bg-cream-100/60 border border-cream-600/80 rounded-2xl px-3.5 py-2.5 text-xs text-forest-950 placeholder-forest-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-forest-950 hover:bg-forest-900 text-gold-300 rounded-xl text-xs font-bold transition shadow-sm border border-gold-400/40"
                  >
                    Commit Human Override
                  </button>
                </form>
              </div>

              {/* SECTION 18: FINAL HUMAN DETERMINATION */}
              <div className="p-6 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-4">
                <div className="flex items-center justify-between border-b border-cream-600/70 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                    FINAL HUMAN DETERMINATION
                  </h3>
                  <span className="text-[10px] font-mono text-forest-700 font-bold">
                    Executive Authority
                  </span>
                </div>
                <p className="text-xs text-forest-800 leading-relaxed font-medium">
                  AI agents cannot make the binding determination. Only the human investigator / authorized claims officer can finalize the decision.
                </p>

                {investigationCase?.final_decision ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-950 font-mono text-sm">
                        FINAL DECISION: {investigationCase.final_decision}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 text-[10px] font-mono font-bold">
                        COMMITTED
                      </span>
                    </div>
                    <p className="text-forest-950 font-medium">Rationale: {investigationCase.decision_reason}</p>
                    <p className="text-forest-700 text-[10px] font-mono pt-1">
                      Decision by: <strong>{investigationCase.decided_by || "Chief Claims Officer"}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      onClick={() => handleFinalDecision("APPROVED")}
                      disabled={actionLoading}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>APPROVE</span>
                    </button>
                    <button
                      onClick={() => handleFinalDecision("REJECTED")}
                      disabled={actionLoading}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>REJECT (FRAUD DENIAL)</span>
                    </button>
                    <button
                      onClick={() => handleFinalDecision("ESCALATED_LEGAL")}
                      disabled={actionLoading}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>ESCALATE LEGAL</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 19: CLAIMS SYSTEM SYNC */}
              <div className="p-5 rounded-3xl bg-cream-100/70 border border-cream-600/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-forest-950 uppercase font-mono text-[10px]">
                    CORE CLAIMS SYSTEM
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-bold text-[9px]">
                    SYNCHRONIZED
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-forest-900">
                  GW-CC-{claim.id}
                </div>
                <div className="text-[10px] text-forest-600 font-mono">
                  [MOCK / SIMULATION ADAPTER] · Guidewire ClaimCenter / Duck Creek Compatible
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Immutable Audit Trail */}
      {activeTab === "audit" && (
        <div className="p-6 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-4">
          <div className="flex items-center justify-between border-b border-cream-600/70 pb-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-forest-700 font-mono">
                IMMUTABLE AUDIT TRAIL
              </div>
              <h3 className="text-sm font-black text-forest-950 font-sans flex items-center space-x-2 mt-0.5">
                <History className="w-4 h-4 text-forest-800" />
                <span>SOC 2 & ISO 27001 Cryptographic Event Stream</span>
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              Tamper-Proof Stream
            </span>
          </div>

          {loadingAudit ? (
            <p className="text-xs text-forest-700 py-6 text-center">Loading audit log stream...</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-cream-100/60 rounded-2xl border border-cream-600/70 flex items-start justify-between text-xs hover:bg-cream-200/60 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-3.5 h-3.5 text-forest-800 shrink-0" />
                      <span className="font-mono text-forest-950 font-bold">{log.action}</span>
                      <span className="text-cream-700">•</span>
                      <span className="text-forest-800 font-medium">{log.actor}</span>
                    </div>
                    {log.new_value && (
                      <p className="text-[11px] text-forest-700 font-mono pl-5">
                        {JSON.stringify(log.new_value)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-forest-700 font-mono shrink-0 ml-2">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
