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
  Activity
} from "lucide-react";
import { ClaimDetail, Evidence, AuditLog } from "../types";
import { investigationApi, claimsApi } from "../services/api";
import { RiskGauge } from "./primitives/RiskGauge";
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

  const riskAssessment = claim.risk_assessments?.[0];
  const investigationCase = claim.investigation_case;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setActionLoading(true);
    try {
      await investigationApi.addNote(claim.id, noteText, "SIU Lead Investigator");
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
      alert("A justification is strictly required for AI risk overrides.");
      return;
    }
    setActionLoading(true);
    try {
      await investigationApi.overrideRisk(claim.id, Number(overrideScore), overrideReason, "SIU Supervisor");
      alert("Score overridden! Original AI baseline is preserved, and human override is now active.");
      setOverrideReason("");
      onRefresh();
    } catch (err) {
      alert("Failed to override score");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalDecision = async (decision: "APPROVED" | "REJECTED" | "ESCALATED_LEGAL") => {
    const promptMsg = `Confirm final determination '${decision}' for claim ${claim.id}. Enter decision rationale:`;
    const reason = window.prompt(promptMsg, decisionReason || "Evidence thoroughly verified by SIU.");
    if (!reason) return;

    setActionLoading(true);
    try {
      await investigationApi.submitFinalDecision(claim.id, decision, reason, "Chief Claims Adjuster");
      alert(`Final determination '${decision}' recorded.`);
      onRefresh();
    } catch (err) {
      alert("Failed to submit decision");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExternalSync = async () => {
    setSyncLoading(true);
    try {
      const res = await claimsApi.syncExternalClaims(claim.id);
      alert(
        `Synchronized with Core Claims!\nSystem: ${res.external_system}\nClaim Center Reference: ${res.claim_center_id}\nStatus: ${res.sync_status}`
      );
      onRefresh();
    } catch (err) {
      alert("Core sync failed");
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

  // Check if Scenario F injection was triggered
  const hasPromptInjection = claim.fraud_signals?.some(
    (s) => s.signal_type.includes("INJECTION") || s.signal_type.includes("ADVERSARIAL")
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-cream-700/80 shadow-card-soft">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-800 hover:text-emerald-950 px-3 py-1.5 rounded-xl hover:bg-cream-300 transition text-xs font-bold border border-cream-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </button>
          <div className="h-4 w-px bg-cream-600" />
          <div className="text-xs text-forest-700 font-mono">
            <span>Dossier / </span>
            <strong className="text-forest-950">{claim.id}</strong>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <span className="text-[11px] font-mono text-forest-700 font-medium">Core Status:</span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase font-mono bg-cream-300 text-forest-950 border border-cream-600">
            {claim.status}
          </span>
          <button
            onClick={handleExternalSync}
            disabled={syncLoading}
            className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-cream-200 text-forest-950 border border-cream-600 rounded-lg text-xs font-bold transition shadow-sm"
            title="Sync with Guidewire / Duck Creek Mock Adapter"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
            <span>{syncLoading ? "Syncing..." : "Sync Core Claims (Mock)"}</span>
          </button>
        </div>
      </div>

      {/* Cyber Security Alert Banner (Scenario F Prompt Injection) */}
      {hasPromptInjection && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-forest-950 to-rose-950 border-2 border-rose-500/80 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5 shadow-md">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1.5 text-xs flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm uppercase tracking-wider text-rose-300 font-mono">
                    SECURITY THREAT DETECTED:
                  </span>
                  <span className="bg-rose-500/20 text-rose-200 border border-rose-400/40 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                    INDIRECT PROMPT INJECTION SANITIZED
                  </span>
                </div>
                <span className="text-[10px] font-mono text-rose-300">RULE SEC-01 TRIGGERED</span>
              </div>
              <p className="text-rose-100 leading-relaxed font-medium">
                The Document Agent detected and neutralized adversarial instructions within uploaded evidence: <code className="bg-black/40 px-2 py-0.5 rounded text-rose-300 font-mono border border-rose-500/40">[REDACTED_SECURITY_THREAT]</code>. Adversarial instructions quarantined; claim flagged for mandatory SIU investigation.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-[10px] text-rose-200 font-mono">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Evidence Integrity Verified</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>SHA-256 Verified</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Prompt Sanitized</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Audit Logged</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 font-bold text-gold-300">
                  <AlertTriangle className="w-3 h-3 text-gold-400" />
                  <span>Human Review Required</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Red Flag Banner (When No Prompt Injection) */}
      {claim.top_signal && !hasPromptInjection && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start space-x-3 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-extrabold text-amber-900 uppercase tracking-wider mr-2 font-mono">
              Primary Flag:
            </span>
            <span className="text-forest-950 font-bold">{claim.top_signal}</span>
          </div>
        </div>
      )}

      {/* 3-Tier Separated Risk Score & Claim Dossier Hero Card */}
      <div className="bg-white/95 backdrop-blur-xl border border-cream-700/80 rounded-2xl p-6 shadow-card-soft relative overflow-hidden">
        {/* Top specular highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Metadata */}
          <div className="space-y-2.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-forest-950 tracking-tight font-sans">
                {claim.id}
              </h1>
              <RiskBadge level={effectiveLevel} score={effectiveScore} size="md" />
              {overrideScoreVal !== null && overrideScoreVal !== undefined && (
                <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 text-purple-700" />
                  <span>HUMAN OVERRIDE ACTIVE</span>
                </span>
              )}
            </div>

            <p className="text-xs text-forest-800 flex flex-wrap items-center gap-2 font-medium">
              <span className="font-bold text-forest-950 text-sm">{claim.claimant_name}</span>
              <span className="text-cream-600">•</span>
              <span>Policy: <strong className="font-mono text-forest-950">{claim.policy_id}</strong></span>
              <span className="text-cream-600">•</span>
              <span>Claimant ID: <strong className="font-mono text-forest-950">{claim.claimant_id}</strong></span>
              {claim.assigned_investigator && (
                <>
                  <span className="text-cream-600">•</span>
                  <span className="text-emerald-800 font-bold">Assigned: {claim.assigned_investigator}</span>
                </>
              )}
            </p>

            <div className="flex flex-wrap gap-4 text-xs text-forest-700 pt-1 font-mono">
              <span className="flex items-center space-x-1.5">
                <Car className="w-3.5 h-3.5 text-forest-800" />
                <span>{claim.vehicle_year} {claim.vehicle_make} {claim.vehicle_model}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-forest-800" />
                <span>Incident: {claim.incident_date}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-forest-800" />
                <span>{claim.incident_location}</span>
              </span>
            </div>
          </div>

          {/* 3-Tier Risk Hierarchy Visualization (AI -> Human -> Final) */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-stretch">
            {/* Card 1: AI Baseline */}
            <div className="p-3.5 rounded-xl bg-cream-200/80 border border-cream-700/80 min-w-[140px] flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between text-forest-800 text-[10px] font-mono uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <Cpu className="w-3 h-3 text-emerald-700" />
                  <span>AI Baseline</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white border border-cream-600">
                  {aiLevel}
                </span>
              </div>
              <div className="text-2xl font-black text-forest-950 my-1 font-mono">
                {aiScore.toFixed(0)}
                <span className="text-xs text-forest-700 font-normal"> / 100</span>
              </div>
              <div className="text-[9px] text-forest-700 font-mono">
                Immutable Multi-Agent
              </div>
            </div>

            {/* Down Arrow / Transition */}
            <div className="hidden sm:flex items-center text-forest-600">
              →
            </div>

            {/* Card 2: Investigator Review */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 min-w-[150px] flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between text-purple-900 text-[10px] font-mono uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <UserCog className="w-3 h-3 text-purple-700" />
                  <span>SIU Review</span>
                </span>
                {overrideLevelVal && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 border border-purple-300">
                    {overrideLevelVal}
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-purple-950 my-1 font-mono">
                {overrideScoreVal !== null && overrideScoreVal !== undefined ? (
                  <>
                    {overrideScoreVal.toFixed(0)}
                    <span className="text-xs text-purple-700 font-normal"> / 100</span>
                  </>
                ) : (
                  <span className="text-xs text-forest-700 font-medium">None (Using AI)</span>
                )}
              </div>
              <div
                className="text-[9px] text-purple-800 font-medium truncate max-w-[130px]"
                title={investigationCase?.override_reason || "No manual override"}
              >
                {investigationCase?.override_reason || "Automated Baseline Active"}
              </div>
            </div>

            {/* Down Arrow / Transition */}
            <div className="hidden sm:flex items-center text-forest-600">
              →
            </div>

            {/* Card 3: Final Effective Score */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950 to-forest-900 border border-emerald-700/60 text-white min-w-[180px] flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between text-emerald-200 text-[10px] font-mono uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <Scale className="w-3 h-3 text-gold-300" />
                  <span>Effective Score</span>
                </span>
                <span className="text-xs font-mono font-bold text-gold-300">
                  ${claim.claimed_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="text-3xl font-black font-mono text-white">
                  {effectiveScore.toFixed(0)}
                  <span className="text-xs text-emerald-300/60 font-normal"> / 100</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black border border-white/20 bg-white/10 uppercase font-mono">
                  {effectiveLevel}
                </span>
              </div>
              <div className="text-[9px] text-gold-300 font-mono flex items-center justify-between">
                <span>AI recommends.</span>
                <span className="font-bold text-white">Human decides.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-cream-700 space-x-4">
        {[
          { key: "overview", label: "AI Findings & Signals", icon: ShieldAlert, badge: claim.fraud_signals?.length },
          { key: "evidence", label: "Multimodal Evidence", icon: FileText, badge: claim.evidence_items?.length },
          { key: "investigation", label: "Human Investigation", icon: Scale },
          { key: "audit", label: "Immutable Audit Trail", icon: History, onClick: loadAuditTrail },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={tab.onClick || (() => setActiveTab(tab.key as any))}
              className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-bold text-xs transition ${
                isActive
                  ? "border-emerald-800 text-emerald-950"
                  : "border-transparent text-forest-700 hover:text-emerald-950"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                    isActive ? "bg-emerald-900 text-gold-300" : "bg-cream-400 text-forest-800"
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
          <div className="text-[10px] font-black uppercase tracking-widest text-forest-700 font-mono">
            SECTION 1: AI FINDINGS & DETERMINISTIC RULES
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Explanation & Triggered Signals */}
            <div className="lg:col-span-2 space-y-6">
              {/* Explainable AI Narrative */}
              {riskAssessment && (
                <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-cream-700/80 shadow-card-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans flex items-center space-x-2">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                      <span>Explainable Risk Assessment</span>
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                      Action: {riskAssessment.recommended_action}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-cream-200/50 border border-cream-600/70 font-mono text-xs text-forest-950 whitespace-pre-wrap leading-relaxed">
                    {riskAssessment.explanation}
                  </div>
                </div>
              )}

              {/* Signals List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-forest-900 font-sans">
                  Triggered Fraud Signals & Deterministic Rules ({claim.fraud_signals?.length || 0})
                </h3>

                {(!claim.fraud_signals || claim.fraud_signals.length === 0) ? (
                  <div className="p-8 text-center bg-white/90 rounded-2xl border border-cream-700/80 text-forest-700 text-xs shadow-card-soft">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    No adverse fraud signals triggered. All multimodal documents, estimates, and dates align.
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

                      {/* Rule Metadata */}
                      {sig.metadata_json && sig.metadata_json.rule_id && (
                        <div className="p-3 rounded-xl bg-cream-200/60 border border-cream-600 text-xs space-y-1">
                          <div className="flex items-center justify-between font-mono text-[11px] text-forest-900 font-bold">
                            <span>Rule ID: {sig.metadata_json.rule_id}</span>
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
            </div>

            {/* Right: Score Breakdown & Vehicle Financials */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-cream-700/80 shadow-card-soft space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                  Multi-Agent Score Contribution
                </h3>
                {riskAssessment?.score_breakdown && (
                  <div className="space-y-3 text-xs">
                    {Object.entries(riskAssessment.score_breakdown).map(([k, v]) => (
                      <div key={k} className="space-y-1">
                        <div className="flex justify-between text-forest-900 font-medium">
                          <span className="capitalize">{k.replace("_", " ")}</span>
                          <span className="font-bold text-forest-950 font-mono">{v} pts</span>
                        </div>
                        <div className="w-full bg-cream-400 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-forest-800 h-full rounded-full"
                            style={{ width: `${Math.min(100, (v / 60) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-cream-700/80 shadow-card-soft space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                  Vehicle & Financial Profile
                </h3>
                <div className="space-y-2 text-xs">
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
                    <span className="text-forest-700">Loss Description:</span>
                    <span
                      className="text-forest-950 max-w-[180px] truncate text-right font-medium"
                      title={claim.incident_description || "N/A"}
                    >
                      {claim.incident_description || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Multimodal Evidence */}
      {activeTab === "evidence" && (
        <div className="space-y-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-forest-700 font-mono">
            SECTION 2: MULTIMODAL EVIDENCE INSPECTOR
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {claim.evidence_items?.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvidence(ev)}
                className={`p-4 rounded-2xl border transition cursor-pointer shadow-card-soft ${
                  selectedEvidence?.id === ev.id
                    ? "bg-cream-100 border-forest-800 shadow-md ring-2 ring-forest-800/10"
                    : "bg-white/95 border-cream-700/80 hover:border-forest-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {ev.document_type === "damage_photo" ? (
                      <Camera className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <FileText className="w-4 h-4 text-forest-800" />
                    )}
                    <span className="text-xs font-bold text-forest-950 truncate max-w-[140px]">
                      {ev.filename}
                    </span>
                  </div>
                  <span className="text-[10px] bg-cream-300 text-forest-900 px-2 py-0.5 rounded font-mono font-bold">
                    {ev.document_type}
                  </span>
                </div>
                <div className="text-[11px] text-forest-800 space-y-1">
                  <p>
                    SHA-256:{" "}
                    <span className="font-mono text-[9px] text-forest-700">
                      {ev.sha256_hash.slice(0, 16)}...
                    </span>
                  </p>
                  <p>
                    Confidence:{" "}
                    <span className="font-bold text-emerald-800">
                      {(ev.confidence * 100).toFixed(0)}%
                    </span>
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-cream-600/50">
                    <span className="text-forest-950 font-bold">{ev.extraction_status}</span>
                    <span className="text-[9px] bg-cream-300 text-forest-900 px-1.5 py-0.5 rounded border border-cream-600 font-semibold font-mono">
                      {ev.provider_mode || "LOCAL DEMO / MOCK"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Evidence Detail Inspector */}
          {selectedEvidence && (
            <div className="p-5 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-4">
              <div className="flex items-center justify-between border-b border-cream-600/60 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-forest-950 flex items-center space-x-2">
                    <span>Evidence Inspector: {selectedEvidence.filename}</span>
                    <span className="text-xs font-mono bg-forest-900 text-gold-300 px-2 py-0.5 rounded font-bold">
                      {selectedEvidence.id}
                    </span>
                  </h4>
                  <p className="text-xs text-forest-700 mt-0.5 font-mono">
                    MIME: {selectedEvidence.mime_type} • Size: {(selectedEvidence.file_size_bytes / 1024).toFixed(1)} KB • Provider: {selectedEvidence.provider_mode || "LOCAL DEMO / MOCK"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="text-xs text-forest-700 hover:text-forest-950 font-bold"
                >
                  Close
                </button>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-2 font-mono">
                  Validated Schema Extractions:
                </p>
                <pre className="p-4 bg-emerald-950 rounded-xl text-xs font-mono text-emerald-200 overflow-x-auto max-h-80 border border-emerald-900">
                  {JSON.stringify(selectedEvidence.extracted_data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Human-in-the-Loop Investigation Actions */}
      {activeTab === "investigation" && (
        <div className="space-y-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-forest-700 font-mono">
            SECTION 3: HUMAN INVESTIGATION & FINAL DETERMINATION
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes & Collaboration Thread */}
            <div className="p-5 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                Investigator Notes & Collaboration
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(!investigationCase?.investigator_notes || investigationCase.investigator_notes.length === 0) ? (
                  <p className="text-xs text-forest-700 italic">No notes added yet.</p>
                ) : (
                  investigationCase.investigator_notes.map((n, i) => (
                    <div key={i} className="p-3 bg-cream-200/50 rounded-xl border border-cream-600 text-xs space-y-1">
                      <div className="flex justify-between text-forest-800 font-medium">
                        <span className="text-forest-950 font-bold">{n.author}</span>
                        <span className="text-[10px] text-forest-700 font-mono">
                          {n.timestamp ? new Date(n.timestamp).toLocaleString() : ""}
                        </span>
                      </div>
                      <p className="text-forest-950 leading-relaxed font-medium">{n.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="pt-2 border-t border-cream-600 space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter investigation observation, vendor interview findings, or witness statement..."
                  rows={2}
                  className="w-full bg-cream-200/50 border border-cream-600 rounded-xl px-3 py-2 text-xs text-forest-950 placeholder-forest-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-forest-900 hover:bg-forest-800 text-gold-300 hover:text-white rounded-xl text-xs font-bold transition shadow-sm border border-gold-400/40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </form>
            </div>

            {/* Decision & Override Console */}
            <div className="space-y-6">
              {/* AI Risk Override Slider */}
              <div className="p-5 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                    Override AI Risk Assessment
                  </h3>
                  <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200 font-bold font-mono">
                    Preserves AI Baseline
                  </span>
                </div>
                <p className="text-xs text-forest-800 leading-relaxed">
                  Human investigators may adjust the effective score when physical inspection or subpoenaed records counter the automated model. The original AI baseline ({aiScore.toFixed(0)}) remains preserved.
                </p>

                <form onSubmit={handleOverrideScore} className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-forest-950">
                        New Effective Score (0 - 100):
                      </label>
                      <span className="text-sm font-black font-mono text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
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
                      Mandatory Override Rationale:
                    </label>
                    <textarea
                      required
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Document exact reason for overriding automated risk..."
                      rows={2}
                      className="w-full bg-cream-200/50 border border-cream-600 rounded-xl px-3 py-2 text-xs text-forest-950 placeholder-forest-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-sm border border-purple-500/40"
                  >
                    Commit Human Override
                  </button>
                </form>
              </div>

              {/* Final Binding Determination */}
              <div className="p-5 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                  Final Human Determination
                </h3>
                <p className="text-xs text-forest-800 leading-relaxed">
                  AI agents never declare guilt or deny coverage. The final decision is committed by the licensed investigator.
                </p>

                {investigationCase?.final_decision ? (
                  <div className="p-3.5 bg-cream-200/60 rounded-xl border border-cream-600 text-xs space-y-1">
                    <span className="font-extrabold text-emerald-950 font-mono">
                      Decision: {investigationCase.final_decision}
                    </span>
                    <p className="text-forest-950">Reason: {investigationCase.decision_reason}</p>
                    <p className="text-forest-700 text-[10px] font-mono">
                      Decided by: {investigationCase.decided_by}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleFinalDecision("APPROVED")}
                      disabled={actionLoading}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Claim</span>
                    </button>
                    <button
                      onClick={() => handleFinalDecision("REJECTED")}
                      disabled={actionLoading}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Claim (Fraud Denial)</span>
                    </button>
                    <button
                      onClick={() => handleFinalDecision("ESCALATED_LEGAL")}
                      disabled={actionLoading}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Escalate to Legal / SIU</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Immutable Audit Trail */}
      {activeTab === "audit" && (
        <div className="p-5 rounded-2xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-forest-700 font-mono">
            SECTION 4: IMMUTABLE AUDIT TRAIL
          </div>

          <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans flex items-center space-x-2">
            <History className="w-4 h-4 text-forest-800" />
            <span>SOC 2 Compliance Event Stream</span>
          </h3>

          {loadingAudit ? (
            <p className="text-xs text-forest-700">Loading audit trail...</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-cream-200/50 rounded-xl border border-cream-600 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-emerald-950 font-bold">{log.action}</span>
                      <span className="text-cream-700">•</span>
                      <span className="text-forest-800 font-medium">{log.actor}</span>
                    </div>
                    {log.new_value && (
                      <p className="text-[11px] text-forest-700 font-mono">
                        {JSON.stringify(log.new_value)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-forest-700 font-mono">
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
