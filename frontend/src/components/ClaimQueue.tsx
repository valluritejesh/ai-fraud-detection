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
  UserCheck,
  CheckSquare,
  Square,
  MoreVertical,
  Eye
} from "lucide-react";
import { Claim } from "../types";

interface ClaimQueueProps {
  claims: Claim[];
  onSelectClaim: (claimId: string) => void;
  onAnalyzeClaim: (claimId: string) => void;
  analyzingClaimId?: string | null;
  onSubmitNewClaim?: () => void;
  searchQuery?: string;
}

type SortField = "incident_date" | "claimed_amount" | "risk_score";
type SortOrder = "asc" | "desc";

export const ClaimQueue: React.FC<ClaimQueueProps> = ({
  claims,
  onSelectClaim,
  onAnalyzeClaim,
  analyzingClaimId,
  onSubmitNewClaim,
  searchQuery = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("risk_score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClaims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClaims.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const activeSearch = (searchQuery || searchTerm).toLowerCase();

  const filteredClaims = claims.filter((c) => {
    const matchesSearch =
      !activeSearch ||
      c.id.toLowerCase().includes(activeSearch) ||
      c.claimant_name.toLowerCase().includes(activeSearch) ||
      c.policy_id.toLowerCase().includes(activeSearch) ||
      c.vehicle_vin.toLowerCase().includes(activeSearch) ||
      (c.top_signal && c.top_signal.toLowerCase().includes(activeSearch)) ||
      (c.assigned_investigator && c.assigned_investigator.toLowerCase().includes(activeSearch));

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

  const getRiskScoreVisual = (score: number, level: string, hasOverride: boolean) => {
    let badgeClass = "bg-emerald-100 text-emerald-900 border-emerald-300";
    let barColor = "bg-emerald-500";

    if (level === "CRITICAL" || score >= 80) {
      badgeClass = "bg-rose-100 text-rose-950 border-rose-300 shadow-sm";
      barColor = "bg-rose-600";
    } else if (level === "HIGH" || score >= 60) {
      badgeClass = "bg-orange-100 text-orange-950 border-orange-300";
      barColor = "bg-orange-500";
    } else if (level === "MEDIUM" || score > 30) {
      badgeClass = "bg-amber-100 text-amber-950 border-amber-300";
      barColor = "bg-amber-500";
    }

    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-black font-mono border ${badgeClass}`}>
            {Math.round(score)} {level}
          </span>
          {hasOverride && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-gold-400/20 text-gold-900 border border-gold-400 font-mono">
              OVERRIDE
            </span>
          )}
        </div>
        {/* Visual risk bar meter */}
        <div className="w-24 h-1.5 rounded-full bg-cream-500 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Approved</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      case "ESCALATED":
      case "REVIEW_REQUIRED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">SIU Escalated</span>;
      case "ANALYZED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">Triaged</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cream-300 text-forest-800 border border-cream-600">{status}</span>;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-cream-700/80 shadow-card-soft overflow-hidden transition-all">
      {/* Specular highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cream-500 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="p-5 border-b border-cream-600/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-black text-forest-950 font-sans tracking-tight">
              Claims Queue ({claims.length})
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cream-300 text-forest-800 font-mono text-[10px] font-bold">
              PORTFOLIO TRIAGE
            </span>
          </div>
          <p className="text-xs text-forest-700 font-medium mt-0.5">
            Review and investigate flagged claims across multimodal evidence
          </p>
        </div>

        {onSubmitNewClaim && (
          <button
            onClick={onSubmitNewClaim}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-forest-800 text-white font-bold text-xs shadow-md hover:bg-emerald-700 active:scale-95 transition-all flex items-center space-x-1.5 border border-emerald-600/40 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-gold-300" />
            <span>+ Submit New Claim</span>
          </button>
        )}
      </div>

      {/* Filter & Search Ribbon */}
      <div className="p-4 bg-cream-100/50 border-b border-cream-600/70 flex flex-wrap items-center justify-between gap-3">
        {/* Risk Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 mr-1 font-mono">
            Risk:
          </span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                riskFilter === r
                  ? "bg-forest-900 text-white shadow-sm"
                  : "bg-white text-forest-800 hover:bg-cream-300/80 border border-cream-600/80"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Local Search input */}
        <div className="relative flex items-center w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 text-forest-700/60 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter within queue..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white border border-cream-600/80 text-forest-950 placeholder-forest-700/50 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-cream-200/50 border-b border-cream-600/70 text-[10px] uppercase font-bold text-forest-800 font-mono tracking-wider">
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredClaims.length}
                  onChange={toggleSelectAll}
                  className="rounded border-cream-600 text-emerald-700 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="p-3.5">Claim ID</th>
              <th className="p-3.5">Claimant / Policy</th>
              <th
                className="p-3.5 cursor-pointer hover:text-emerald-950 select-none"
                onClick={() => toggleSort("incident_date")}
              >
                <div className="flex items-center space-x-1">
                  <span>Incident Date</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:text-emerald-950 select-none"
                onClick={() => toggleSort("claimed_amount")}
              >
                <div className="flex items-center space-x-1">
                  <span>Claimed Amount</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:text-emerald-950 select-none"
                onClick={() => toggleSort("risk_score")}
              >
                <div className="flex items-center space-x-1">
                  <span>Risk Rating</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="p-3.5">Top Anomaly Signal</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-600/60">
            {sortedClaims.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-forest-700">
                  No claims match the active filters.
                </td>
              </tr>
            ) : (
              sortedClaims.map((claim) => {
                const effectiveScore = claim.final_risk_score ?? claim.risk_score;
                const effectiveLevel = claim.final_risk_level ?? claim.risk_level;
                const hasOverride = claim.override_risk_score !== null && claim.override_risk_score !== undefined;
                const isSelected = selectedIds.has(claim.id);
                const isAnalyzing = analyzingClaimId === claim.id;

                return (
                  <tr
                    key={claim.id}
                    onClick={() => onSelectClaim(claim.id)}
                    className={`cursor-pointer transition-all duration-150 group ${
                      isSelected ? "bg-cream-300/80" : "hover:bg-cream-200/50"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center" onClick={(e) => toggleSelectOne(claim.id, e)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-cream-600 text-emerald-700 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Claim ID */}
                    <td className="p-3.5 font-mono font-bold text-emerald-900 group-hover:text-emerald-700">
                      {claim.id}
                    </td>

                    {/* Claimant & Policy */}
                    <td className="p-3.5">
                      <div className="font-bold text-forest-950">{claim.claimant_name}</div>
                      <div className="text-[10px] text-forest-700 font-mono">{claim.policy_id}</div>
                    </td>

                    {/* Incident Date */}
                    <td className="p-3.5 font-mono text-forest-800 text-[11px]">
                      {claim.incident_date}
                    </td>

                    {/* Claimed Amount */}
                    <td className="p-3.5 font-mono font-black text-forest-950 text-xs">
                      ${claim.claimed_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Risk Score & Visual Meter */}
                    <td className="p-3.5">
                      {getRiskScoreVisual(effectiveScore, effectiveLevel, hasOverride)}
                    </td>

                    {/* Top Anomaly Signal */}
                    <td className="p-3.5">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cream-300/80 border border-cream-600 text-forest-900 truncate block max-w-[200px]">
                        {claim.top_signal || "NO_ADVERSE_SIGNALS"}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      {getStatusBadge(claim.status)}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onAnalyzeClaim(claim.id)}
                          disabled={isAnalyzing}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition flex items-center space-x-1"
                          title="Run Multi-Agent Triage"
                        >
                          <Play className={`w-2.5 h-2.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                          <span>{isAnalyzing ? "Triaging..." : "Triage"}</span>
                        </button>

                        <button
                          onClick={() => onSelectClaim(claim.id)}
                          className="p-1.5 rounded-lg bg-cream-200 hover:bg-cream-300 text-forest-900 border border-cream-600 transition"
                          title="View Full Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
