import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { MetricsCards } from "./components/MetricsCards";
import { ClaimQueue } from "./components/ClaimQueue";
import { ClaimDetailView } from "./components/ClaimDetailView";
import { ClaimIntakeModal } from "./components/ClaimIntakeModal";
import { SystemHealthView } from "./components/SystemHealthView";
import { claimsApi } from "./services/api";
import { Claim, ClaimDetail } from "./types";
import { Sparkles } from "lucide-react";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<"dashboard" | "new_claim" | "health">("dashboard");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [selectedClaimDetail, setSelectedClaimDetail] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingClaimId, setAnalyzingClaimId] = useState<string | null>(null);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await claimsApi.listClaims();
      setClaims(data);
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimDetail = async (id: string) => {
    try {
      const detail = await claimsApi.getClaim(id);
      setSelectedClaimDetail(detail);
      setSelectedClaimId(id);
    } catch (err) {
      console.error("Failed to load claim detail:", err);
    }
  };

  const handleAnalyzeClaim = async (id: string) => {
    setAnalyzingClaimId(id);
    try {
      const updated = await claimsApi.analyzeClaim(id);
      if (selectedClaimId === id) {
        setSelectedClaimDetail(updated);
      }
      await fetchClaims();
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setAnalyzingClaimId(null);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const demoScenarios = [
    { id: "CLM-SCENARIO-A", label: "Scenario A: Legit (Low)", color: "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" },
    { id: "CLM-SCENARIO-B", label: "Scenario B: Recycled (Crit)", color: "border-rose-500/40 text-rose-400 hover:bg-rose-500/10" },
    { id: "CLM-SCENARIO-C", label: "Scenario C: Date Conflict (High)", color: "border-orange-500/40 text-orange-400 hover:bg-orange-500/10" },
    { id: "CLM-SCENARIO-D", label: "Scenario D: Ghost Repair (High)", color: "border-orange-500/40 text-orange-400 hover:bg-orange-500/10" },
    { id: "CLM-SCENARIO-E", label: "Scenario E: Recycled Hash (High)", color: "border-orange-500/40 text-orange-400 hover:bg-orange-500/10" },
    { id: "CLM-SCENARIO-F", label: "Scenario F: Velocity & Injection (High)", color: "border-orange-500/40 text-orange-400 hover:bg-orange-500/10" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === "new_claim") {
            setIsIntakeModalOpen(true);
          } else {
            setCurrentTab(tab);
            setSelectedClaimId(null);
            setSelectedClaimDetail(null);
          }
        }}
        onRefresh={() => {
          fetchClaims();
          if (selectedClaimId) fetchClaimDetail(selectedClaimId);
        }}
        isRefreshing={loading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === "dashboard" && (
          <>
            {/* Demo Quick Jumper Ribbon */}
            <div className="mb-6 bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  DEMO MODE
                </span>
                <span className="text-slate-300 font-medium">Evaluation Scenarios:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {demoScenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => fetchClaimDetail(s.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${s.color} ${selectedClaimId === s.id ? "bg-slate-800 ring-1 ring-white/20" : ""}`}
                    title={`Jump directly to ${s.id}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedClaimDetail ? (
              <ClaimDetailView
                claim={selectedClaimDetail}
                onBack={() => {
                  setSelectedClaimId(null);
                  setSelectedClaimDetail(null);
                  fetchClaims();
                }}
                onRefresh={() => {
                  if (selectedClaimId) fetchClaimDetail(selectedClaimId);
                  fetchClaims();
                }}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                      Fraud Investigation Command Center
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Multi-agent multimodal risk triaging, cross-evidence conflict detection, and human-in-the-loop review.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsIntakeModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-blue-600/20"
                  >
                    + Submit New Claim
                  </button>
                </div>

                <MetricsCards claims={claims} />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                      Claims Queue ({claims.length})
                    </h2>
                    <span className="text-xs text-slate-500">
                      Click any row to open the complete investigation dossier
                    </span>
                  </div>
                  <ClaimQueue
                    claims={claims}
                    onSelectClaim={(id) => fetchClaimDetail(id)}
                    onAnalyzeClaim={handleAnalyzeClaim}
                    analyzingClaimId={analyzingClaimId}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {currentTab === "health" && <SystemHealthView />}
      </main>

      <ClaimIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onSuccess={(newClaimId) => {
          fetchClaims();
          fetchClaimDetail(newClaimId);
          setCurrentTab("dashboard");
        }}
      />
    </div>
  );
};
