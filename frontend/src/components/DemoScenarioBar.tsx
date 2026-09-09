import React from "react";
import { Sparkles, ShieldCheck, AlertTriangle, AlertCircle, FileWarning, ArrowRight } from "lucide-react";

interface DemoScenarioBarProps {
  onSelectScenario: (claimId: string) => void;
  activeScenarioId?: string | null;
}

export const DemoScenarioBar: React.FC<DemoScenarioBarProps> = ({
  onSelectScenario,
  activeScenarioId,
}) => {
  const scenarios = [
    {
      id: "CLM-SCENARIO-A",
      letter: "A",
      title: "Legitimate Claim",
      subtitle: "Clean Evidence",
      level: "LOW",
      score: 5,
      borderStyle: "hover:border-emerald-500",
      activeStyle: "border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-emerald-glow",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      scorePill: "bg-emerald-600 text-white",
    },
    {
      id: "CLM-SCENARIO-B",
      letter: "B",
      title: "Recycled Invoice",
      subtitle: "Cost Inflation",
      level: "CRITICAL",
      score: 85,
      borderStyle: "hover:border-rose-500",
      activeStyle: "border-rose-600 bg-rose-500/10 ring-2 ring-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.25)]",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      scorePill: "bg-rose-600 text-white",
    },
    {
      id: "CLM-SCENARIO-C",
      letter: "C",
      title: "Date Conflict",
      subtitle: "Timeline Contradiction",
      level: "HIGH",
      score: 70,
      borderStyle: "hover:border-orange-500",
      activeStyle: "border-orange-600 bg-orange-500/10 ring-2 ring-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.25)]",
      badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
      scorePill: "bg-orange-600 text-white",
    },
    {
      id: "CLM-SCENARIO-D",
      letter: "D",
      title: "Ghost Repair",
      subtitle: "Photo/Estimate Mismatch",
      level: "HIGH",
      score: 70,
      borderStyle: "hover:border-orange-500",
      activeStyle: "border-orange-600 bg-orange-500/10 ring-2 ring-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.25)]",
      badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
      scorePill: "bg-orange-600 text-white",
    },
    {
      id: "CLM-SCENARIO-E",
      letter: "E",
      title: "Recycled Hash",
      subtitle: "Duplicate Cross-Claim",
      level: "HIGH",
      score: 70,
      borderStyle: "hover:border-orange-500",
      activeStyle: "border-orange-600 bg-orange-500/10 ring-2 ring-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.25)]",
      badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
      scorePill: "bg-orange-600 text-white",
    },
    {
      id: "CLM-SCENARIO-F",
      letter: "F",
      title: "Velocity & Injection",
      subtitle: "Adversarial Threat",
      level: "HIGH",
      score: 65,
      borderStyle: "hover:border-purple-500",
      activeStyle: "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
      scorePill: "bg-purple-600 text-white",
    },
  ];

  return (
    <div id="demo-scenarios-bar" className="bg-white/95 backdrop-blur-xl rounded-2xl border border-cream-700/80 shadow-card-soft p-4 mb-7 relative">
      {/* Specular highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent pointer-events-none rounded-t-2xl" />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        {/* Header Label */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 text-gold-300 border border-gold-400/40 shadow-sm font-bold text-xs tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-pulse" />
            <span>DEMO SCENARIOS</span>
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-forest-950">A–F BENCHMARK MATRIX</span>
            <span className="hidden md:inline text-forest-700 ml-2 font-medium">· Select to inspect dossier</span>
          </div>
        </div>

        {/* 6 Scenario Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 flex-1">
          {scenarios.map((s) => {
            const isActive = activeScenarioId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectScenario(s.id)}
                className={`p-2.5 rounded-xl border text-left transition-all duration-300 relative group overflow-hidden ${
                  isActive
                    ? s.activeStyle
                    : `bg-cream-200/60 border-cream-700/80 hover:bg-white hover:shadow-card-elevated ${s.borderStyle}`
                }`}
              >
                {/* Top Row: Letter badge + Score pill */}
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs transition-colors ${
                      isActive ? "bg-forest-950 text-gold-300" : "bg-forest-900/10 text-forest-900 group-hover:bg-forest-900 group-hover:text-white"
                    }`}
                  >
                    {s.letter}
                  </div>
                  <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${s.scorePill}`}>
                    {s.score}
                  </span>
                </div>

                {/* Scenario Title */}
                <div className="font-bold text-xs text-forest-950 truncate tracking-tight group-hover:text-emerald-850">
                  {s.title}
                </div>

                {/* Subtitle & Level */}
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-forest-700 truncate font-medium text-[9px]">
                    {s.subtitle}
                  </span>
                  <span className={`px-1 py-0.2 rounded text-[8px] font-black uppercase font-mono border ${s.badgeColor}`}>
                    {s.level}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
