import React, { useState } from "react";
import {
  History,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCog,
  Scale,
  Cpu,
  ArrowRight,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { Claim } from "../types";

interface AuditTrailViewProps {
  claims: Claim[];
  onOpenClaimDossier: (claimId: string) => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  claims,
  onOpenClaimDossier,
}) => {
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const events = [
    {
      id: "AUD-1008",
      claimId: "CLM-SCENARIO-B",
      action: "FINAL_HUMAN_DECISION",
      actor: "Sarah Johnson (Chief Claims Officer)",
      details: "Claim denied due to confirmed staged damage & recycled invoice (GW-CC-SCENARIO-B)",
      timestamp: "2026-09-09T18:22:15Z",
      type: "DECISION",
      icon: Scale,
      badgeColor: "bg-rose-100 text-rose-950 border-rose-300",
    },
    {
      id: "AUD-1007",
      claimId: "CLM-SCENARIO-B",
      action: "AI_RISK_OVERRIDDEN",
      actor: "Lead Vance (Senior SIU)",
      details: "Adjusted effective score from 85 to 92 based on repair shop interview.",
      timestamp: "2026-09-09T18:15:30Z",
      type: "OVERRIDE",
      icon: UserCog,
      badgeColor: "bg-gold-100 text-gold-950 border-gold-400",
    },
    {
      id: "AUD-1006",
      claimId: "CLM-SCENARIO-B",
      action: "INVESTIGATOR_NOTE_ADDED",
      actor: "Sarah Johnson (SIU Lead)",
      details: "SIU interview conducted with shop manager at QuickCash Collision. Refused itemized parts audit.",
      timestamp: "2026-09-09T17:58:00Z",
      type: "NOTE",
      icon: History,
      badgeColor: "bg-cream-300 text-forest-950 border-cream-600",
    },
    {
      id: "AUD-1005",
      claimId: "CLM-SCENARIO-F",
      action: "PROMPT_INJECTION_SANITIZED",
      actor: "Document Agent (Security Layer)",
      details: "Neutralized adversarial prompt injection in witness statement. Sanitized and logged under RULE SEC-01.",
      timestamp: "2026-09-09T17:45:10Z",
      type: "SECURITY",
      icon: ShieldCheck,
      badgeColor: "bg-purple-100 text-purple-950 border-purple-300",
    },
    {
      id: "AUD-1004",
      claimId: "CLM-SCENARIO-B",
      action: "CORE_CLAIMS_SYNCHRONIZED",
      actor: "Integration Gateway",
      details: "Synced claim state and effective score with Guidewire ClaimCenter [MOCK SIMULATION].",
      timestamp: "2026-09-09T17:30:45Z",
      type: "SYNC",
      icon: ExternalLink,
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    },
    {
      id: "AUD-1003",
      claimId: "CLM-SCENARIO-B",
      action: "ANALYSIS_COMPLETED",
      actor: "Fraud Risk Engine (Multi-Agent)",
      details: "Synthesized baseline risk score 85 (CRITICAL). 4 deterministic fraud signals detected.",
      timestamp: "2026-09-09T17:20:00Z",
      type: "AI",
      icon: Cpu,
      badgeColor: "bg-teal-100 text-teal-950 border-teal-300",
    },
    {
      id: "AUD-1002",
      claimId: "CLM-SCENARIO-A",
      action: "STP_AUTO_PASSED",
      actor: "Fraud Risk Engine",
      details: "Claim scored 5 (LOW). Straight-through auto-approval confirmed with 0 rule violations.",
      timestamp: "2026-09-09T17:05:00Z",
      type: "AI",
      icon: CheckCircle2,
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    },
    {
      id: "AUD-1001",
      claimId: "CLM-SCENARIO-B",
      action: "ANALYSIS_STARTED",
      actor: "Orchestrator",
      details: "Dispatched 6 multi-agent workers for claim intake and multimodal cross-verification.",
      timestamp: "2026-09-09T17:00:00Z",
      type: "AI",
      icon: Cpu,
      badgeColor: "bg-cream-300 text-forest-900 border-cream-600",
    },
  ];

  const filtered = events.filter((ev) => {
    const matchAction = filterAction === "ALL" || ev.type === filterAction;
    const matchSearch =
      !search ||
      ev.claimId.toLowerCase().includes(search.toLowerCase()) ||
      ev.action.toLowerCase().includes(search.toLowerCase()) ||
      ev.actor.toLowerCase().includes(search.toLowerCase()) ||
      ev.details.toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-cream-700/80 shadow-card-soft">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-black text-forest-950 font-sans tracking-tight flex items-center space-x-2">
              <History className="w-5 h-5 text-forest-800" />
              <span>IMMUTABLE AUDIT TRAIL & GOVERNANCE PROVENANCE</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              SOC 2 COMPLIANT
            </span>
          </div>
          <p className="text-xs text-forest-700 font-medium mt-0.5">
            Cryptographic event timeline capturing all AI inferences, human investigator overrides, and binding determinations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-forest-800 font-bold bg-cream-200 px-3 py-1.5 rounded-xl border border-cream-600">
            Append-Only Cryptographic Log
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white/95 rounded-3xl border border-cream-700/80 shadow-card-soft space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700/60 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event type, claim ID, investigator, or keyword..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-cream-100/60 border border-cream-600/80 text-forest-950 placeholder-forest-700/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "All Events" },
              { id: "DECISION", label: "Final Decisions" },
              { id: "OVERRIDE", label: "Risk Overrides" },
              { id: "NOTE", label: "SIU Notes" },
              { id: "SECURITY", label: "Security Threats" },
              { id: "AI", label: "AI Analysis" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterAction(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  filterAction === t.id
                    ? "bg-forest-950 text-white shadow-sm"
                    : "bg-cream-100 text-forest-800 hover:bg-cream-200 border border-cream-600/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vertical Security Timeline */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-6">
        <div className="space-y-6">
          {filtered.map((ev, idx) => {
            const Icon = ev.icon;
            return (
              <div key={ev.id} className="relative pl-8 md:pl-10 pb-6 border-l-2 border-emerald-800/30 last:border-l-0 last:pb-0">
                {/* Node icon */}
                <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-forest-950 text-gold-300 border-2 border-white flex items-center justify-center shadow-md">
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="p-5 rounded-3xl bg-cream-100/70 border border-cream-600/80 shadow-card-soft hover:shadow-card-elevated transition space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cream-600/60 pb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black border ${ev.badgeColor}`}>
                        {ev.action}
                      </span>
                      <button
                        onClick={() => onOpenClaimDossier(ev.claimId)}
                        className="text-xs font-mono font-bold text-emerald-800 hover:underline flex items-center space-x-1"
                      >
                        <span>{ev.claimId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-forest-700">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-forest-950 font-medium leading-relaxed">
                    {ev.details}
                  </p>

                  <div className="pt-2 border-t border-cream-600/50 flex flex-wrap items-center justify-between text-[10px] font-mono text-forest-700">
                    <span className="flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-forest-800" />
                      <span>Actor: <strong className="text-forest-950">{ev.actor}</strong></span>
                    </span>
                    <span className="text-emerald-800 font-bold">Audit Event ID: {ev.id}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
