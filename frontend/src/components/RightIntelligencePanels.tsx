import React from "react";
import {
  Activity,
  Cpu,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock
} from "lucide-react";

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
  const agents = [
    { name: "Document Agent", role: "Pydantic Schema & Injection Redaction", status: "Active" },
    { name: "Vision Agent", role: "Damage Panel Localization & Severity", status: "Active" },
    { name: "Historical Agent", role: "Recycled Invoices & Velocity Spikes", status: "Active" },
    { name: "Rules Engine", role: "Deterministic Rules (R01–R05)", status: "Active" },
    { name: "Verification Agent", role: "Cross-Evidence Conflict Matrix", status: "Active" },
    { name: "Fraud Risk Engine", role: "0–100 Composite Weighted Scoring", status: "Active" },
  ];

  const recentActivities = [
    { text: "AI Analysis completed for CLM-SCENARIO-B (Score: 85, CRITICAL)", time: "2m ago", type: "alert" },
    { text: "Human override applied by Lead Vance (+7 pts)", time: "5m ago", type: "override" },
    { text: "Guidewire adapter synced GW-CC-SCENARIO-B", time: "9m ago", type: "sync" },
    { text: "Scenario F prompt-injection payload sanitized", time: "14m ago", type: "security" },
  ];

  return (
    <div className="space-y-6">
      {/* Panel 1: System Health Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-cream-700/80 p-5 shadow-card-soft">
        <div className="flex items-center justify-between pb-3 border-b border-cream-600/60 mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-sans">
              System Health
            </h3>
          </div>
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>OPERATIONAL</span>
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          {[
            { label: "API Services", val: "Online (200 OK)", icon: CheckCircle2 },
            { label: "Database", val: "SQLite / Azure SQL (< 4ms)", icon: CheckCircle2 },
            { label: "AI Agents", val: "6 / 6 Synchronized", icon: CheckCircle2 },
            { label: "Evidence Storage", val: "SHA-256 Protected", icon: Lock },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center justify-between py-1 border-b border-cream-600/30 text-emerald-950">
                <span className="text-forest-800 font-medium">{item.label}</span>
                <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-700">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{item.val}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel 2: Active Agents Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-cream-700/80 p-5 shadow-card-soft">
        <div className="flex items-center justify-between pb-3 border-b border-cream-600/60 mb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-forest-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-sans">
              Active Agents
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-cream-500 text-forest-900 px-2 py-0.5 rounded font-bold border border-cream-700">
            6 / 6 ONLINE
          </span>
        </div>

        <div className="space-y-2">
          {agents.map((ag, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-cream-300/40 border border-cream-600/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-950">{ag.name}</p>
                <p className="text-[10px] text-forest-700 font-medium truncate max-w-[170px]">{ag.role}</p>
              </div>
              <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 3: Recent Activity Feed */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-cream-700/80 p-5 shadow-card-soft">
        <div className="flex items-center space-x-2 pb-3 border-b border-cream-600/60 mb-3">
          <Clock className="w-4 h-4 text-forest-800" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-sans">
            Recent Intelligence Events
          </h3>
        </div>

        <div className="space-y-2.5">
          {recentActivities.map((act, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-cream-300/40 border border-cream-600/60 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-950 text-[11px] leading-snug">{act.text}</span>
              </div>
              <p className="text-[10px] text-forest-700/80 font-mono text-right">{act.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 4: Governance Callout Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 via-forest-900 to-emerald-950 text-white border border-emerald-700/40 shadow-sm relative overflow-hidden">
        <div className="flex items-center space-x-2 text-gold-300 mb-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Human Governance</span>
        </div>
        <p className="text-[11px] text-emerald-100/80 leading-relaxed">
          AI agents calculate risk recommendations; legal claim denials and approvals are reserved exclusively for licensed human investigators.
        </p>
      </div>
    </div>
  );
};
