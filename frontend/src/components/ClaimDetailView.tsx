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
  ExternalLink
} from "lucide-react";
import { ClaimDetail, Evidence, AuditLog } from "../types";
import { investigationApi, claimsApi } from "../services/api";

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
  const [overrideScore, setOverrideScore] = useState<number>(claim.override_risk_score ?? claim.final_risk_score ?? claim.risk_score ?? 50);
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
    const promptMsg = `Are you sure you want to mark this claim as ${decision}? Enter decision rationale:`;
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
      alert(`Synced with ${res.external_reference_id} (${res.sync_status}): ${res.message}`);
    } catch (err) {
      alert("Failed to sync claim with external system.");
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
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return "bg-rose-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 30) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const aiScore = claim.ai_risk_score ?? claim.risk_score ?? 0;
  const aiLevel = claim.ai_risk_level ?? claim.risk_level ?? "LOW";
  const overrideScoreVal = claim.override_risk_score;
  const overrideLevelVal = claim.override_risk_level;
  const effectiveScore = claim.final_risk_score ?? claim.risk_score ?? 0;
  const effectiveLevel = claim.final_risk_level ?? claim.risk_level ?? "LOW";

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Investigation Queue</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400">Claim Status:</span>
          <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700">
            {claim.status}
          </span>
          <button
            onClick={handleExternalSync}
            disabled={syncLoading}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 rounded-md text-xs font-semibold transition"
            title="Sync with Guidewire / Duck Creek Mock Adapter"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{syncLoading ? "Syncing..." : "Sync Core Claims (Mock)"}</span>
          </button>
        </div>
      </div>

      {/* Top Signal Highlight Banner (If Present) */}
      {claim.top_signal && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 uppercase tracking-wide mr-2">Top Red Flag Signal:</span>
            <span className="text-slate-200">{claim.top_signal}</span>
          </div>
        </div>
      )}

      {/* Hero Claim Dossier Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{claim.id}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRiskColor(effectiveLevel)}`}>
                {effectiveLevel} RISK
              </span>
              {overrideScoreVal !== null && overrideScoreVal !== undefined && (
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center space-x-1">
                  <UserCheck className="w-3 h-3" />
                  <span>HUMAN OVERRIDE ACTIVE</span>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 flex items-center space-x-2">
              <span className="font-semibold text-white">{claim.claimant_name}</span>
              <span className="text-slate-500">•</span>
              <span>Policy: {claim.policy_id}</span>
              <span className="text-slate-500">•</span>
              <span>Claimant ID: {claim.claimant_id}</span>
              {claim.assigned_investigator && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-blue-400">Assigned: {claim.assigned_investigator}</span>
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center space-x-1">
                <Car className="w-3.5 h-3.5 text-blue-400" />
                <span>{claim.vehicle_year} {claim.vehicle_make} {claim.vehicle_model} ({claim.vehicle_vin})</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Incident Date: {claim.incident_date}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{claim.incident_location}</span>
              </span>
            </div>
          </div>

          {/* Explicit 3-Tier Score Separation Panel */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-stretch">
            {/* 1. Original AI Score */}
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-3 min-w-[150px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                <span className="flex items-center space-x-1">
                  <Cpu className="w-3 h-3 text-blue-400" />
                  <span>Original AI</span>
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] border ${getRiskColor(aiLevel)}`}>
                  {aiLevel}
                </span>
              </div>
              <div className="text-xl font-black text-white my-1">
                {aiScore.toFixed(0)}<span className="text-xs text-slate-500 font-normal"> / 100</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Immutable Model
              </div>
            </div>

            {/* 2. Human Override */}
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-3 min-w-[150px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                <span className="flex items-center space-x-1">
                  <UserCog className="w-3 h-3 text-purple-400" />
                  <span>Override</span>
                </span>
                {overrideLevelVal && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] border ${getRiskColor(overrideLevelVal)}`}>
                    {overrideLevelVal}
                  </span>
                )}
              </div>
              <div className="text-xl font-black text-purple-300 my-1">
                {overrideScoreVal !== null && overrideScoreVal !== undefined ? (
                  <>{overrideScoreVal.toFixed(0)}<span className="text-xs text-slate-500 font-normal"> / 100</span></>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">None (Using AI)</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[130px]" title={investigationCase?.override_reason || "No manual override"}>
                {investigationCase?.override_reason || "Automated Risk Active"}
              </div>
            </div>

            {/* 3. Effective Final Risk Gauge */}
            <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-3 min-w-[190px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-300 text-[10px] uppercase font-bold tracking-wider mb-1">
                <span className="flex items-center space-x-1">
                  <Scale className="w-3 h-3 text-emerald-400" />
                  <span>Effective Risk</span>
                </span>
                <span className="text-xs font-bold text-white">${claim.claimed_amount.toLocaleString()}</span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="text-2xl font-black text-white">{effectiveScore.toFixed(0)}<span className="text-xs text-slate-400 font-normal"> / 100</span></span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(effectiveLevel)}`}>
                  {effectiveLevel}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full ${getScoreBarColor(effectiveScore)} transition-all duration-700`}
                  style={{ width: `${Math.min(100, Math.max(5, effectiveScore))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        {[
          { key: "overview", label: "Analysis & Signals", icon: ShieldAlert, badge: claim.fraud_signals?.length },
          { key: "evidence", label: "Multimodal Evidence", icon: FileText, badge: claim.evidence_items?.length },
          { key: "investigation", label: "Human-in-the-Loop Actions", icon: Scale },
          { key: "audit", label: "Immutable Audit Trail", icon: History, onClick: loadAuditTrail },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={tab.onClick || (() => setActiveTab(tab.key as any))}
              className={`flex items-center space-x-2 py-3 px-2 border-b-2 font-medium text-sm transition ${
                isActive
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Analysis & Signals */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* AI Explanation Callout */}
            {riskAssessment && (
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                    <span>Explainable Risk Assessment</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Action: {riskAssessment.recommended_action}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {riskAssessment.explanation}
                </div>
              </div>
            )}

            {/* Fraud Signals List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Triggered Fraud Signals & Deterministic Rules ({claim.fraud_signals?.length || 0})
              </h3>
              {(!claim.fraud_signals || claim.fraud_signals.length === 0) ? (
                <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-800 text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No adverse fraud signals triggered. Evidence aligns across all sources.
                </div>
              ) : (
                claim.fraud_signals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/70 hover:border-slate-600 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${getRiskColor(sig.severity)}`}>
                          {sig.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 font-mono">[{sig.category}]</span>
                        <span className="text-sm font-bold text-white">{sig.signal_type}</span>
                      </div>
                      <span className="text-xs font-bold text-rose-400">+{sig.score_impact} pts</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{sig.description}</p>

                    {/* Structured Rule Metadata Details (if present) */}
                    {sig.metadata_json && sig.metadata_json.rule_id && (
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-xs space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px] text-blue-400 font-bold">
                          <span>Rule ID: {sig.metadata_json.rule_id}</span>
                          <span className="text-slate-400 font-normal">Threshold: {sig.metadata_json.threshold}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-500 font-medium">Observed Value: </span>
                          <span className="font-semibold text-amber-300">{String(sig.metadata_json.observed_value)}</span>
                        </div>
                        {sig.metadata_json.explanation && (
                          <div className="text-[11px] text-slate-400 italic">
                            {sig.metadata_json.explanation}
                          </div>
                        )}
                      </div>
                    )}

                    {sig.evidence_refs && sig.evidence_refs.length > 0 && (
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">Evidence Anchors:</span>
                        {sig.evidence_refs.map((ref) => (
                          <span
                            key={ref}
                            className="text-[10px] bg-slate-900 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-mono"
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

          {/* Right Column: Score Component Breakdown & Vehicle Benchmark */}
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Multi-Agent Score Breakdown
              </h3>
              {riskAssessment?.score_breakdown && (
                <div className="space-y-3 text-xs">
                  {Object.entries(riskAssessment.score_breakdown).map(([k, v]) => (
                    <div key={k} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span className="capitalize">{k.replace("_", " ")}</span>
                        <span className="font-bold text-white">{v} pts</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (v / 60) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Vehicle & Financial Profile
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Fair Market Value:</span>
                  <span className="text-white font-medium">${claim.estimated_vehicle_value?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Claim / Value Ratio:</span>
                  <span className={`font-bold ${((claim.claimed_amount / (claim.estimated_vehicle_value || 1)) > 0.8) ? "text-rose-400" : "text-emerald-400"}`}>
                    {((claim.claimed_amount / (claim.estimated_vehicle_value || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Incident Description:</span>
                  <span className="text-white max-w-[180px] truncate text-right" title={claim.incident_description || "N/A"}>
                    {claim.incident_description || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Multimodal Evidence */}
      {activeTab === "evidence" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {claim.evidence_items?.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvidence(ev)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedEvidence?.id === ev.id
                    ? "bg-slate-800 border-blue-500 shadow-md shadow-blue-500/10"
                    : "bg-slate-800/50 border-slate-700/60 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {ev.document_type === "damage_photo" ? (
                      <Camera className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">{ev.filename}</span>
                  </div>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">
                    {ev.document_type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>SHA-256: <span className="font-mono text-[9px] text-slate-500">{ev.sha256_hash.slice(0, 16)}...</span></p>
                  <p>Extraction Confidence: <span className="font-semibold text-emerald-400">{(ev.confidence * 100).toFixed(0)}%</span></p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-white font-medium">{ev.extraction_status}</span>
                    <span className="text-[9px] bg-slate-900 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                      {ev.provider_mode || "LOCAL DEMO / MOCK"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Evidence Detail Inspector */}
          {selectedEvidence && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Evidence Inspector: {selectedEvidence.filename}</span>
                    <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                      {selectedEvidence.id}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    MIME: {selectedEvidence.mime_type} • Size: {(selectedEvidence.file_size_bytes / 1024).toFixed(1)} KB • Mode: {selectedEvidence.provider_mode || "LOCAL DEMO / MOCK"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* JSON Extraction Tree */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Validated Schema Extractions:
                </p>
                <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto max-h-80 border border-slate-800">
                  {JSON.stringify(selectedEvidence.extracted_data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Human-in-the-Loop Investigation Actions */}
      {activeTab === "investigation" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes & Collaboration */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Investigator Notes & Collaboration
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(!investigationCase?.investigator_notes || investigationCase.investigator_notes.length === 0) ? (
                <p className="text-xs text-slate-500 italic">No notes added yet.</p>
              ) : (
                investigationCase.investigator_notes.map((n, i) => (
                  <div key={i} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span className="text-blue-400 font-semibold">{n.author}</span>
                      <span className="text-[10px]">{n.timestamp ? new Date(n.timestamp).toLocaleString() : ""}</span>
                    </div>
                    <p className="text-slate-200">{n.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="pt-2 border-t border-slate-700/60 space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter investigation observation, vendor interview findings, or witness statement..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </form>
          </div>

          {/* Decision & Override Console */}
          <div className="space-y-6">
            {/* AI Risk Override */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Override AI Risk Assessment
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                  Preserves AI Baseline
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Human investigators may adjust the effective score when physical inspection or subpoenaed records counter the automated model. The original AI baseline ({aiScore.toFixed(0)}) remains untouched.
              </p>
              <form onSubmit={handleOverrideScore} className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    New Effective Score (0 - 100): <span className="font-bold text-purple-400">{overrideScore}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(Number(e.target.value))}
                    className="w-full h-2 bg-slate-900 rounded-lg cursor-pointer accent-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Mandatory Override Rationale:
                  </label>
                  <textarea
                    required
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Document exact reason for overriding automated risk..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-semibold transition"
                >
                  Save Override
                </button>
              </form>
            </div>

            {/* Final Binding Determination */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Final Human Determination
              </h3>
              <p className="text-xs text-slate-400">
                AI agents never declare guilt or deny coverage. The final decision is committed by the licensed investigator.
              </p>
              {investigationCase?.final_decision ? (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-emerald-400">Decision: {investigationCase.final_decision}</span>
                  <p className="text-slate-300">Reason: {investigationCase.decision_reason}</p>
                  <p className="text-slate-500 text-[10px]">Decided by: {investigationCase.decided_by}</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => handleFinalDecision("APPROVED")}
                    disabled={actionLoading}
                    className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Claim</span>
                  </button>
                  <button
                    onClick={() => handleFinalDecision("REJECTED")}
                    disabled={actionLoading}
                    className="flex items-center space-x-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Claim (Fraud)</span>
                  </button>
                  <button
                    onClick={() => handleFinalDecision("ESCALATED_LEGAL")}
                    disabled={actionLoading}
                    className="flex items-center space-x-1 px-3 py-2 bg-amber-600 hover:amber-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Escalate to Legal / SIU</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Immutable Audit Trail */}
      {activeTab === "audit" && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-400" />
            <span>Immutable Audit Trail Timeline</span>
          </h3>
          {loadingAudit ? (
            <p className="text-xs text-slate-400">Loading audit trail...</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-blue-400 font-bold">{log.action}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 font-medium">{log.actor}</span>
                    </div>
                    {log.new_value && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        {JSON.stringify(log.new_value)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
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
