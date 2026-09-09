import React, { useState } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Plus,
  Filter,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  FileText,
  AlertTriangle,
  Flame,
  Scale
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
      (statusFilter === "REVIEW_REQUIRED" &&
        (c.status === "REVIEW_REQUIRED" ||
          c.status === "HUMAN_REVIEW" ||
          c.status === "IN_REVIEW" ||
          c.status === "ESCALATED")) ||
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

  // Compact visual score representation
  const renderVisualRiskScore = (score: number, level: string, hasOverride: boolean) => {
    let barColor = "bg-emerald-500";
    let badgeStyle = "bg-emerald-100 text-emerald-900 border-emerald-300";
    let dotPulse = "";

    if (level === "CRITICAL" || score >= 80) {
      barColor = "bg-rose-600";
      badgeStyle = "bg-rose-100 text-rose-950 border-rose-300 shadow-sm";
      dotPulse = "bg-rose-600 animate-ping";
    } else if (level === "HIGH" || score >= 60) {
      barColor = "bg-orange-500";
      badgeStyle = "bg-orange-100 text-orange-950 border-orange-300";
    } else if (level === "MEDIUM" || score > 30) {
      barColor = "bg-amber-500";
      badgeStyle = "bg-amber-100 text-amber-950 border-amber-300";
    }

    return (
      <div className="flex flex-col space-y-1.5 min-w-[110px]">
        <div className="flex items-center space-x-1.5">
          <span className={`px-2 py-0.5 rounded text-[11px] font-black font-mono border flex items-center space-x-1 ${badgeStyle}`}>
            {dotPulse && <span className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${dotPulse}`} />}
            <span>{Math.round(score)}</span>
            <span className="text-[9px] opacity-75">{level}</span>
          </span>
          {hasOverride && (
            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-gold-400/20 text-gold-900 border border-gold-400 font-mono tracking-tight" title="Human investigator override active">
              OVERRIDE
            </span>
          )}
        </div>
        {/* Compact Segmented Progress Meter */}
        <div className="w-full h-1.5 rounded-full bg-cream-400/70 overflow-hidden flex">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>Approved</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-950 border border-rose-300 font-mono">
            <XCircle className="w-3 h-3 text-rose-700" />
            <span>Rejected</span>
          </span>
        );
      case "ESCALATED":
      case "REVIEW_REQUIRED":
      case "HUMAN_REVIEW":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-950 border border-purple-300 font-mono">
            <Scale className="w-3 h-3 text-purple-700" />
            <span>SIU Review</span>
          </span>
        );
      case "ANALYZED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300 font-mono">
            <Clock className="w-3 h-3 text-teal-700" />
            <span>Triaged</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cream-300 text-forest-800 border border-cream-600 font-mono">
            <span>{status}</span>
          </span>
        );
    }
  };

  const renderSignalBadge = (signal: string | null) => {
    if (!signal) {
      return <span className="text-forest-600/70 font-mono text-[11px]">—</span>;
    }

    const isCritical =
      signal.includes("EXCESSIVE") ||
      signal.includes("DUPLICATE") ||
      signal.includes("INJECTION") ||
      signal.includes("MISMATCH");

    return (
      <span
        className={`inline-flex items-center max-w-[190px] truncate px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${
          isCritical
            ? "bg-rose-50 text-rose-950 border-rose-200"
            : "bg-amber-50 text-amber-950 border-amber-200"
        }`}
        title={signal}
      >
        <span className="truncate">{signal}</span>
      </span>
    );
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-cream-700/80 shadow-[0_8px_32px_rgba(11,79,66,0.06)] overflow-hidden transition-all relative">
      {/* Specular highlight edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="p-5 md:p-6 border-b border-cream-600/70 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cream-100/40 via-white to-white">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg md:text-xl font-black text-forest-950 font-sans tracking-tight">
              CLAIMS QUEUE
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-forest-900/10 text-forest-900 border border-forest-700/20 font-mono text-xs font-black">
              {filteredClaims.length} / {claims.length}
            </span>
          </div>
          <p className="text-xs text-forest-700 font-medium mt-0.5">
            Review and investigate flagged claims
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {onSubmitNewClaim && (
            <button
              onClick={onSubmitNewClaim}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-forest-800 hover:from-emerald-700 hover:to-forest-700 text-white font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition-all flex items-center space-x-1.5 border border-emerald-600/40 shrink-0"
            >
              <Plus className="w-4 h-4 text-gold-300" />
              <span>+ Submit New Claim</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-cream-100/60 border-b border-cream-600/70 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700/60 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Claim ID, Claimant, Policy, VIN, Signal..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-white border border-cream-600/80 text-forest-950 placeholder-forest-700/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                showAdvancedFilters
                  ? "bg-forest-900 text-white border-forest-900"
                  : "bg-white text-forest-800 border-cream-600/80 hover:bg-cream-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Risk Level Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-forest-700 mr-1 font-mono">
              Risk:
            </span>
            {[
              { id: "ALL", label: "All Risk Levels" },
              { id: "CRITICAL", label: "Critical" },
              { id: "HIGH", label: "High" },
              { id: "MEDIUM", label: "Medium" },
              { id: "LOW", label: "Low" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRiskFilter(r.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  riskFilter === r.id
                    ? "bg-forest-950 text-white shadow-sm"
                    : "bg-white/80 text-forest-800 hover:bg-white border border-cream-600/80"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Status Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-forest-700 mr-1 font-mono">
              Status:
            </span>
            {[
              { id: "ALL", label: "All Statuses" },
              { id: "REVIEW_REQUIRED", label: "SIU Review" },
              { id: "ANALYZED", label: "Triaged" },
              { id: "APPROVED", label: "Approved" },
              { id: "REJECTED", label: "Rejected" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  statusFilter === s.id
                    ? "bg-forest-950 text-white shadow-sm"
                    : "bg-white/80 text-forest-800 hover:bg-white border border-cream-600/80"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-cream-200/50 border-b border-cream-600/70 text-[10px] uppercase font-black text-forest-800 font-mono tracking-wider">
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredClaims.length}
                  onChange={toggleSelectAll}
                  className="rounded border-cream-600 text-emerald-700 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="p-3.5">CLAIM ID</th>
              <th
                className="p-3.5 cursor-pointer hover:text-emerald-950 select-none"
                onClick={() => toggleSort("incident_date")}
              >
                <div className="flex items-center space-x-1">
                  <span>INCIDENT DATE</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="p-3.5">CLAIMANT & POLICY</th>
              <th
                className="p-3.5 cursor-pointer hover:text-emerald-950 select-none"
                onClick={() => toggleSort("claimed_amount")}
              >
                <div className="flex items-center space-x-1">
                  <span>CLAIM AMOUNT</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:text-emerald-950 select-none"
                onClick={() => toggleSort("risk_score")}
              >
                <div className="flex items-center space-x-1">
                  <span>RISK SCORE</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="p-3.5">TOP ADVERSE SIGNAL</th>
              <th className="p-3.5">WORKFLOW STATUS</th>
              <th className="p-3.5">ASSIGNED INVESTIGATOR</th>
              <th className="p-3.5 text-right pr-5">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-600/60 bg-white/40">
            {sortedClaims.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-12 text-center text-forest-700">
                  <div className="max-w-xs mx-auto space-y-2">
                    <FileText className="w-8 h-8 text-cream-600 mx-auto" />
                    <p className="font-bold text-sm text-forest-950">No matching claims found</p>
                    <p className="text-xs text-forest-700">
                      Try adjusting search terms or resetting risk filters
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setRiskFilter("ALL");
                        setStatusFilter("ALL");
                      }}
                      className="mt-2 text-xs font-bold text-emerald-800 underline"
                    >
                      Reset all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedClaims.map((claim) => {
                const isSelected = selectedIds.has(claim.id);
                const score = claim.final_risk_score ?? claim.risk_score ?? 0;
                const level = claim.final_risk_level ?? claim.risk_level ?? "UNASSESSED";
                const hasOverride =
                  claim.override_risk_score !== null && claim.override_risk_score !== undefined;
                const isAnalyzing = analyzingClaimId === claim.id;

                return (
                  <tr
                    key={claim.id}
                    onClick={() => onSelectClaim(claim.id)}
                    className={`group transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? "bg-emerald-50/60 hover:bg-emerald-50/90"
                        : "hover:bg-cream-100/80 hover:shadow-sm"
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
                    <td className="p-3.5 font-mono font-black text-forest-950">
                      <div className="flex items-center space-x-1.5">
                        <span className="group-hover:text-emerald-800 transition-colors">
                          {claim.id}
                        </span>
                        {claim.id.includes("SCENARIO") && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-gold-400/20 text-gold-900 border border-gold-400 font-mono">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-forest-600 font-normal font-sans">
                        {claim.vehicle_year} {claim.vehicle_make} {claim.vehicle_model}
                      </div>
                    </td>

                    {/* Incident Date */}
                    <td className="p-3.5 font-mono text-forest-800 whitespace-nowrap">
                      {claim.incident_date}
                    </td>

                    {/* Claimant & Policy */}
                    <td className="p-3.5">
                      <div className="font-bold text-forest-950">{claim.claimant_name}</div>
                      <div className="text-[10px] font-mono text-forest-600">{claim.policy_id}</div>
                    </td>

                    {/* Claim Amount */}
                    <td className="p-3.5 font-mono font-bold text-forest-950">
                      ${claim.claimed_amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </td>

                    {/* Visual Risk Score */}
                    <td className="p-3.5">
                      {renderVisualRiskScore(score, level, hasOverride)}
                    </td>

                    {/* Top Adverse Signal */}
                    <td className="p-3.5">
                      {renderSignalBadge(claim.top_signal)}
                    </td>

                    {/* Workflow Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      {renderStatusBadge(claim.status)}
                    </td>

                    {/* Assigned Investigator */}
                    <td className="p-3.5 text-forest-800">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-full bg-forest-900/10 flex items-center justify-center text-[10px] font-black text-forest-900">
                          {(claim.assigned_investigator || "U").charAt(0)}
                        </div>
                        <span className="font-medium text-xs">
                          {claim.assigned_investigator || "Unassigned"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right pr-5">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Quick Analyze Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAnalyzeClaim(claim.id);
                          }}
                          disabled={isAnalyzing}
                          title="Re-run AI Multi-Agent Triage"
                          className="p-1.5 rounded-lg bg-white hover:bg-cream-300 text-forest-800 border border-cream-600/80 shadow-2xs transition"
                        >
                          <Play className={`w-3 h-3 text-emerald-700 ${isAnalyzing ? "animate-spin" : ""}`} />
                        </button>

                        {/* View Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClaim(claim.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-forest-950 group-hover:bg-emerald-900 text-white font-bold text-[11px] flex items-center space-x-1 shadow-sm transition-all"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
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

      {/* Footer bar of table */}
      <div className="p-4 bg-cream-100/40 border-t border-cream-600/70 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-700 gap-2">
        <span className="font-mono text-[11px]">
          Showing {sortedClaims.length} of {claims.length} claims · Sorted by {sortField} ({sortOrder})
        </span>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Critical ≥ 80</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>High ≥ 60</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Low ≤ 30</span>
          </span>
        </div>
      </div>
    </div>
  );
};
