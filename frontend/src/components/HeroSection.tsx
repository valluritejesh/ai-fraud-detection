import React from "react";
import {
  ShieldAlert,
  Sparkles,
  FileCheck2,
  FileWarning,
  Camera,
  Car,
  CheckCircle,
  ArrowUpRight,
  Cpu,
  Layers,
  Search,
  Scale
} from "lucide-react";

interface HeroSectionProps {
  onSubmitClaim: () => void;
  onExploreScenarios?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSubmitClaim,
  onExploreScenarios,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-forest-900 to-emerald-900 border border-emerald-700/50 shadow-2xl text-white p-6 md:p-8 lg:p-10 mb-8">
      {/* Subtle Background Glows & Ambient Grid */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0B5D4F12_1px,transparent_1px),linear-gradient(to_bottom,#0B5D4F12_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none opacity-40" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Copy & Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-900/80 border border-gold-400/40 text-gold-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-gold-300" />
            <span className="tracking-wide">Enterprise Fraud Intelligence · Multi-Agent Platform</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Fraud Stops Here.
            </h1>
            <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gold-200 via-champagne to-emerald-200 bg-clip-text text-transparent">
              AI-powered investigation. Human judgment. Real impact.
            </p>
          </div>

          {/* Supporting Copy */}
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
            Autonomous multi-agent extraction, cross-evidence conflict matrices, and historical syndication patterns — with complete explainability and strict human investigator governance.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onSubmitClaim}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold-600 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-emerald-950 font-bold text-xs tracking-wide shadow-gold-glow transition-all duration-200 flex items-center space-x-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>+ Submit New Claim</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            {onExploreScenarios && (
              <button
                onClick={onExploreScenarios}
                className="px-4 py-3 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 text-cream-200 hover:text-white border border-emerald-600/40 hover:border-gold-400/40 text-xs font-semibold transition-all duration-200 flex items-center space-x-2"
              >
                <span>Explore 6 Live Benchmark Scenarios</span>
                <span className="text-[10px] bg-emerald-800 px-1.5 py-0.5 rounded text-gold-300 font-mono">A–F</span>
              </button>
            )}
          </div>

          {/* Key Trust Signals */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-emerald-800/60 max-w-lg text-[11px] text-emerald-200/70">
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Immutable AI Baseline</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Sub-second Cross Checks</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Human SIU Authority</span>
            </div>
          </div>
        </div>

        {/* Right: Rich 3D AI Investigation Scene (5 Cols) */}
        <div className="lg:col-span-5 relative perspective-1000 flex items-center justify-center min-h-[300px] lg:min-h-[360px]">
          <div className="w-full relative preserve-3d floating-3d-scene">
            {/* Background 3D Shield Ambient Core */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-emerald-600/30 to-teal-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Central 3D Risk Assessment Card */}
            <div className="relative z-20 mx-auto max-w-[280px] p-5 rounded-2xl bg-gradient-to-br from-emerald-900/95 via-forest-950/90 to-emerald-950 border border-gold-400/40 shadow-2xl backdrop-blur-xl animate-float-slow">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-risk-critical/20 border border-risk-critical/40">
                    <ShieldAlert className="w-4 h-4 text-risk-critical" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono tracking-widest text-gold-300 font-bold">RISK ANALYSIS</p>
                    <p className="text-[10px] text-emerald-300/80">Multi-Agent Triaged</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-risk-critical/20 text-rose-300 border border-risk-critical/40 animate-pulse">
                  CRITICAL
                </span>
              </div>

              {/* Central Score Display */}
              <div className="flex items-baseline justify-between my-2">
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-black text-white tracking-tight">85</span>
                  <span className="text-xs text-emerald-300/60 font-mono">/ 100</span>
                </div>
                <span className="text-[11px] font-semibold text-gold-300 bg-gold-900/40 px-2 py-0.5 rounded border border-gold-500/30">
                  SIU Priority 1
                </span>
              </div>

              {/* Visual Segmented Risk Gauge */}
              <div className="w-full bg-emerald-950 h-2 rounded-full overflow-hidden my-2 border border-emerald-800/60">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: "85%" }}
                />
              </div>

              <div className="pt-2 text-[10px] text-emerald-200/80 flex items-center justify-between">
                <span>Top Signal: Excessive Claim-to-Value</span>
                <span className="font-mono text-gold-300 font-bold">+40 pts</span>
              </div>
            </div>

            {/* Floating Satellite Card 1: Repair Estimate (Top Left) */}
            <div className="absolute -top-4 -left-3 z-10 p-3 rounded-xl bg-emerald-900/90 border border-emerald-600/40 shadow-xl backdrop-blur-md max-w-[190px] animate-float-reverse hidden sm:block">
              <div className="flex items-center space-x-2 mb-1">
                <FileWarning className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold text-white">Repair Estimate</span>
              </div>
              <p className="text-[10px] text-emerald-200/70 font-mono">Billed: $10,200.00</p>
              <span className="text-[9px] text-rose-300 font-semibold">Exceeds Fair Market Value</span>
            </div>

            {/* Floating Satellite Card 2: Vision Agent Scan (Bottom Right) */}
            <div className="absolute -bottom-5 -right-3 z-30 p-3 rounded-xl bg-forest-900/95 border border-teal-500/40 shadow-xl backdrop-blur-md max-w-[200px] animate-float-slow hidden sm:block">
              <div className="flex items-center space-x-2 mb-1">
                <Camera className="w-3.5 h-3.5 text-teal-300" />
                <span className="text-[11px] font-bold text-white">Vision Agent Scan</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] text-emerald-200/80">
                <Car className="w-3 h-3 text-gold-300" />
                <span>Photo: Minor Scuff Only</span>
              </div>
              <p className="text-[9px] text-amber-300/90 font-medium mt-0.5">Ghost Panel Replacement Flagged</p>
            </div>

            {/* Floating Satellite Card 3: Human Review Sign-Off (Bottom Left) */}
            <div className="absolute -bottom-4 -left-2 z-20 p-2.5 rounded-xl bg-emerald-950/90 border border-gold-500/40 shadow-lg backdrop-blur-md flex items-center space-x-2 hidden sm:flex">
              <Scale className="w-3.5 h-3.5 text-gold-300" />
              <div className="text-[10px]">
                <p className="font-bold text-white">Human SIU Review</p>
                <p className="text-emerald-300/70">Binding Determination</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
