import React, { useState, useEffect, useRef } from "react";
import {
  GitGraph,
  Play,
  RefreshCw,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Camera,
  History,
  Scale,
  Sparkles,
  Lock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Radio,
  ChevronRight,
  ListFilter,
  Layers,
  Terminal,
  FileSearch,
  Check,
  Zap,
  Info
} from "lucide-react";
import { Claim, InvestigationStatus, StageEntry, FraudSignal } from "../types";
import { investigationApi, claimsApi } from "../services/api";
import { RiskBadge } from "./primitives/RiskBadge";

interface RealtimeInvestigationViewProps {
  claims: Claim[];
  onOpenClaimDossier: (claimId: string) => void;
  defaultClaimId?: string;
}

const PIPELINE_STAGES = [
  { id: "claim_intake", label: "Claim Ingestion", node: "load_claim", icon: FileText, branch: "main" },
  { id: "evidence_collection", label: "Evidence Collection", node: "collect_evidence", icon: Layers, branch: "main" },
  { id: "document_analysis", label: "Doc Agent + LLM", node: "document_analysis", icon: FileSearch, branch: "parallel" },
  { id: "vision_analysis", label: "Vision Agent", node: "vision_analysis", icon: Camera, branch: "parallel" },
  { id: "historical_analysis", label: "Historical Patterns", node: "historical_analysis", icon: History, branch: "parallel" },
  { id: "rules_analysis", label: "Rules Engine (Join)", node: "rules_analysis", icon: Scale, branch: "join" },
  { id: "verification", label: "Verification + LLM", node: "verification", icon: ShieldCheck, branch: "main" },
  { id: "llm_investigation_synthesis", label: "LLM Investigation Synthesis", node: "llm_investigation_synthesis", icon: Sparkles, branch: "main" },
  { id: "risk_calculation", label: "Risk Engine (Authoritative)", node: "risk_calculation", icon: Cpu, branch: "main" },
  { id: "risk_routing", label: "Automated Routing", node: "risk_routing", icon: Zap, branch: "main" },
  { id: "human_review", label: "Investigator Gate", node: "human_review", icon: Lock, branch: "main" },
];

const SCENARIOS = [
  { id: "CLM-SCENARIO-A", name: "Scenario A", title: "Clean Commuter Claim", expected: "LOW (12)" },
  { id: "CLM-SCENARIO-B", name: "Scenario B", title: "Staged Collision & Inflated Repair", expected: "CRITICAL (85)" },
  { id: "CLM-SCENARIO-C", name: "Scenario C", title: "Pre-Existing Damage & Recycled Photo", expected: "HIGH (65)" },
  { id: "CLM-SCENARIO-D", name: "Scenario D", title: "Ghost Passenger & Fabricated Medical", expected: "HIGH (60)" },
  { id: "CLM-SCENARIO-E", name: "Scenario E", title: "Total Loss & VIN Mismatch", expected: "CRITICAL (92)" },
  { id: "CLM-SCENARIO-F", name: "Scenario F", title: "Prompt Injection in Estimate", expected: "CRITICAL (75)" },
];

export const RealtimeInvestigationView: React.FC<RealtimeInvestigationViewProps> = ({
  claims,
  onOpenClaimDossier,
  defaultClaimId = "CLM-SCENARIO-B",
}) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string>(defaultClaimId);
  const [investigationStatus, setInvestigationStatus] = useState<InvestigationStatus | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<"ws" | "polling" | "idle">("idle");
  const [activeTab, setActiveTab] = useState<"synthesis" | "checklist" | "extractions" | "signals">("synthesis");
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];

  const appendLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLiveLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const cleanupConnections = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, []);

  // Load existing investigation on claim switch
  useEffect(() => {
    if (!selectedClaimId) return;
    cleanupConnections();
    loadExistingInvestigation(selectedClaimId);
  }, [selectedClaimId]);

  const loadExistingInvestigation = async (claimId: string) => {
    try {
      const data = await investigationApi.getClaimInvestigation(claimId);
      if (data && data.investigation_id) {
        setInvestigationStatus({
          investigation_id: data.investigation_id,
          claim_id: data.claim_id,
          current_stage: data.graph_state?.current_stage || "human_review",
          status: (data.status as any) || "completed",
          stage_history: data.graph_state?.stage_history || [],
          agent_statuses: data.graph_state?.agent_statuses || {},
          fraud_signals: data.fraud_signals || [],
          risk_score: data.risk_assessment?.overall_score,
          risk_level: data.risk_assessment?.risk_level,
          llm_provider: data.graph_state?.llm_provider || "[LOCAL DEMO / MOCK]",
          llm_extractions: data.graph_state?.document_extractions || [],
          investigation_synthesis: data.llm_synthesis,
        });
        appendLog(`Loaded existing investigation state for claim ${claimId}`);
      }
    } catch (err) {
      setInvestigationStatus(null);
    }
  };

  const startPolling = (invId: string) => {
    setConnectionType("polling");
    appendLog(`Fallback to HTTP polling active for investigation ${invId}`);
    
    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const status = await investigationApi.getInvestigationStatus(invId);
        setInvestigationStatus(status);
        appendLog(`Stage update: ${status.current_stage} (${status.status})`);
        
        if (status.status === "completed" || status.status === "error") {
          setIsRunning(false);
          cleanupConnections();
          setConnectionType("idle");
          appendLog(`Pipeline finished with status: ${status.status}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);
  };

  const triggerLiveInvestigation = async () => {
    if (!selectedClaimId) return;
    cleanupConnections();
    setIsRunning(true);
    setErrorMsg(null);
    setLiveLogs([]);
    appendLog(`Initiating LangGraph multi-agent pipeline for ${selectedClaimId}...`);

    try {
      const initResp = await investigationApi.triggerInvestigation(selectedClaimId);
      const invId = initResp.investigation_id;
      appendLog(`LangGraph initialized. Task ID: ${invId}`);

      setInvestigationStatus({
        investigation_id: invId,
        claim_id: selectedClaimId,
        current_stage: initResp.current_stage || "claim_intake",
        status: "in_progress",
        stage_history: [],
        agent_statuses: {
          document_agent: "pending",
          vision_agent: "pending",
          historical_agent: "pending",
          rules_engine: "pending",
          verification_agent: "pending",
          risk_engine: "pending",
        },
        fraud_signals: [],
        llm_provider: "[LOCAL DEMO / MOCK]",
      });

      // Attempt WebSocket connection
      try {
        const streamUrl = investigationApi.getStreamUrl(invId);
        appendLog(`Connecting to WebSocket: ${streamUrl}`);
        const ws = new WebSocket(streamUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionType("ws");
          appendLog("WebSocket connected. Streaming real-time node events...");
        };

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.event_type === "stage_start" || data.event_type === "stage_completed") {
              appendLog(`Node event: ${data.stage} -> ${data.status}`);
              investigationApi.getInvestigationStatus(invId).then((latest) => {
                setInvestigationStatus(latest);
              }).catch(() => {});
            } else if (data.event_type === "graph_completed") {
              appendLog(`LangGraph completed execution.`);
              setIsRunning(false);
              investigationApi.getInvestigationStatus(invId).then((finalState) => {
                setInvestigationStatus(finalState);
                cleanupConnections();
                setConnectionType("idle");
              }).catch(() => {});
            }
          } catch (e) {
            console.error("WS parse error", e);
          }
        };

        ws.onerror = () => {
          appendLog("WebSocket disconnected or unavailable. Switching to polling fallback.");
          startPolling(invId);
        };

        ws.onclose = () => {
          if (isRunning) {
            startPolling(invId);
          }
        };
      } catch (wsErr) {
        startPolling(invId);
      }
    } catch (err: any) {
      setIsRunning(false);
      setErrorMsg(err.message || "Failed to trigger LangGraph investigation.");
      appendLog(`Error: ${err.message}`);
    }
  };

  const getStageStatus = (stageId: string): "completed" | "running" | "pending" | "failed" => {
    if (!investigationStatus) return "pending";
    const historyItem = investigationStatus.stage_history?.find((s) => s.stage === stageId);
    if (historyItem) {
      if (historyItem.status === "completed") return "completed";
      if (historyItem.status === "failed") return "failed";
      if (historyItem.status === "running") return "running";
    }
    if (investigationStatus.current_stage === stageId && isRunning) {
      return "running";
    }
    if (investigationStatus.status === "completed") {
      return "completed";
    }
    return "pending";
  };

  const synthesis = investigationStatus?.investigation_synthesis;
  const riskScore = investigationStatus?.risk_score ?? selectedClaim?.final_risk_score ?? selectedClaim?.risk_score ?? 0;
  const riskLevel = investigationStatus?.risk_level ?? selectedClaim?.final_risk_level ?? selectedClaim?.risk_level ?? "LOW";
  const llmProvider = investigationStatus?.llm_provider || "[LOCAL DEMO / MOCK]";

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Executive Control Header */}
      <div className="bg-gradient-to-r from-forest-950 via-emerald-950 to-forest-950 rounded-2xl border border-gold-400/40 p-5 shadow-2xl relative overflow-hidden text-cream-100">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-gold-500/20 border border-gold-400/40 text-gold-300 shadow-md">
                <GitGraph className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-black tracking-tight text-white font-sans">
                    LangGraph Real-Time Investigation Orchestrator
                  </h1>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    13-NODE HYBRID
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Parallel evidence branches + LLM structured synthesis + Authoritative deterministic risk engine
                </p>
              </div>
            </div>

            {/* Provider & Regulatory Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-gold-300" />
                <span>LLM Provider:</span>
                <span className="font-bold text-gold-300">{llmProvider}</span>
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>RULE SEC-01: Injection Guarded</span>
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gold-950/40 border border-gold-400/30 text-gold-300">
                <Lock className="w-3.5 h-3.5" />
                <span>AI recommends. Human decides.</span>
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-emerald-800/40 text-cream-300">
                <Radio className={`w-3.5 h-3.5 ${connectionType === "ws" ? "text-emerald-400 animate-pulse" : connectionType === "polling" ? "text-amber-400" : "text-gray-400"}`} />
                <span>Stream: {connectionType === "ws" ? "WebSocket Active" : connectionType === "polling" ? "Polling Active" : "Ready"}</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => onOpenClaimDossier(selectedClaimId)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-200 bg-emerald-900/70 border border-emerald-700/60 hover:bg-emerald-800 hover:text-white transition shadow-sm"
            >
              <ExternalLink className="w-4 h-4 text-gold-300" />
              <span>Open Full Dossier</span>
            </button>

            <button
              onClick={triggerLiveInvestigation}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-black shadow-lg transition-all ${
                isRunning
                  ? "bg-amber-500/80 text-forest-950 cursor-not-allowed animate-pulse"
                  : "bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-forest-950 hover:brightness-110 shadow-gold-500/20 active:scale-95"
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-forest-950" />
                  <span>Executing Graph...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run LangGraph Investigation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Benchmark Scenario Selector */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-cream-700/80 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ListFilter className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-forest-950 font-mono">
              SELECT BENCHMARK SCENARIO OR ACTIVE CLAIM
            </h2>
          </div>
          <span className="text-[11px] text-forest-600 font-mono">
            Click any scenario to load test case and run real-time multi-agent triage
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SCENARIOS.map((sc) => {
            const isSelected = selectedClaimId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setSelectedClaimId(sc.id)}
                className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden group ${
                  isSelected
                    ? "bg-gradient-to-br from-forest-900 to-emerald-950 text-white border-gold-400 shadow-md ring-1 ring-gold-400/50"
                    : "bg-cream-200/50 hover:bg-white text-forest-900 border-cream-700/80 hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-black uppercase font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? "bg-gold-500/20 text-gold-300 border border-gold-400/40" : "bg-cream-400 text-forest-700"
                  }`}>
                    {sc.name}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${
                    isSelected ? "text-gold-200" : "text-emerald-800"
                  }`}>
                    {sc.expected}
                  </span>
                </div>
                <div className={`text-xs font-bold leading-snug line-clamp-2 ${isSelected ? "text-cream-100" : "text-forest-950"}`}>
                  {sc.title}
                </div>
                {isSelected && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gold-400 shadow-gold-glow" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Visual 11-Stage LangGraph Pipeline Tracker */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-cream-700/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cream-600/60 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <h3 className="text-sm font-black tracking-tight text-forest-950 font-mono uppercase">
              LangGraph Directed Acyclic Graph (DAG) Execution Tracker
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="flex items-center space-x-1 text-forest-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Completed</span>
            </span>
            <span className="flex items-center space-x-1 text-forest-700">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Active</span>
            </span>
            <span className="flex items-center space-x-1 text-forest-700">
              <span className="w-2 h-2 rounded-full bg-cream-400" />
              <span>Pending</span>
            </span>
          </div>
        </div>

        {/* Interactive Pipeline Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {PIPELINE_STAGES.map((st, idx) => {
            const status = getStageStatus(st.id);
            const Icon = st.icon;
            const isParallel = st.branch === "parallel";
            const isJoin = st.branch === "join";

            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  status === "completed"
                    ? "bg-emerald-50/80 border-emerald-300 text-forest-900 shadow-sm"
                    : status === "running"
                    ? "bg-amber-50/90 border-amber-400 text-forest-950 shadow-md ring-2 ring-amber-400/40"
                    : "bg-cream-100/60 border-cream-600/60 text-forest-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-forest-500">
                    Step {idx + 1}
                  </span>
                  {isParallel && (
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200">
                      PARALLEL
                    </span>
                  )}
                  {isJoin && (
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-purple-100 text-purple-800 font-bold border border-purple-200">
                      FAN-IN JOIN
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2.5 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      status === "completed"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : status === "running"
                        ? "bg-amber-500 text-forest-950 animate-bounce"
                        : "bg-cream-300 text-forest-700"
                    }`}
                  >
                    {status === "completed" ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : status === "running" ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold leading-tight tracking-tight text-forest-950">
                      {st.label}
                    </h4>
                    <span className="text-[10px] font-mono text-forest-600">
                      node: {st.node}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-cream-300/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="capitalize font-bold text-forest-800">
                    {status}
                  </span>
                  {status === "completed" && (
                    <span className="text-emerald-700 font-bold">Passed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Multi-Agent Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { name: "Document Agent", provider: "LLM Structured Parsing", icon: FileSearch, key: "document_agent" },
          { name: "Vision Agent", provider: "Damage & Photo Hash", icon: Camera, key: "vision_agent" },
          { name: "Historical Agent", provider: "Shop & Velocity Index", icon: History, key: "historical_agent" },
          { name: "Rules Engine", provider: "Deterministic Rule Matrix", icon: Scale, key: "rules_engine" },
          { name: "Verification Agent", provider: "Cross-Source Validation", icon: ShieldCheck, key: "verification_agent" },
          { name: "Risk Engine", provider: "Authoritative 0–100 Scorer", icon: Cpu, key: "risk_engine" },
        ].map((ag) => {
          const status = investigationStatus?.agent_statuses?.[ag.key] || "completed";
          const Icon = ag.icon;
          return (
            <div
              key={ag.name}
              className="bg-white/90 rounded-xl border border-cream-700/80 p-3.5 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-forest-900 text-gold-300">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black ${
                  status === "completed"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : status === "running"
                    ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                    : "bg-cream-300 text-forest-700"
                }`}>
                  {status.toUpperCase()}
                </span>
              </div>
              <div>
                <h5 className="text-xs font-black text-forest-950 leading-tight">
                  {ag.name}
                </h5>
                <p className="text-[10px] text-forest-600 font-mono mt-0.5">
                  {ag.provider}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Primary Investigation Workspace (Split: Synthesis + Authoritative Score) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: LLM Reasoning, Synthesis, and Extraction Card (8 cols) */}
        <div className="xl:col-span-8 bg-white/95 backdrop-blur-md rounded-2xl border border-cream-700/80 shadow-sm overflow-hidden flex flex-col">
          {/* Header & Tabs */}
          <div className="p-5 border-b border-cream-600/70 bg-gradient-to-r from-cream-100 via-white to-cream-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-forest-950 text-gold-400 shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-forest-950 tracking-tight">
                    LLM Multi-Agent Investigation Synthesis
                  </h3>
                  <p className="text-xs text-forest-600">
                    Grounded structured reasoning & uncorroborated assertion discovery
                  </p>
                </div>
              </div>

              {/* Provider honesty tag */}
              <div className="px-3 py-1 rounded-xl bg-emerald-950 text-gold-300 border border-gold-400/40 text-[11px] font-mono font-bold flex items-center space-x-1.5 shadow-sm">
                <Info className="w-3.5 h-3.5 text-gold-400" />
                <span>Provider: {llmProvider}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "synthesis", label: "Executive Synthesis" },
                { id: "checklist", label: "Investigator Checklist" },
                { id: "extractions", label: "Extracted Line Items" },
                { id: "signals", label: `Fraud Signals (${investigationStatus?.fraud_signals?.length || 0})` },
              ].map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setActiveTab(tb.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tb.id
                      ? "bg-forest-950 text-gold-300 shadow-sm border border-gold-400/40 font-black"
                      : "text-forest-700 hover:bg-cream-300 hover:text-forest-950"
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-5 flex-1 min-h-[380px]">
            {activeTab === "synthesis" && (
              <div className="space-y-4 animate-in fade-in">
                {/* Synthesis Summary */}
                <div className="p-4 rounded-xl bg-cream-100 border border-cream-600/80">
                  <h4 className="text-xs font-black uppercase tracking-wider text-forest-900 font-mono mb-2 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Cross-Source Narrative Assessment</span>
                  </h4>
                  <p className="text-xs text-forest-800 leading-relaxed font-sans">
                    {synthesis?.summary ||
                      selectedClaim?.incident_description ||
                      "Investigation synthesis completed. Discrepancies cross-referenced against police reports and invoices."}
                  </p>
                </div>

                {/* Discrepancies list */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-forest-900 font-mono mb-2 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Critical Discrepancies & Contradictions</span>
                  </h4>
                  {synthesis?.discrepancies && synthesis.discrepancies.length > 0 ? (
                    <div className="space-y-2">
                      {synthesis.discrepancies.map((disc, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-950 flex items-start space-x-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{disc}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-forest-600 italic">
                      No glaring factual contradictions identified across submitted documents.
                    </p>
                  )}
                </div>

                {/* Corroborated Facts & Unverified Assertions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-950 font-mono mb-2 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Corroborated Facts</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-emerald-950">
                      {(synthesis?.corroborated_facts || [
                        "Vehicle VIN matches registered state motor records",
                        "Incident timestamp aligns with police dispatch window",
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start space-x-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-950 font-mono mb-2 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Unverified Assertions</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-amber-950">
                      {(synthesis?.unverified_assertions || [
                        "Internal engine and subframe structural damage claims",
                        "Pre-incident condition of vehicle bumper and quarter panel",
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start space-x-1.5">
                          <span className="text-amber-600 font-bold">!</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "checklist" && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-forest-900 font-mono">
                    ACTIONABLE INVESTIGATOR DIRECTIVES
                  </h4>
                  <span className="text-[11px] text-forest-600 font-mono">
                    Mandatory items before claim settlement
                  </span>
                </div>

                {(synthesis?.investigator_checklist || [
                  "Dispatch certified field appraiser to inspect physical vehicle at repair shop",
                  "Subpoena metadata and original RAW files for damage photographs",
                  "Verify business license and tax records for repair facility",
                  "Conduct recorded interview with claimant regarding prior claims history",
                  "Contact local municipality to obtain municipal intersection traffic camera footage",
                ]).map((item, idx) => (
                  <label
                    key={idx}
                    className="p-3 rounded-xl bg-cream-100 hover:bg-cream-200/80 border border-cream-600/80 flex items-start space-x-3 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={idx === 0}
                      className="mt-0.5 rounded border-forest-400 text-forest-900 focus:ring-forest-900"
                    />
                    <span className="text-xs font-medium text-forest-950 leading-relaxed">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {activeTab === "extractions" && (
              <div className="space-y-3 animate-in fade-in">
                <h4 className="text-xs font-black uppercase tracking-wider text-forest-900 font-mono">
                  STRUCTURED DOCUMENT EXTRACTIONS & LINE ITEMS
                </h4>
                {investigationStatus?.llm_extractions && investigationStatus.llm_extractions.length > 0 ? (
                  <div className="space-y-3">
                    {investigationStatus.llm_extractions.map((ext, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-cream-100 border border-cream-600/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-forest-950 font-mono">
                            {ext.document_type || "Supporting Document"}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">
                            Confidence: {Math.round((ext.confidence || 0.95) * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-forest-700 leading-relaxed">
                          {ext.raw_summary || "Document parsed and verified."}
                        </p>
                        {ext.extracted_fields && (
                          <div className="bg-white/80 rounded-lg p-2.5 text-[11px] font-mono text-forest-900 grid grid-cols-2 gap-2 border border-cream-600/60">
                            {Object.entries(ext.extracted_fields).map(([k, v]) => (
                              <div key={k}>
                                <span className="text-forest-600">{k}:</span>{" "}
                                <span className="font-bold">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-forest-600 font-mono bg-cream-100 rounded-xl border border-cream-600/60">
                    No raw structured extractions available. Run investigation to parse documents.
                  </div>
                )}
              </div>
            )}

            {activeTab === "signals" && (
              <div className="space-y-2.5 animate-in fade-in">
                {investigationStatus?.fraud_signals && investigationStatus.fraud_signals.length > 0 ? (
                  investigationStatus.fraud_signals.map((sig) => (
                    <div
                      key={sig.id}
                      className="p-3.5 rounded-xl bg-cream-100 border border-cream-600/80 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-black text-forest-950">
                            {sig.signal_type}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cream-300 text-forest-700 uppercase font-bold">
                            {sig.category}
                          </span>
                        </div>
                        <p className="text-xs text-forest-800 leading-relaxed">
                          {sig.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <RiskBadge level={sig.severity} size="sm" />
                        <span className="block text-xs font-mono font-black text-rose-700 mt-1">
                          +{sig.score_impact} pts
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-forest-600 italic">No fraud signals triggered.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Authoritative Deterministic Risk & Decision Lock (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Risk Score Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-cream-700/80 p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-cream-600/60 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-forest-950 font-mono">
                AUTHORITATIVE RISK SCORE
              </span>
              <RiskBadge level={riskLevel} size="sm" />
            </div>

            <div className="flex items-center justify-center py-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="#e8ede4"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke={
                      riskScore >= 75
                        ? "#e11d48"
                        : riskScore >= 50
                        ? "#f97316"
                        : riskScore >= 25
                        ? "#f59e0b"
                        : "#10b981"
                    }
                    strokeWidth="12"
                    strokeDasharray={427}
                    strokeDashoffset={427 - (427 * riskScore) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black tracking-tight text-forest-950 font-mono">
                    {Math.round(riskScore)}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-forest-600 uppercase tracking-wider">
                    out of 100
                  </span>
                </div>
              </div>
            </div>

            {/* Authoritative Callout */}
            <div className="p-3 rounded-xl bg-forest-950 text-cream-100 border border-gold-400/40 space-y-1 mt-2">
              <div className="flex items-center space-x-1.5 text-gold-300 text-xs font-bold font-mono">
                <Cpu className="w-3.5 h-3.5" />
                <span>Deterministic Risk Engine</span>
              </div>
              <p className="text-[11px] text-cream-200/80 leading-snug">
                Authoritative score calculation. LLM provides grounded analysis and synthesis but is strictly isolated from numerical score calculation.
              </p>
            </div>

            {/* Human Decision Lock */}
            <div className="mt-4 pt-4 border-t border-cream-600/60">
              <div className="flex items-center space-x-2 text-xs font-bold text-forest-950 mb-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>Human Decision Governance</span>
              </div>
              <p className="text-[11px] text-forest-700 mb-3 leading-relaxed">
                Claims with High or Critical risk require human investigator review before any settlement or denial can be executed.
              </p>

              <button
                onClick={() => onOpenClaimDossier(selectedClaimId)}
                className="w-full py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-gold-200 font-black text-xs border border-gold-400/40 shadow-md flex items-center justify-center space-x-2 transition"
              >
                <span>Open Dossier & Submit Decision</span>
                <ChevronRight className="w-4 h-4 text-gold-300" />
              </button>
            </div>
          </div>

          {/* Live Activity Terminal */}
          <div className="bg-forest-950 rounded-2xl border border-emerald-800/40 p-4 shadow-sm text-cream-200 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-emerald-900 pb-2">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>LangGraph Stream Console</span>
              </div>
              <span className="text-[9px] text-emerald-400/70">
                {liveLogs.length} events
              </span>
            </div>

            <div className="h-44 overflow-y-auto space-y-1 text-[10px] text-emerald-200/80 pr-1 scrollbar-thin">
              {liveLogs.length > 0 ? (
                liveLogs.map((lg, i) => (
                  <div key={i} className="leading-tight break-all">
                    {lg}
                  </div>
                ))
              ) : (
                <div className="text-emerald-500/50 italic pt-8 text-center">
                  Awaiting LangGraph execution trigger...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
