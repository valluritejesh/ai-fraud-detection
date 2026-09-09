import React, { useState } from "react";
import { Search, Filter, ChevronRight, Play, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Claim } from "../types";

interface ClaimQueueProps {
  claims: Claim[];
  onSelectClaim: (claimId: string) => void;
  onAnalyzeClaim: (claimId: string) => void;
  analyzingClaimId?: string | null;
}

type SortField = "incident_date" | "claimed_amount" | "risk_score";
type SortOrder = "asc" | "desc";

export const ClaimQueue: React.FC<ClaimQueueProps> = ({
  claims,
  onSelectClaim,
  onAnalyzeClaim,
  analyzingClaimId,
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

    const matchesRisk = riskFilter === "ALL" || c.risk_level === riskFilter;
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

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "LOW":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      default:
        return "bg-slate-700 text-slate-400 border-slate-600";
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 ml-1 inline" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-400 ml-1 inline" />
    );
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Claim ID, Claimant, Policy, VIN, Signal, Investigator..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="REVIEW_REQUIRED">Review Required (SIU)</option>
              <option value="NORMAL_PROCESSING">Normal Processing</option>
              <option value="CLAIM_RECEIVED">Claim Received</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold tracking-wider text-[11px] border-b border-slate-700/60">
            <tr>
              <th className="py-3 px-4">Claim ID</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white transition select-none"
                onClick={() => toggleSort("incident_date")}
              >
                Incident Date {renderSortIcon("incident_date")}
              </th>
              <th className="py-3 px-4">Claimant & Policy</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white transition select-none"
                onClick={() => toggleSort("claimed_amount")}
              >
                Claim Amount {renderSortIcon("claimed_amount")}
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white transition select-none"
                onClick={() => toggleSort("risk_score")}
              >
                Risk Score / Level {renderSortIcon("risk_score")}
              </th>
              <th className="py-3 px-4">Top Adverse Signal</th>
              <th className="py-3 px-4">Workflow Status</th>
              <th className="py-3 px-4">Assigned Investigator</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40 text-slate-200">
            {sortedClaims.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No claims found matching the filter criteria.
                </td>
              </tr>
            ) : (
              sortedClaims.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectClaim(c.id)}
                  className="hover:bg-slate-700/30 transition cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {c.id}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono">
                    {c.incident_date}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">{c.claimant_name}</p>
                    <p className="text-[10px] text-slate-400">{c.policy_id}</p>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    ${c.claimed_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${getRiskBadge(c.final_risk_level || c.risk_level)}`}>
                        {c.final_risk_level || c.risk_level} ({(c.final_risk_score ?? c.risk_score)?.toFixed(0)})
                      </span>
                      {c.override_risk_score !== null && c.override_risk_score !== undefined && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded border border-purple-500/30 font-semibold" title="Human override score applied">
                          OVERRIDE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700/60 max-w-[170px] inline-block truncate" title={c.top_signal || "None"}>
                      {c.top_signal || "NO_ADVERSE_SIGNALS"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-700 text-slate-300">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 text-[11px]">
                    {c.assigned_investigator || "Unassigned"}
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-2">
                      {c.status === "CLAIM_RECEIVED" && (
                        <button
                          onClick={() => onAnalyzeClaim(c.id)}
                          disabled={analyzingClaimId === c.id}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-[11px] font-semibold border border-blue-500/30 flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>{analyzingClaimId === c.id ? "Analyzing..." : "Run AI"}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectClaim(c.id)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        title="Open Investigation Dossier"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
