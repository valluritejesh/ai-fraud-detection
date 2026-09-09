import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { DemoScenarioBar } from "./components/DemoScenarioBar";
import { MetricsCards } from "./components/MetricsCards";
import { ClaimQueue } from "./components/ClaimQueue";
import { RightIntelligencePanels } from "./components/RightIntelligencePanels";
import { ClaimDetailView } from "./components/ClaimDetailView";
import { ClaimIntakeModal } from "./components/ClaimIntakeModal";
import { SystemHealthView } from "./components/SystemHealthView";
import { claimsApi } from "./services/api";
import { Claim, ClaimDetail } from "./types";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [selectedClaimDetail, setSelectedClaimDetail] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzingClaimId, setAnalyzingClaimId] = useState<string | null>(null);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewScenarioId, setPreviewScenarioId] = useState<string>("CLM-SCENARIO-B");

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
    setLoading(true);
    try {
      const detail = await claimsApi.getClaim(id);
      setSelectedClaimDetail(detail);
      setSelectedClaimId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Failed to load claim detail:", err);
    } finally {
      setLoading(false);
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

  const handleSelectTab = (tab: string) => {
    if (tab === "new_claim") {
      setIsIntakeModalOpen(true);
      return;
    }

    setCurrentTab(tab);

    if (tab === "investigations") {
      if (!selectedClaimDetail && claims.length > 0) {
        // Pick the active scenario or first high risk claim
        const target =
          claims.find((c) => c.id === previewScenarioId) ||
          claims.find((c) => c.id === "CLM-SCENARIO-B") ||
          claims[0];
        fetchClaimDetail(target.id);
      }
    } else {
      setSelectedClaimId(null);
      setSelectedClaimDetail(null);
    }
  };

  const criticalCount = claims.filter(
    (c) =>
      (c.final_risk_level ?? c.risk_level) === "CRITICAL" ||
      (c.final_risk_level ?? c.risk_level) === "HIGH"
  ).length;

  const featuredClaim =
    claims.find((c) => c.id === previewScenarioId) ||
    claims.find((c) => c.id === "CLM-SCENARIO-B") ||
    claims[0] ||
    null;

  return (
    <div className="min-h-screen bg-cream-500 flex flex-row font-sans text-forest-900 selection:bg-gold-200 selection:text-forest-900">
      {/* Left Persistent Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        claimCount={claims.length}
        investigationCount={criticalCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Floating Top Header */}
        <Header
          onRefresh={() => {
            fetchClaims();
            if (selectedClaimId) fetchClaimDetail(selectedClaimId);
          }}
          isRefreshing={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 md:p-5 lg:p-6 max-w-[1720px] w-full mx-auto space-y-5">
          {/* Claim Detail Dossier Workspace */}
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
          ) : currentTab === "health" ? (
            <SystemHealthView />
          ) : (
            <>
              {/* Demo Scenario Jumper Bar */}
              <DemoScenarioBar
                onSelectScenario={(scenarioId) => setPreviewScenarioId(scenarioId)}
                onOpenDossier={(scenarioId) => fetchClaimDetail(scenarioId)}
                activeScenarioId={previewScenarioId}
              />

              {/* Luxury 3D AI Hero Section */}
              {currentTab === "dashboard" && (
                <HeroSection
                  onSubmitClaim={() => setIsIntakeModalOpen(true)}
                  onExploreScenarios={() => {
                    const el = document.getElementById("demo-scenarios-bar");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  onOpenDossier={(claimId) => fetchClaimDetail(claimId)}
                  featuredClaim={featuredClaim}
                />
              )}

              {/* 6 Floating KPI Cards with Trends & Micro Sparklines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-forest-950 font-mono">
                      Portfolio Performance & Exposure Intelligence
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-forest-700">
                    Real-time multi-agent consensus metrics
                  </span>
                </div>
                <MetricsCards claims={claims} />
              </div>

              {/* Primary Workspace Grid: Claims Queue (Left) + Intelligence Panels (Right) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* Claims Queue Table (8 cols on XL) */}
                <div className="xl:col-span-8 space-y-4">
                  <ClaimQueue
                    claims={claims}
                    searchQuery={searchQuery}
                    onSelectClaim={(id) => fetchClaimDetail(id)}
                    onAnalyzeClaim={handleAnalyzeClaim}
                    analyzingClaimId={analyzingClaimId}
                    onSubmitNewClaim={() => setIsIntakeModalOpen(true)}
                  />
                </div>

                {/* Right Intelligence Panels (4 cols on XL) */}
                <div className="xl:col-span-4 space-y-5">
                  <RightIntelligencePanels
                    onSelectAgentStatus={() => setCurrentTab("health")}
                    onSelectAuditLog={() => setCurrentTab("health")}
                  />
                </div>
              </div>
            </>
          )}
        </main>

        {/* Executive Footer */}
        <footer className="mt-auto border-t border-cream-700/80 bg-white/80 backdrop-blur-md px-8 py-3.5 text-xs text-forest-700 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 font-medium">
            <span className="font-extrabold text-forest-950">FraudGuard AI Enterprise v2.4</span>
            <span className="text-cream-700">·</span>
            <span>Multi-Agent Multimodal Claims Defense Platform</span>
            <span className="text-cream-700">·</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 font-mono">
              Audit Grade
            </span>
          </div>
          <div className="text-[11px] text-forest-600 font-mono">
            Powered by Document, Vision, Pattern, Rules & Risk Agents · ISO 27001 & SOC 2 Type II
          </div>
        </footer>
      </div>

      {/* Claim Intake Modal */}
      <ClaimIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onSuccess={(newClaimId) => {
          fetchClaims();
          fetchClaimDetail(newClaimId);
        }}
      />
    </div>
  );
};
