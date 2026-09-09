import React, { useState } from "react";
import {
  Search,
  ChevronRight,
  Play,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  SlidersHorizontal,
  Plus,
  Filter,
  UserCheck
} from "lucide-react";
import { Claim } from "../types";

interface ClaimQueueProps {
  claims: Claim[];
  onSelectClaim: (claimId: string) => void;
  onAnalyzeClaim: (claimId: string) => void;
  analyzingClaimId?: string | null;
  onSubmitNewClaim?: () => void;
}

type SortField = "incident_date" | "claimed_amount" | "risk_score";
type SortOrder = "asc" | "desc";

export const ClaimQueue: React.FC<ClaimQueueProps> = ({
  claims,
  onSelectClaim,
  onAnalyzeClaim,
  analyzingClaimId,
  onSubmitNewClaim,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("risk_score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredClaims = claims.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(term) ||
      c.claimant_name.toLowerCase().includes(term) ||
      c.policy_id.toLowerCase().includes(term) ||
      c.vehicle_vin.toLowerCase().includes(term) ||
      (c.top_signal && c.top_signal.toLowerCase().includes(term)) ||
      (c.assigned_investigator && c.assigned_investigator.toLowerCase().includes(term));

    const effectiveLevel = c.final_risk_level ?? c.risk_level;
    const matchesRisk = riskFilter === "ALL" || effectiveLevel === riskFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "REVIEW_REQUIRED" && (c.status === "REVIEW_REQUIRED" || c.status === "HUMAN_REVIEW")) ||
      c.status === statusFilter;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  const sortedClaims = [...filteredClaims].sort((a, b) => {
    let comparison = 0;
    if (sortField === "claimed_amount") {
      comparison = a.claimed_amount - b.claimed_amount;
    } else if (sortField === "risk_score") {
      comparison = (a.final_risk_score ?? a.risk_score) - (b.final_risk_score ?? b.risk_score);
    } else if (sortField === "incident_date") {
      comparison = new Date(a.incident_date).getTime() - new Date(b.incident_date).getTime();
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getRiskScoreBadge = (score: number, level: string, hasOverride: boolean) => {
    let colorClass = "bg-emerald-50 text-emerald-800 border-emerald-300";
    let dotColor = "bg-emerald-500";

    if (level === "CRITICAL" || score >= 80) {
      colorClass = "bg-rose-50 text-rose-800 border-rose-300 shadow-sm shadow-rose-500/10";
      dotColor = "bg-rose-500";
    } else if (level === "HIGH" || score >= 60) {
      colorClass = "bg-orange-50 text-orange-800 border-orange-300";
      dotColor = "bg-orange-500";
    } else if (level === "MEDIUM" || score > 30) {
      colorClass = "bg-gold-50 text-gold-900 border-gold-300";
      dotColor = "bg-gold-500";
    }

    return (
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${colorClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <span>{score.toFixed(0)}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wide opacity-90">{level}</span>
        </span>
        {hasOverride && (
          <span className="text-[9px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200" title="Human Override Active">
            Override
          </span>
        )}
      </div>
    );
  };

  const getWorkflowBadge = (status: string) => {
    if (status === "REVIEW_REQUIRED" || status === "HUMAN_REVIEW") {
      return (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300">
          REVIEW REQUIRED
        </span>
      );
    }
    if (status.startsWith("FINAL_DECISION_")) {
      const dec = status.replace("FINAL_DECISION_", "");
      const isApprove = dec === "APPROVED";
      return (
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
          isApprove ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-rose-50 text-rose-800 border-rose-300"
        }`}>
          {dec}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
        NORMAL PROCESSING
      </span>
    );
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-cream-700/80 shadow-card-soft p-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-cream-600/70">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-extrabold text-emerald-950 font-sans tracking-tight">
              Claims Queue
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-forest-800/10 text-forest-800 font-bold border border-forest-800/20">
              {claims.length}
            </span>
          </div>
          <p className="text-xs text-forest-700/80 mt-0.5">
            Review, investigate, and cross-verify flagged insurance claims
          </p>
        </div>

        {onSubmitNewClaim && (
          <button
            onClick={onSubmitNewClaim}
            className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-emerald-900 text-gold-300 hover:text-white font-bold text-xs tracking-wide shadow-sm border border-gold-400/40 transition flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Claim</span>
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-forest-800/60" />
          <input
            type="text"
            placeholder="Search Claim ID, Claimant, Policy, VIN, Signal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-cream-300/40 border border-cream-600 text-emerald-950 placeholder-forest-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 focus:bg-white transition shadow-inner"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Risk Level Filter */}
          <div className="flex items-center space-x-1 bg-cream-400/50 p-1 rounded-xl border border-cream-600/70 text-xs">
            <span className="px-2 text-[11px] font-bold text-forest-800">Risk:</span>
            {["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  riskFilter === lvl
                    ? "bg-forest-800 text-gold-200 shadow-sm"
                    : "text-forest-700 hover:text-emerald-950"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-cream-400/50 border border-cream-600/70 text-forest-900 font-semibold focus:outline-none focus:border-emerald-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="NORMAL_PROCESSING">Normal Processing</option>
          </select>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="overflow-x-auto rounded-xl border border-cream-600/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-cream-400/80 text-forest-900 font-extrabold border-b border-cream-600/80 uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Claim ID</th>
              <th
                onClick={() => toggleSort("incident_date")}
                className="py-3 px-4 cursor-pointer hover:text-emerald-950 transition"
              >
                <div className="flex items-center space-x-1">
                  <span>Incident Date</span>
                  {sortField === "incident_date" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-forest-800/40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4">Claimant & Policy</th>
              <th
                onClick={() => toggleSort("claimed_amount")}
                className="py-3 px-4 cursor-pointer hover:text-emerald-950 transition"
              >
                <div className="flex items-center space-x-1">
                  <span>Claim Amount</span>
                  {sortField === "claimed_amount" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-forest-800/40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => toggleSort("risk_score")}
                className="py-3 px-4 cursor-pointer hover:text-emerald-950 transition"
              >
                <div className="flex items-center space-x-1">
                  <span>Risk Score</span>
                  {sortField === "risk_score" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-forest-800/40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4">Top Adverse Signal</th>
              <th className="py-3 px-4">Workflow Status</th>
              <th className="py-3 px-4">Assigned Investigator</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-600/50">
            {sortedClaims.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-forest-700 italic">
                  No claims match the selected filter criteria.
                </td>
              </tr>
            ) : (
              sortedClaims.map((c) => {
                const effectiveScore = c.final_risk_score ?? c.risk_score ?? 0;
                const effectiveLevel = c.final_risk_level ?? c.risk_level ?? "LOW";
                const isOverridden = c.override_risk_score !== null && c.override_risk_score !== undefined;
                const isAnalyzing = analyzingClaimId === c.id;

                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectClaim(c.id)}
                    className="hover:bg-cream-300/60 transition cursor-pointer group"
                  >
                    {/* Claim ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-950 group-hover:text-emerald-700 transition">
                      {c.id}
                    </td>

                    {/* Incident Date */}
                    <td className="py-3.5 px-4 text-forest-800 font-mono text-[11px]">
                      {c.incident_date}
                    </td>

                    {/* Claimant & Policy */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-emerald-950">{c.claimant_name}</p>
                      <p className="text-[10px] font-mono text-forest-700">{c.policy_id}</p>
                    </td>

                    {/* Claim Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-950">
                      ${c.claimed_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Risk Score */}
                    <td className="py-3.5 px-4">
                      {getRiskScoreBadge(effectiveScore, effectiveLevel, isOverridden)}
                    </td>

                    {/* Top Signal */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <span
                        className="text-[11px] font-mono text-forest-900 bg-cream-400/80 px-2 py-0.5 rounded border border-cream-700 inline-block truncate max-w-[190px]"
                        title={c.top_signal || "PENDING_ANALYSIS"}
                      >
                        {c.top_signal || "PENDING_ANALYSIS"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getWorkflowBadge(c.status)}
                    </td>

                    {/* Investigator */}
                    <td className="py-3.5 px-4 text-forest-800 text-[11px] font-medium">
                      {c.assigned_investigator || "SIU Triaging Pool"}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onAnalyzeClaim(c.id)}
                          disabled={isAnalyzing}
                          className="px-2.5 py-1 rounded-lg bg-forest-800/10 hover:bg-forest-800/20 text-forest-800 border border-forest-800/30 text-[11px] font-bold transition flex items-center space-x-1"
                          title="Run Multi-Agent Analysis"
                        >
                          <Play className={`w-3 h-3 ${isAnalyzing ? "animate-spin text-emerald-600" : ""}`} />
                          <span>{isAnalyzing ? "Analyzing..." : "Run AI"}</span>
                        </button>

                        <button
                          onClick={() => onSelectClaim(c.id)}
                          className="p-1.5 rounded-lg hover:bg-cream-400 text-forest-800 transition"
                          title="Open Investigation Dossier"
                        >
                          <ChevronRight className="w-4 h-4 text-emerald-900" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
