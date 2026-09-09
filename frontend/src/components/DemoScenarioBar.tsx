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
      subtitle: "Low Risk",
      level: "LOW",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      containerColor: "hover:border-emerald-500 hover:bg-emerald-50/50",
      activeColor: "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20",
      score: "5",
    },
    {
      id: "CLM-SCENARIO-B",
      letter: "B",
      title: "Recycled Invoice",
      subtitle: "Critical Risk",
      level: "CRITICAL",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      containerColor: "hover:border-rose-500 hover:bg-rose-50/50",
      activeColor: "border-rose-600 bg-rose-50 ring-2 ring-rose-600/20",
      score: "85",
    },
    {
      id: "CLM-SCENARIO-C",
      letter: "C",
      title: "Date Conflict",
      subtitle: "High Risk",
      level: "HIGH",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      containerColor: "hover:border-amber-500 hover:bg-amber-50/50",
      activeColor: "border-amber-600 bg-amber-50 ring-2 ring-amber-600/20",
      score: "70",
    },
    {
      id: "CLM-SCENARIO-D",
      letter: "D",
      title: "Ghost Repair",
      subtitle: "High Risk",
      level: "HIGH",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      containerColor: "hover:border-amber-500 hover:bg-amber-50/50",
      activeColor: "border-amber-600 bg-amber-50 ring-2 ring-amber-600/20",
      score: "70",
    },
    {
      id: "CLM-SCENARIO-E",
      letter: "E",
      title: "Recycled Hash",
      subtitle: "High Risk",
      level: "HIGH",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
      containerColor: "hover:border-orange-500 hover:bg-orange-50/50",
      activeColor: "border-orange-600 bg-orange-50 ring-2 ring-orange-600/20",
      score: "70",
    },
    {
      id: "CLM-SCENARIO-F",
      letter: "F",
      title: "Velocity & Injection",
      subtitle: "High Risk",
      level: "HIGH",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      containerColor: "hover:border-purple-500 hover:bg-purple-50/50",
      activeColor: "border-purple-600 bg-purple-50 ring-2 ring-purple-600/20",
      score: "65",
    },
  ];

  return (
    <div id="demo-scenarios-bar" className="bg-white/90 backdrop-blur-md rounded-2xl border border-cream-700/80 shadow-card-soft p-4 mb-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Header Label */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-forest-800 text-gold-300 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xs tracking-wider text-emerald-950 uppercase font-sans">
                DEMO SCENARIOS
              </span>
              <span className="text-[10px] bg-gold-100 text-gold-800 font-bold px-1.5 py-0.2 rounded border border-gold-300">
                A–F MATRIX
              </span>
            </div>
            <p className="text-[11px] text-forest-700 font-medium">
              Click any benchmark to evaluate multi-agent triaging
            </p>
          </div>
        </div>

        {/* Buttons List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
          {scenarios.map((s) => {
            const isSelected = activeScenarioId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectScenario(s.id)}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                  isSelected
                    ? s.activeColor
                    : `bg-cream-100/80 border-cream-700/70 text-emerald-950 ${s.containerColor}`
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-5 h-5 rounded-lg bg-emerald-900 text-gold-200 font-black text-[10px] flex items-center justify-center font-mono">
                    {s.letter}
                  </span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${s.badgeColor}`}>
                    {s.score}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-tight text-emerald-950 group-hover:text-emerald-800 truncate">
                    {s.title}
                  </p>
                  <p className="text-[10px] text-forest-700 font-medium truncate">
                    {s.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
