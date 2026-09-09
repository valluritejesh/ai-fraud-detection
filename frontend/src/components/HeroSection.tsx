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
  Cpu,
  Scale,
  Activity,
  Layers,
  FileCheck,
  Eye
} from "lucide-react";
import { Claim } from "../types";

interface HeroSectionProps {
  onSubmitClaim: () => void;
  onExploreScenarios?: () => void;
  onOpenDossier?: (claimId: string) => void;
  featuredClaim?: Claim | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSubmitClaim,
  onExploreScenarios,
  onOpenDossier,
  featuredClaim,
}) => {
  const claimId = featuredClaim ? featuredClaim.id : "CLM-SCENARIO-B";
  const score = featuredClaim ? Math.round(featuredClaim.final_risk_score ?? featuredClaim.risk_score) : 85;
  const level = featuredClaim ? (featuredClaim.final_risk_level ?? featuredClaim.risk_level) : "CRITICAL";
  const topSignal = featuredClaim?.top_signal || "RULE_EXCESSIVE_CLAIM_TO_VALUE";
  const claimedAmount = featuredClaim ? featuredClaim.claimed_amount : 10200;
  const vehicleName = featuredClaim
    ? `${featuredClaim.vehicle_year} ${featuredClaim.vehicle_make} ${featuredClaim.vehicle_model}`
    : "2024 HONDA ACCORD EX";
  const vehicleVin = featuredClaim?.vehicle_vin ? `VIN ••••${featuredClaim.vehicle_vin.slice(-4)}` : "VIN ••••8821";

  // Dynamic scenario-specific evidence mapping
  const getScenarioEvidence = () => {
    switch (claimId) {
      case "CLM-SCENARIO-A":
        return {
          claimForm: { title: "Claim Form", status: "✓ VERIFIED", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Loss: 2026-03-01", line2: `Claimed: $${claimedAmount.toLocaleString()}` },
          policeReport: { title: "Police Report", status: "✓ CROSS-CHECKED", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Report #PR-1044", line2: "Incident Confirmed" },
          repairEst: { title: "Repair Estimate", status: "✓ CONSISTENT", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Verified Repair Shop", line2: "Parts & Labor Balanced" },
          photoEv: { title: "Photo Evidence", status: "✓ MATCH", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Frontal Camera Angle", line2: "Impact Consistent" },
          hudConflict: "NO CONFLICT DETECTED",
          hudDetail: "Physical damage aligns with billed estimate",
          hudBadge: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50",
          siuStatus: "STRAIGHT-THROUGH",
          siuDetail: "Automated low-risk approval eligible",
        };
      case "CLM-SCENARIO-C":
        return {
          claimForm: { title: "Claim Form", status: "DATE CONFLICT", badge: "bg-orange-500/20 text-orange-300 border-orange-500/40", line1: "Claim Loss Date: 2026-03-01", line2: `Claimed: $${claimedAmount.toLocaleString()}` },
          policeReport: { title: "Police Report", status: "⚠ CONTRADICTION", badge: "bg-rose-500/20 text-rose-300 border-rose-500/40", line1: "Reported: 2026-03-08", line2: "7-Day Date Mismatch" },
          repairEst: { title: "Repair Estimate", status: "REVIEW DATES", badge: "bg-orange-500/20 text-orange-300 border-orange-500/40", line1: "Apex Collision", line2: "Estimate Precedes Incident" },
          photoEv: { title: "Photo Evidence", status: "EXIF MISMATCH", badge: "bg-orange-500/20 text-orange-300 border-orange-500/40", line1: "Metadata Inconsistent", line2: "Photo timestamp conflict" },
          hudConflict: "TIMELINE CONTRADICTION",
          hudDetail: "Police report date differs from claim form",
          hudBadge: "bg-orange-950/80 text-orange-300 border-orange-500/50",
          siuStatus: "SIU REVIEW ACTIVE",
          siuDetail: "Timeline discrepancy investigation",
        };
      case "CLM-SCENARIO-D":
        return {
          claimForm: { title: "Claim Form", status: "VERIFIED", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Loss: 2026-03-01", line2: `Claimed: $${claimedAmount.toLocaleString()}` },
          policeReport: { title: "Police Report", status: "VERIFIED", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Side Impact Reported", line2: "PR-9941" },
          repairEst: { title: "Repair Estimate", status: "⚠ GHOST REPAIR", badge: "bg-rose-500/20 text-rose-300 border-rose-500/40", line1: "Billed: Replace Bumper", line2: "Unsupported Billed Parts" },
          photoEv: { title: "Photo Evidence", status: "DAMAGE MISMATCH", badge: "bg-rose-500/20 text-rose-300 border-rose-500/40", line1: "No Bumper Damage", line2: "Photos show side scrape only" },
          hudConflict: "ESTIMATE / PHOTO MISMATCH",
          hudDetail: "Billed bumper replacement not found in photos",
          hudBadge: "bg-rose-950/80 text-rose-300 border-rose-500/50",
          siuStatus: "SIU REVIEW ACTIVE",
          siuDetail: "Physical parts inspection required",
        };
      case "CLM-SCENARIO-E":
        return {
          claimForm: { title: "Claim Form", status: "VERIFIED", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Loss: 2026-03-01", line2: `Claimed: $${claimedAmount.toLocaleString()}` },
          policeReport: { title: "Police Report", status: "VERIFIED", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Incident Confirmed", line2: "PR-3310" },
          repairEst: { title: "Repair Estimate", status: "⚠ DUPLICATE HASH", badge: "bg-rose-500/20 text-rose-300 border-rose-500/40", line1: "Apex Collision", line2: "Exact duplicate invoice" },
          photoEv: { title: "Photo Evidence", status: "RECYCLED IMAGE", badge: "bg-rose-500/20 text-rose-300 border-rose-500/40", line1: "SHA-256 Collision", line2: "Found in Claim CLM-2025-0812" },
          hudConflict: "RECYCLED INVOICE DETECTED",
          hudDetail: "Exact document hash matched prior settled claim",
          hudBadge: "bg-rose-950/80 text-rose-300 border-rose-500/50",
          siuStatus: "FRAUD DEFENSE ACTIVE",
          siuDetail: "Syndicate / duplicate claim investigation",
        };
      case "CLM-SCENARIO-F":
        return {
          claimForm: { title: "Claim Form", status: "SANITIZED", badge: "bg-purple-500/20 text-purple-300 border-purple-500/40", line1: "Injection Neutralized", line2: `Claimed: $${claimedAmount.toLocaleString()}` },
          policeReport: { title: "Police Report", status: "VERIFIED", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Incident Filed", line2: "PR-5521" },
          repairEst: { title: "Repair Estimate", status: "QUARANTINED", badge: "bg-purple-500/20 text-purple-300 border-purple-500/40", line1: "Contains Prompt Attack", line2: "Malicious payload stripped" },
          photoEv: { title: "Photo Evidence", status: "INTEGRITY OK", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "EXIF Authenticated", line2: "Frequency Spike Flagged" },
          hudConflict: "SECURITY THREAT QUARANTINED",
          hudDetail: "Indirect prompt injection detected & sanitized",
          hudBadge: "bg-purple-950/80 text-purple-300 border-purple-500/50",
          siuStatus: "SECURITY SIU ESCALATION",
          siuDetail: "Adversarial threat analysis",
        };
      default: // Scenario B
        return {
          claimForm: { title: "Claim Form", status: "✓ VERIFIED", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Loss Date: 2026-03-01", line2: `Claimed: $${claimedAmount.toLocaleString()}` },
          policeReport: { title: "Police Report", status: "✓ CROSS-CHECKED", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line1: "Report #PR-8821", line2: "Incident Confirmed" },
          repairEst: { title: "Repair Estimate", status: "⚠ INFLATED", badge: "bg-orange-500/20 text-orange-300 border-orange-500/40", line1: "Apex Collision Specialists", line2: "Labor Ratio: 78% (Rule R02)" },
          photoEv: { title: "Photo Evidence", status: "MISMATCH", badge: "bg-rose-500/20 text-rose-300 border-rose-500/40", line1: "Frontal Cam Angle", line2: "Minor Scuff Detected" },
          hudConflict: "FRONT BUMPER CONFLICT",
          hudDetail: `Billed: $${claimedAmount.toLocaleString()} · LiDAR: Minor Scuff`,
          hudBadge: "bg-rose-950/80 text-rose-300 border-rose-500/50",
          siuStatus: "REVIEW ACTIVE",
          siuDetail: "Staged collision investigation",
        };
    }
  };

  const ev = getScenarioEvidence();
  const isLowRisk = level === "LOW" || score <= 30;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04241F] via-[#063B32] to-[#031B17] border border-emerald-700/50 shadow-2xl text-white p-5 md:p-6 lg:p-7 mb-6">
      {/* Environmental Lighting & Atmospheric Gradients */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0B5D4F12_1px,transparent_1px),linear-gradient(to_bottom,#0B5D4F12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Brand Identity, Value Statement, Stepper & CTAs (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Eyebrow Chip */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-gold-400/40 text-gold-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-pulse" />
            <span className="tracking-wide">AI-Powered Multi-Agent Fraud Intelligence</span>
          </div>

          {/* Headline with Selective Styling */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08]">
            <span className="text-white">Fraud </span>
            <span className="text-gold-300 drop-shadow-[0_0_18px_rgba(217,164,65,0.35)]">Stops </span>
            <span className="text-white">Here.</span>
          </h1>

          {/* Subheading */}
          <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed max-w-md">
            AI-powered multimodal investigation. Cross-evidence consistency verification. Human judgment. Real enterprise impact.
          </p>

          {/* Connected Pipeline Stepper */}
          <div className="p-2.5 rounded-2xl bg-emerald-950/70 border border-emerald-800/60 backdrop-blur-md">
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400/80 mb-1.5 flex items-center justify-between">
              <span>Investigation Pipeline</span>
              <span className="text-gold-300">Continuous Multimodal Consensus</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
              <div className="p-1 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-center">
                <div className="font-bold text-white">1. DOCS</div>
                <div className="text-[8px] text-emerald-300 truncate">OCR & EXIF</div>
              </div>
              <div className="p-1 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-center">
                <div className="font-bold text-white">2. AI</div>
                <div className="text-[8px] text-emerald-300 truncate">Extraction</div>
              </div>
              <div className="p-1 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-center">
                <div className="font-bold text-white">3. VERIFY</div>
                <div className="text-[8px] text-emerald-300 truncate">Matrix</div>
              </div>
              <div className="p-1 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-center">
                <div className="font-bold text-white">4. RISK</div>
                <div className="text-[8px] text-emerald-300 truncate">0–100</div>
              </div>
              <div className="p-1 rounded-lg bg-gradient-to-br from-gold-500/20 to-gold-600/30 border border-gold-400/60 text-center text-gold-300 font-bold">
                <div className="truncate">5. SIU</div>
                <div className="text-[8px] text-gold-200 truncate">Decision</div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-2.5 pt-0.5">
            <button
              onClick={onSubmitClaim}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 text-forest-950 font-bold text-xs shadow-lg shadow-gold-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center space-x-1.5 border border-gold-300"
            >
              <span>+ Submit Claim for AI Triaging</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-forest-950" />
            </button>

            {onOpenDossier && (
              <button
                onClick={() => onOpenDossier(claimId)}
                className="px-3.5 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-gold-400/40 text-gold-200 font-bold text-xs transition-all flex items-center space-x-1.5 hover:shadow-gold-glow"
              >
                <Eye className="w-3.5 h-3.5 text-gold-300" />
                <span>Inspect Dossier ({claimId})</span>
              </button>
            )}
          </div>

          {/* Trust Anchors */}
          <div className="flex items-center space-x-3 text-[10px] text-emerald-300/80 pt-0.5 font-mono">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>6 Live Agents</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>R01–R05 Engine</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>SOC 2 Type II</span>
            </span>
          </div>
        </div>

        {/* Right Column: Coherent 3D AI Multimodal Investigation Scene (7 cols) */}
        <div className="lg:col-span-7 relative min-h-[440px] flex items-center justify-center perspective-1200 overflow-visible">
          <div className="relative w-full max-w-2xl h-[430px] preserve-3d floating-3d-scene">
            {/* Perspective Canvas Frame */}
            <div className="absolute inset-x-1 inset-y-1 rounded-3xl bg-gradient-to-tr from-emerald-950/70 via-forest-950/60 to-teal-950/50 border border-emerald-500/25 backdrop-blur-sm shadow-2xl -z-10" />

            {/* SVG Connecting Flow Lines (Evidence -> AI Core -> Verification -> Risk -> SIU) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 640 430"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="flowEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#D9A441" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="flowRed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D9A441" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Line 1: Claim Form -> AI Core */}
              <path
                d="M 130 50 C 210 65, 260 110, 320 150"
                stroke="url(#flowEmerald)"
                strokeWidth="1.8"
                strokeDasharray="4 6"
                className="animate-dash-flow"
              />

              {/* Line 2: Repair Estimate -> AI Core */}
              <path
                d="M 140 180 C 210 175, 260 160, 320 150"
                stroke="#F97316"
                strokeWidth="1.8"
                strokeDasharray="4 6"
                className="animate-dash-flow"
              />

              {/* Line 3: Police Report -> AI Core */}
              <path
                d="M 500 50 C 440 65, 380 110, 320 150"
                stroke="url(#flowEmerald)"
                strokeWidth="1.8"
                strokeDasharray="4 6"
                className="animate-dash-flow"
              />

              {/* Line 4: Photo Evidence -> AI Core */}
              <path
                d="M 490 190 C 430 185, 380 165, 320 150"
                stroke="#EF4444"
                strokeWidth="1.8"
                strokeDasharray="4 6"
                className="animate-dash-flow"
              />

              {/* Line 5: AI Core -> Live Risk Analysis */}
              <path
                d="M 320 175 L 320 235 C 320 270, 260 280, 230 310"
                stroke="url(#flowRed)"
                strokeWidth="2.2"
                strokeDasharray="4 6"
                className="animate-dash-flow"
              />

              {/* Line 6: Live Risk Analysis -> Human SIU Review */}
              <path
                d="M 310 340 L 400 340"
                stroke="#D9A441"
                strokeWidth="1.8"
                strokeDasharray="3 5"
                className="animate-dash-flow"
              />
            </svg>

            {/* 3D Claimed Vehicle Blueprint & LiDAR Damage Scan HUD (Top Layer) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 z-5 w-[350px] p-2 rounded-2xl bg-emerald-950/85 backdrop-blur-md border border-emerald-600/40 shadow-xl select-none">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-800/60 text-[9px] font-mono">
                <div className="flex items-center space-x-1.5 text-emerald-300 font-bold">
                  <Car className="w-3.5 h-3.5 text-gold-400" />
                  <span>CLAIMED: {vehicleName}</span>
                </div>
                <span className="text-gold-300 font-bold">{vehicleVin}</span>
              </div>

              {/* Vehicle Perspective Silhouette with Collision Target Scanner */}
              <div className="relative h-16 mt-1 rounded-xl bg-gradient-to-b from-[#063B32]/80 to-[#031B17]/95 border border-emerald-700/50 overflow-hidden flex items-center justify-center">
                {/* Cyber Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#10B98125_1px,transparent_1px)] bg-[size:10px_10px]" />

                {/* LiDAR Scan Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-radar-sweep pointer-events-none" />

                {/* SVG Car Wireframe Silhouette */}
                <svg className="w-52 h-10 text-emerald-400/70" viewBox="0 0 240 50" fill="none">
                  <path
                    d="M 20 38 L 45 38 Q 50 28, 65 28 Q 80 28, 85 38 L 160 38 Q 165 28, 180 28 Q 195 28, 200 38 L 225 38 Q 235 38, 230 30 L 205 22 Q 185 10, 150 8 L 95 8 Q 65 10, 45 22 L 15 28 Q 10 32, 20 38 Z"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    fill="rgba(6, 59, 50, 0.4)"
                  />
                  <path
                    d="M 65 20 L 95 12 L 145 12 L 175 20 Z"
                    stroke="#34D399"
                    strokeWidth="1"
                    fill="rgba(16, 185, 129, 0.15)"
                  />
                  <circle cx="65" cy="38" r="7" stroke="#D9A441" strokeWidth="1.5" />
                  <circle cx="65" cy="38" r="2.5" fill="#D9A441" />
                  <circle cx="180" cy="38" r="7" stroke="#D9A441" strokeWidth="1.5" />
                  <circle cx="180" cy="38" r="2.5" fill="#D9A441" />
                  <polygon points="15,28 0,22 0,34" fill="rgba(217, 164, 65, 0.25)" />
                </svg>

                {/* Target Conflict Bounding Box */}
                <div className="absolute left-2 top-1.5 bottom-1.5 w-32 rounded-lg border border-dashed border-rose-500 bg-rose-950/70 p-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[8px] font-mono font-bold text-rose-300">
                    <span>{ev.hudConflict}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  </div>
                  <div className="text-[7px] font-mono text-emerald-100/90 leading-none truncate">
                    {ev.hudDetail}
                  </div>
                </div>
              </div>
            </div>

            {/* Central 3D AI Neural Core (Middle Layer Z-20) */}
            <div className="absolute left-1/2 top-[155px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 via-forest-900 to-emerald-950 border-2 border-gold-400/80 shadow-[0_0_35px_rgba(16,185,129,0.4),0_0_20px_rgba(217,164,65,0.3)] animate-float-slow">
                <div className="absolute -inset-2 rounded-full border border-emerald-400/40 border-dashed animate-spin [animation-duration:14s]" />
                <div className="absolute -inset-4 rounded-full border border-gold-400/30 border-dotted animate-spin [animation-duration:22s] [animation-direction:reverse]" />
                <ShieldCheck className="w-10 h-10 text-gold-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" />

                <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-emerald-950 border border-gold-400/60 text-[8px] font-mono font-black text-gold-300 whitespace-nowrap shadow-md">
                  AI NEURAL CORE
                </div>
              </div>
            </div>

            {/* Evidence Card 1: Claim Form (Top-Left) */}
            <div className="absolute left-2 top-3 z-15 w-44 p-2 rounded-xl bg-emerald-950/90 backdrop-blur-md border border-emerald-600/50 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center space-x-1 text-white text-[10px] font-bold">
                  <FileText className="w-3 h-3 text-gold-400" />
                  <span>{ev.claimForm.title}</span>
                </div>
                <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold border ${ev.claimForm.badge}`}>
                  {ev.claimForm.status}
                </span>
              </div>
              <p className="text-[8px] text-emerald-100/70 font-mono">{ev.claimForm.line1}</p>
              <p className="text-[8px] text-emerald-100/70 font-mono">{ev.claimForm.line2}</p>
            </div>

            {/* Evidence Card 2: Police Report (Top-Right) */}
            <div className="absolute right-2 top-3 z-15 w-44 p-2 rounded-xl bg-emerald-950/90 backdrop-blur-md border border-emerald-600/50 shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center space-x-1 text-white text-[10px] font-bold">
                  <FileCheck className="w-3 h-3 text-emerald-400" />
                  <span>{ev.policeReport.title}</span>
                </div>
                <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold border ${ev.policeReport.badge}`}>
                  {ev.policeReport.status}
                </span>
              </div>
              <p className="text-[8px] text-emerald-100/70 font-mono">{ev.policeReport.line1}</p>
              <p className="text-[8px] text-emerald-100/70 font-mono">{ev.policeReport.line2}</p>
            </div>

            {/* Evidence Card 3: Repair Estimate (Left-Center) */}
            <div className="absolute left-1 top-32 z-15 w-48 p-2 rounded-xl bg-emerald-950/95 backdrop-blur-md border border-orange-500/60 shadow-xl transform -rotate-2 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center space-x-1 text-white text-[10px] font-bold">
                  <FileSpreadsheet className="w-3 h-3 text-orange-400" />
                  <span>{ev.repairEst.title}</span>
                </div>
                <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold border ${ev.repairEst.badge}`}>
                  {ev.repairEst.status}
                </span>
              </div>
              <p className="text-[8px] text-emerald-100/80 truncate">{ev.repairEst.line1}</p>
              <p className="text-[8px] text-rose-300 font-mono font-bold">{ev.repairEst.line2}</p>
            </div>

            {/* Evidence Card 4: Photo Evidence (Right-Center) */}
            <div className="absolute right-1 top-32 z-15 w-44 p-2 rounded-xl bg-emerald-950/95 backdrop-blur-md border border-teal-500/60 shadow-xl transform rotate-2 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center space-x-1 text-white text-[10px] font-bold">
                  <Camera className="w-3 h-3 text-teal-400" />
                  <span>{ev.photoEv.title}</span>
                </div>
                <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold border ${ev.photoEv.badge}`}>
                  {ev.photoEv.status}
                </span>
              </div>
              <p className="text-[8px] text-emerald-100/80 font-mono">{ev.photoEv.line1}</p>
              <p className="text-[8px] text-rose-300 font-mono font-bold">{ev.photoEv.line2}</p>
            </div>

            {/* Floating 3D Risk Analysis Card (Bottom-Left Foreground, Z-35) */}
            <div className="absolute left-4 bottom-2 z-35 w-64 p-3 rounded-2xl bg-gradient-to-br from-emerald-950 via-forest-900 to-emerald-950 border-2 border-gold-400 shadow-[0_15px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(217,164,65,0.25)] animate-float-reverse">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-800/60">
                <div className="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-gold-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>Live Risk Analysis</span>
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  {isLowRisk ? "CLEAN" : "SIU PRIORITY 1"}
                </span>
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black font-mono tracking-tight text-white">
                      {score}
                    </span>
                    <span className="text-[10px] font-bold text-forest-700">/ 100</span>
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider font-mono ${
                        isLowRisk ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                      }`}
                    >
                      {level}
                    </span>
                  </div>
                  <p className="text-[8px] text-emerald-200/80 font-mono mt-0.5 truncate max-w-[150px]" title={topSignal}>
                    {topSignal}
                  </p>
                </div>

                {/* Segmented Risk Gauge Meter */}
                <div className="flex flex-col space-y-1 items-end">
                  <div className="flex space-x-1">
                    <span className="w-2 h-4 rounded-sm bg-emerald-500 shadow-sm" />
                    <span className="w-2 h-4 rounded-sm bg-amber-500 shadow-sm" />
                    <span className="w-2 h-4 rounded-sm bg-orange-500 shadow-sm" />
                    <span
                      className={`w-2 h-4 rounded-sm shadow-sm ${
                        level === "CRITICAL"
                          ? "bg-rose-500 animate-pulse ring-1 ring-white"
                          : "bg-rose-500/30"
                      }`}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-gold-300 font-bold">
                    {isLowRisk ? "0 Signals" : "Active Signals"}
                  </span>
                </div>
              </div>

              <div className="mt-1.5 pt-1 border-t border-emerald-800/60 flex items-center justify-between text-[8px] text-emerald-200 font-mono">
                <span className="flex items-center space-x-1">
                  <Activity className="w-2.5 h-2.5 text-gold-400" />
                  <span>{claimId}</span>
                </span>
                <span className="text-gold-300">AI Rec → Human Dec</span>
              </div>
            </div>

            {/* Floating Human SIU Review Card (Bottom-Right Foreground, Z-35) */}
            <div className="absolute right-4 bottom-2 z-35 w-56 p-2.5 rounded-2xl bg-gradient-to-br from-emerald-900/95 via-forest-900/90 to-emerald-950 border border-gold-400/50 shadow-xl">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-800/60">
                <div className="flex items-center space-x-1 text-[10px] font-bold text-white">
                  <Scale className="w-3 h-3 text-gold-400" />
                  <span>HUMAN SIU REVIEW</span>
                </div>
                <span className="text-[8px] px-1 py-0.2 rounded bg-gold-400/20 text-gold-300 border border-gold-400/40 font-mono font-bold">
                  {ev.siuStatus}
                </span>
              </div>

              <div className="mt-1.5 space-y-0.5 text-[8px] font-mono">
                <div className="flex justify-between text-emerald-100/90">
                  <span className="text-emerald-400/70">Investigator:</span>
                  <span className="font-bold text-white">Lead Vance</span>
                </div>
                <div className="flex justify-between text-emerald-100/90">
                  <span className="text-emerald-400/70">Status:</span>
                  <span className="font-bold text-gold-300">{ev.siuDetail}</span>
                </div>
                <div className="flex justify-between text-emerald-100/90">
                  <span className="text-emerald-400/70">Authority:</span>
                  <span className="text-emerald-200">Binding Decision</span>
                </div>
              </div>

              <div className="mt-1.5 pt-1 border-t border-emerald-800/60 text-center text-[8px] text-gold-300 font-bold font-mono">
                AI recommends. Human decides.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
