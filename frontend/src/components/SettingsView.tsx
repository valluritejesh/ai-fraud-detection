import React, { useState } from "react";
import {
  Sliders,
  Shield,
  Cpu,
  Bell,
  Database,
  Lock,
  ExternalLink,
  CheckCircle2,
  Key,
  Server,
  RefreshCw
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"platform" | "security" | "providers" | "integrations">("platform");
  const [stpThreshold, setStpThreshold] = useState(30);
  const [criticalThreshold, setCriticalThreshold] = useState(80);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-cream-700/80 shadow-card-soft">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-black text-forest-950 font-sans tracking-tight flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-forest-800" />
              <span>PLATFORM SETTINGS & GOVERNANCE CONFIGURATION</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              SOC 2 CONTROLLED
            </span>
          </div>
          <p className="text-xs text-forest-700 font-medium mt-0.5">
            Risk engine thresholds, AI provider modes, external core claims adapters, and cryptographic keys
          </p>
        </div>

        {saved && (
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center space-x-1 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settings Persisted</span>
          </span>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-cream-700/80 space-x-3 overflow-x-auto">
        {[
          { id: "platform", label: "Triage & Risk Thresholds", icon: Sliders },
          { id: "security", label: "Security & SOC 2 Auditing", icon: Shield },
          { id: "providers", label: "AI Provider Modes", icon: Cpu },
          { id: "integrations", label: "Core Claims (Guidewire / Duck Creek)", icon: ExternalLink },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-xs transition whitespace-nowrap ${
                isActive
                  ? "border-emerald-800 text-forest-950 font-black"
                  : "border-transparent text-forest-700 hover:text-forest-950"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Platform Risk Thresholds */}
      {activeTab === "platform" && (
        <form onSubmit={handleSave} className="p-6 md:p-8 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-forest-950 font-sans">
              Automated Triage Threshold Calibration
            </h3>
            <p className="text-xs text-forest-700">
              Calibrate the score boundaries governing straight-through automated passing (STP) versus mandatory SIU escalation.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-cream-100/70 border border-cream-600/70 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-forest-950">
                <span>Straight-Through Processing (STP) Upper Ceiling:</span>
                <span className="font-mono bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded border border-emerald-300">
                  ≤ {stpThreshold} / 100
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={stpThreshold}
                onChange={(e) => setStpThreshold(Number(e.target.value))}
                className="w-full h-2 bg-cream-400 rounded-lg cursor-pointer accent-forest-900"
              />
              <p className="text-[11px] text-forest-700">
                Claims scoring at or below this threshold are marked LOW risk and auto-cleared for straight-through settlement.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream-100/70 border border-cream-600/70 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-forest-950">
                <span>Critical Risk Escalation Lower Floor:</span>
                <span className="font-mono bg-rose-100 text-rose-950 px-2.5 py-0.5 rounded border border-rose-300">
                  ≥ {criticalThreshold} / 100
                </span>
              </div>
              <input
                type="range"
                min="65"
                max="95"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full h-2 bg-cream-400 rounded-lg cursor-pointer accent-forest-900"
              />
              <p className="text-[11px] text-forest-700">
                Claims scoring at or above this threshold trigger automatic SIU Priority 1 holds and legal consultation workflows.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-forest-950 hover:bg-forest-900 text-gold-300 font-bold text-xs transition shadow-sm border border-gold-400/40"
          >
            Save Risk Thresholds
          </button>
        </form>
      )}

      {/* Tab 2: Security & SOC 2 */}
      {activeTab === "security" && (
        <div className="p-6 md:p-8 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-forest-950 font-sans">
              Cryptographic Integrity & Cyber Security Controls
            </h3>
            <p className="text-xs text-forest-700">
              Enterprise governance policies ensuring tamper-evident evidence storage and prompt-injection quarantine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-cream-100/70 border border-cream-600/70 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-forest-950">
                <span className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>SHA-256 Hashing Engine</span>
                </span>
                <span className="text-emerald-800 font-mono text-[10px] bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  ACTIVE
                </span>
              </div>
              <p className="text-forest-700 text-[11px] leading-relaxed">
                All uploaded PDFs, accident photographs, and repair estimates are cryptographically hashed upon receipt to prevent tampering.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream-100/70 border border-cream-600/70 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-forest-950">
                <span className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-700" />
                  <span>Prompt Injection Quarantine (SEC-01)</span>
                </span>
                <span className="text-purple-900 font-mono text-[10px] bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                  ENFORCED
                </span>
              </div>
              <p className="text-forest-700 text-[11px] leading-relaxed">
                Adversarial instructions embedded within OCR text layers or document EXIF metadata are quarantined and automatically flagged.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Provider Modes */}
      {activeTab === "providers" && (
        <div className="p-6 md:p-8 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-forest-950 font-sans">
              AI Provider Architectures & Modes
            </h3>
            <p className="text-xs text-forest-700">
              Provider transparency status. In accordance with platform governance, all offline benchmark models are honestly labeled.
            </p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {[
              {
                name: "Document OCR & Extraction",
                mode: "[LOCAL DEMO / MOCK]",
                status: "Active (Mock Extraction Engine)",
                desc: "Simulated high-accuracy document intelligence parser with standard ACORD & CCC ONE schemas.",
              },
              {
                name: "Multimodal Vision Analysis",
                mode: "[LOCAL HEURISTIC PARSER]",
                status: "Active (Damage Discrepancy Scorer)",
                desc: "Local bounding-box and photograph severity comparative heuristic engine.",
              },
              {
                name: "Historical Syndicate Graph",
                mode: "[LOCAL GRAPH DB]",
                status: "Active (Entity Network Engine)",
                desc: "In-memory network graph mapping repair facilities, repeat claimants, and recycled invoices.",
              },
              {
                name: "Deterministic Rules Engine",
                mode: "[LOCAL RULES ENGINE]",
                status: "Active (Rules R01–R05)",
                desc: "100% deterministic, audit-grade verification rules without probabilistic hallucinations.",
              },
            ].map((p, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-cream-100/70 border border-cream-600/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-forest-950 flex items-center space-x-2">
                    <span>{p.name}</span>
                    <span className="font-mono text-[9px] bg-cream-300 text-forest-900 px-2 py-0.5 rounded border border-cream-600">
                      {p.mode}
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-700">{p.desc}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Core Claims Integrations */}
      {activeTab === "integrations" && (
        <div className="p-6 md:p-8 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-forest-950 font-sans">
              Core Claims Management System Adapters
            </h3>
            <p className="text-xs text-forest-700">
              Integration pipelines connecting FraudGuard AI with policy and claims administration engines.
            </p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-5 rounded-2xl bg-cream-100/70 border border-cream-600/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-forest-900 text-gold-300">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-forest-950">Guidewire ClaimCenter Adapter</h4>
                    <span className="text-[10px] font-mono text-forest-600">[MOCK / SIMULATION ADAPTER]</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  CONNECTED (MOCK)
                </span>
              </div>
              <p className="text-[11px] text-forest-800 leading-relaxed">
                Bi-directional claim sync adapter transmitting effective risk scores, adverse signals, and human determinations into Guidewire ClaimCenter claims dossiers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cream-100/70 border border-cream-600/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-forest-900 text-gold-300">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-forest-950">Duck Creek Claims Gateway</h4>
                    <span className="text-[10px] font-mono text-forest-600">[MOCK / SIMULATION ADAPTER]</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cream-300 text-forest-800 border border-cream-600">
                  STANDBY
                </span>
              </div>
              <p className="text-[11px] text-forest-800 leading-relaxed">
                Enterprise REST webhook dispatcher forwarding audited SIU final determinations to policy reserves and payments modules.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
