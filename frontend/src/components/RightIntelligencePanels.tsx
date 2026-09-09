import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server,
  Database,
  Cpu,
  FileBox,
  Scale
} from "lucide-react";
import { AgentOrchestrationGraph } from "./primitives/AgentOrchestrationGraph";
import { healthApi } from "../services/api";

import { SystemHealth } from "../types";

interface RightIntelligencePanelsProps {
  onSelectAgentStatus?: () => void;
  onSyncGuidewire?: () => void;
  onSelectAuditLog?: () => void;
}

export const RightIntelligencePanels: React.FC<RightIntelligencePanelsProps> = ({
  onSelectAgentStatus,
  onSyncGuidewire,
  onSelectAuditLog,
}) => {
  const [telemetry, setTelemetry] = useState<SystemHealth | null>(null);

  useEffect(() => {
    healthApi
      .getHealth()
      .then((data) => setTelemetry(data))
      .catch((err) => console.error("Health check error:", err));
  }, []);

  const recentEvents = [
    {
      title: "AI Analysis completed for CLM-SCENARIO-B",
      meta: "Score: 85 · CRITICAL · 4 Rules Triggered",
      time: "2m ago",
      color: "text-rose-600",
    },
    {
      title: "Human override applied by Lead Vance",
      meta: "+7 pts · Adjusted to 92 · Staged collision confirmed",
      time: "5m ago",
      color: "text-gold-700",
    },
    {
      title: "Core System synced: GW-CC-SCENARIO-B",
      meta: "Guidewire Cloud REST Adapter status: SYNCHRONIZED",
      time: "9m ago",
      color: "text-emerald-700",
    },
    {
      title: "Scenario F prompt-injection payload sanitized",
      meta: "Adversarial payload neutralized & SHA-256 logged",
      time: "14m ago",
      color: "text-purple-700",
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Active AI Orchestration Visualization */}
      <AgentOrchestrationGraph onSelectAgent={onSelectAgentStatus} />

      {/* 2. System Health & Infrastructure */}
      <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-cream-700/80 shadow-card-soft">
        <div className="flex items-center justify-between pb-2.5 border-b border-cream-600/70 mb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-800" />
            <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
              System Health
            </h3>
          </div>
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{telemetry?.status || "OPERATIONAL"}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-cream-200/60 border border-cream-700/80 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-forest-900 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>API Services</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-700 font-bold">LIVE</span>
          </div>

          <div className="p-2 rounded-xl bg-cream-200/60 border border-cream-700/80 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-forest-900 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Database</span>
            </div>
            <span className="text-[9px] font-mono text-forest-700 font-bold">
              {telemetry?.database ? `${telemetry.database.latency_ms}ms` : "1.9ms"}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-cream-200/60 border border-cream-700/80 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-forest-900 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Agents</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-700 font-bold">6/6</span>
          </div>

          <div className="p-2 rounded-xl bg-cream-200/60 border border-cream-700/80 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-forest-900 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>File Storage</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-700 font-bold">SYNC</span>
          </div>
        </div>
      </div>

      {/* 3. Recent Intelligence Activity */}
      <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-cream-700/80 shadow-card-soft">
        <div className="flex items-center justify-between pb-2.5 border-b border-cream-600/70 mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-forest-800" />
            <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
              Recent Intelligence Events
            </h3>
          </div>
          <button
            onClick={onSelectAuditLog}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 transition flex items-center space-x-1"
          >
            <span>Full Audit</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentEvents.map((evt, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-cream-200/60 border border-cream-700/80 text-xs space-y-1 hover:bg-cream-300/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`font-bold text-[11px] leading-snug ${evt.color}`}>
                  {evt.title}
                </span>
                <span className="text-[9px] text-forest-700 font-mono shrink-0">
                  {evt.time}
                </span>
              </div>
              <p className="text-[10px] text-forest-800/80 font-medium">{evt.meta}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Human Governance & Compliance Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-forest-900 to-emerald-950 text-white border border-emerald-700/40 shadow-md relative overflow-hidden">
        <div className="flex items-center space-x-2 text-gold-300 mb-1.5">
          <Scale className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">
            Human Governance
          </span>
        </div>
        <p className="text-[11px] text-emerald-100/90 leading-relaxed">
          AI agents calculate risk recommendations. Binding claim approvals, denials, and legal escalations require explicit confirmation by licensed human investigators.
        </p>
        <div className="mt-2 pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[10px] text-gold-300 font-mono">
          <span>AI recommends.</span>
          <span className="font-bold text-white">Human decides.</span>
        </div>
      </div>
    </div>
  );
};
