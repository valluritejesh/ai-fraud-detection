import React from "react";
import {
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Car,
  FileText,
  Camera,
  FileSpreadsheet,
  UserCheck,
  Zap,
  Cpu
} from "lucide-react";
import { Claim } from "../types";

interface HeroSectionProps {
  onSubmitClaim: () => void;
  onExploreScenarios?: () => void;
  featuredClaim?: Claim | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSubmitClaim,
  onExploreScenarios,
  featuredClaim,
}) => {
  // Use real data from featured claim (defaults to Scenario B values if loading)
  const score = featuredClaim ? Math.round(featuredClaim.risk_score) : 85;
  const level = featuredClaim ? (featuredClaim.final_risk_level ?? featuredClaim.risk_level) : "CRITICAL";
  const claimId = featuredClaim ? featuredClaim.id : "CLM-SCENARIO-B";
  const topSignal = featuredClaim?.top_signal || "Excessive Claim-to-Value (R01)";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-forest-950 to-emerald-900 border border-emerald-700/50 shadow-2xl text-white p-6 md:p-8 lg:p-9 mb-7">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0B5D4F15_1px,transparent_1px),linear-gradient(to_bottom,#0B5D4F15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Enterprise Positioning & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-900/80 border border-gold-400/40 text-gold-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-pulse" />
            <span className="tracking-wide">AI-Powered Multi-Agent Fraud Intelligence</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-white">Fraud </span>
            <span className="text-gold-300 drop-shadow-[0_0_15px_rgba(217,164,65,0.3)]">Stops </span>
            <span className="text-white">Here.</span>
          </h1>

          {/* Subheading */}
          <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed max-w-lg">
            AI-powered multimodal investigation. Cross-evidence consistency verification. Human judgment. Real enterprise impact.
          </p>

          {/* Multi-Step Pipeline Flow */}
          <div className="pt-1 pb-1">
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-300/90 uppercase tracking-wider overflow-x-auto pb-1">
              <span className="px-2 py-0.5 rounded bg-emerald-900/70 border border-emerald-700/50">Documents</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-900/70 border border-emerald-700/50">AI Extraction</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-900/70 border border-emerald-700/50">Verification</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-900/70 border border-emerald-700/50">Risk Triage</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-300 border border-gold-400/40 font-bold">Human SIU</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onSubmitClaim}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 text-forest-950 font-bold text-xs shadow-lg shadow-gold-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center space-x-2 border border-gold-300"
            >
              <span>+ Submit Claim for AI Triaging</span>
              <ArrowUpRight className="w-4 h-4 text-forest-950" />
            </button>

            {onExploreScenarios && (
              <button
                onClick={onExploreScenarios}
                className="px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/70 border border-emerald-600/50 text-white font-semibold text-xs transition-all flex items-center space-x-2 hover:border-gold-400/60"
              >
                <span>Explore Demo Matrix (A–F)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gold-400/20 text-gold-300 font-mono">6 CASES</span>
              </button>
            )}
          </div>

          {/* Micro Trust Proof */}
          <div className="pt-2 flex items-center space-x-4 text-[11px] text-emerald-300/70">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>6 Multimodal Agents</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deterministic R01–R05</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SOC 2 Type II</span>
            </span>
          </div>
        </div>

        {/* Right Side: Grand 3D AI Multimodal Investigation Scene (7 cols) */}
        <div className="lg:col-span-7 relative min-h-[380px] flex items-center justify-center perspective-1200">
          <div className="relative w-full max-w-xl h-[370px] preserve-3d floating-3d-scene">
            {/* Center Background: Cyber Hologram Grid */}
            <div className="absolute inset-x-8 inset-y-6 rounded-3xl bg-gradient-to-tr from-emerald-900/40 via-forest-900/30 to-teal-900/30 border border-emerald-500/20 backdrop-blur-sm -z-10 shadow-inner" />

            {/* Central 3D AI Shield / Neural Core Processor */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-700 via-forest-900 to-emerald-950 border-2 border-gold-400/60 shadow-[0_0_35px_rgba(16,185,129,0.35)] animate-float-slow">
                {/* Concentric rotating energy rings */}
                <div className="absolute -inset-2 rounded-full border border-emerald-400/30 border-dashed animate-spin [animation-duration:18s]" />
                <div className="absolute -inset-4 rounded-full border border-gold-400/20 border-dotted animate-spin [animation-duration:26s] [animation-direction:reverse]" />
                <ShieldCheck className="w-10 h-10 text-gold-300 drop-shadow-lg" />
                <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-emerald-950 border border-gold-400/50 text-[9px] font-mono font-bold text-gold-300 whitespace-nowrap shadow-sm">
                  AI NEURAL CORE
                </div>
              </div>
            </div>

            {/* Wireframe Vehicle Damage HUD (Center-Right Layer) */}
            <div className="absolute right-4 top-4 z-10 w-60 p-3 rounded-2xl bg-emerald-950/85 backdrop-blur-md border border-emerald-600/40 shadow-xl">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-800/60 text-[10px]">
                <div className="flex items-center space-x-1.5 text-emerald-300 font-bold">
                  <Car className="w-3.5 h-3.5 text-gold-400" />
                  <span>2024 Honda Accord EX</span>
                </div>
                <span className="font-mono text-gold-300 text-[9px]">VIN ...8821</span>
              </div>
              <div className="mt-2 relative h-14 rounded-lg bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#10B98120_1px,transparent_1px)] bg-[size:8px_8px]" />
                <div className="text-center">
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/50">
                    Front Bumper Conflict
                  </span>
                  <div className="text-[8px] text-emerald-200/70 font-mono mt-0.5">Billed: $10,200 · Scuff detected</div>
                </div>
              </div>
            </div>

            {/* Floating Document 1: Claim Form (Top-Left) */}
            <div className="absolute left-2 top-2 z-10 w-48 p-2.5 rounded-xl bg-emerald-950/90 backdrop-blur-md border border-emerald-600/40 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1 text-white text-[10px] font-bold">
                  <FileText className="w-3 h-3 text-gold-400" />
                  <span>Claim Form</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  VERIFIED ✓
                </span>
              </div>
              <p className="text-[9px] text-emerald-100/70 font-mono">Loss Date: 2026-03-01</p>
              <p className="text-[9px] text-emerald-100/70 font-mono">Claimed: $10,200.00</p>
            </div>

            {/* Floating Document 2: Repair Estimate (Bottom-Left) */}
            <div className="absolute left-4 bottom-4 z-15 w-52 p-2.5 rounded-xl bg-emerald-950/90 backdrop-blur-md border border-orange-500/40 shadow-lg transform rotate-2 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1 text-white text-[10px] font-bold">
                  <FileSpreadsheet className="w-3 h-3 text-orange-400" />
                  <span>Repair Estimate</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono font-bold">
                  INFLATED
                </span>
              </div>
              <p className="text-[9px] text-emerald-100/70">Apex Collision Specialists</p>
              <p className="text-[9px] text-rose-300 font-bold font-mono">Labor Ratio: 78% (Rule R02)</p>
            </div>

            {/* Floating Document 3: Photo Evidence (Right-Bottom) */}
            <div className="absolute right-6 bottom-2 z-15 w-48 p-2.5 rounded-xl bg-emerald-950/90 backdrop-blur-md border border-teal-500/40 shadow-lg transform -rotate-2 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1 text-white text-[10px] font-bold">
                  <Camera className="w-3 h-3 text-teal-400" />
                  <span>Photo Evidence</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold">
                  MISMATCH
                </span>
              </div>
              <p className="text-[9px] text-emerald-100/70">Frontal Camera Angle</p>
              <p className="text-[9px] text-rose-300 font-bold font-mono">Minor Scuff Detected</p>
            </div>

            {/* Prominent Floating 3D Risk Card (Angled Foreground, Z-30) */}
            <div className="absolute left-1/2 bottom-3 -translate-x-1/2 z-30 w-72 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950 via-forest-900 to-emerald-950 border-2 border-gold-400/80 shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(217,164,65,0.25)] animate-float-reverse">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-800/60">
                <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-gold-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Live Risk Analysis</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  SIU PRIORITY 1
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black font-mono tracking-tight text-white">
                      {score}
                    </span>
                    <span className="text-xs font-bold text-forest-700">/ 100</span>
                    <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                      {level}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-200/80 font-medium mt-1 truncate max-w-[170px]">
                    {topSignal}
                  </p>
                </div>

                {/* Segmented Risk Gauge */}
                <div className="flex flex-col space-y-1 items-end">
                  <div className="flex space-x-1">
                    <span className="w-2.5 h-6 rounded-sm bg-emerald-500 shadow-sm" title="Low" />
                    <span className="w-2.5 h-6 rounded-sm bg-amber-500 shadow-sm" title="Medium" />
                    <span className="w-2.5 h-6 rounded-sm bg-orange-500 shadow-sm" title="High" />
                    <span className="w-2.5 h-6 rounded-sm bg-rose-500 animate-pulse shadow-sm ring-1 ring-white" title="Critical" />
                  </div>
                  <span className="text-[9px] font-mono text-gold-300 font-bold">5/6 Signals</span>
                </div>
              </div>

              {/* Bottom Human Review Callout */}
              <div className="mt-2.5 pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[9px] text-emerald-200">
                <span className="flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 text-gold-400" />
                  <span>Lead Vance Review Active</span>
                </span>
                <span className="font-mono text-gold-300">AI Rec · Human Dec</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
