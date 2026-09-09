import React from "react";
import { AlertTriangle, FileText, CheckCircle2, ShieldAlert, Shield, AlertOctagon } from "lucide-react";
import { Claim } from "../types";

interface MetricsCardsProps {
  claims: Claim[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ claims }) => {
  const total = claims.length;
  const lowRisk = claims.filter((c) => c.risk_level === "LOW").length;
  const mediumRisk = claims.filter((c) => c.risk_level === "MEDIUM").length;
  const highRisk = claims.filter((c) => c.risk_level === "HIGH").length;
  const criticalRisk = claims.filter((c) => c.risk_level === "CRITICAL").length;
  const siuQueue = claims.filter(
    (c) => c.status === "REVIEW_REQUIRED" || c.status === "HUMAN_REVIEW"
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {/* Total Claims */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Claims</span>
          <FileText className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-2xl font-black text-white">{total}</p>
        <p className="text-[10px] text-slate-500">In database</p>
      </div>

      {/* Low Risk */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Low Risk</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-2xl font-black text-emerald-400">{lowRisk}</p>
        <p className="text-[10px] text-slate-500">Score 0–30 (STP)</p>
      </div>

      {/* Medium Risk */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Medium Risk</span>
          <Shield className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-2xl font-black text-amber-400">{mediumRisk}</p>
        <p className="text-[10px] text-slate-500">Score 31–60 (Adjuster)</p>
      </div>

      {/* High Risk */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">High Risk</span>
          <ShieldAlert className="w-4 h-4 text-orange-400" />
        </div>
        <p className="text-2xl font-black text-orange-400">{highRisk}</p>
        <p className="text-[10px] text-slate-500">Score 61–80 (SIU)</p>
      </div>

      {/* Critical Risk */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical Risk</span>
          <AlertOctagon className="w-4 h-4 text-rose-400" />
        </div>
        <p className="text-2xl font-black text-rose-400">{criticalRisk}</p>
        <p className="text-[10px] text-slate-500">Score 81–100 (Freeze)</p>
      </div>

      {/* Investigation Queue */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SIU Queue</span>
          <AlertTriangle className="w-4 h-4 text-amber-300" />
        </div>
        <p className="text-2xl font-black text-amber-300">{siuQueue}</p>
        <p className="text-[10px] text-slate-500">Requires review</p>
      </div>
    </div>
  );
};
