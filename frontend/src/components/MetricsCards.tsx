import React from "react";
import { AlertTriangle, FileText, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";
import { Claim } from "../types";

interface MetricsCardsProps {
  claims: Claim[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ claims }) => {
  const total = claims.length;
  const underReview = claims.filter(
    (c) => c.status === "REVIEW_REQUIRED" || c.status === "HUMAN_REVIEW"
  ).length;
  const highOrCritical = claims.filter(
    (c) => c.risk_level === "HIGH" || c.risk_level === "CRITICAL"
  ).length;
  const resolved = claims.filter((c) => c.status.startsWith("FINAL_DECISION_")).length;
  
  const totalScore = claims.reduce((acc, c) => acc + (c.risk_score || 0), 0);
  const avgScore = total > 0 ? (totalScore / total).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {/* Total Claims */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Claims</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
          <p className="text-[11px] text-slate-400 mt-1">Active database dossiers</p>
        </div>
        <div className="h-11 w-11 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      {/* Review Required */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">SIU Queue</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{underReview}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pending investigator review</p>
        </div>
        <div className="h-11 w-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* High / Critical Risk */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">High / Critical</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{highOrCritical}</p>
          <p className="text-[11px] text-slate-400 mt-1">Severe fraud indicators</p>
        </div>
        <div className="h-11 w-11 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* Avg Risk Score */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Average Risk</p>
          <p className="text-2xl font-bold text-indigo-300 mt-1">{avgScore}<span className="text-xs text-slate-400 font-normal"> / 100</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Across all intakes</p>
        </div>
        <div className="h-11 w-11 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Cpu className="w-5 h-5" />
        </div>
      </div>

      {/* Human Final Decisions */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{resolved}</p>
          <p className="text-[11px] text-slate-400 mt-1">Human final determinations</p>
        </div>
        <div className="h-11 w-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
