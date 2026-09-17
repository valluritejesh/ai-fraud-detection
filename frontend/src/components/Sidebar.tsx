import React from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  ListFilter,
  Scale,
  BarChart3,
  FileStack,
  Cpu,
  History,
  FileSpreadsheet,
  Sliders,
  Sparkles,
  Award,
  GitGraph
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  claimCount?: number;
  investigationCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  claimCount = 16,
  investigationCount = 5,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "realtime", label: "Live LangGraph", icon: GitGraph, pulse: true },
    { id: "new_claim", label: "Submit Claim", icon: PlusCircle, isAction: true },
    { id: "queue", label: "Claims Queue", icon: ListFilter, badge: claimCount },
    { id: "investigations", label: "Investigations", icon: Scale, badge: investigationCount },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "evidence", label: "Evidence Library", icon: FileStack },
    { id: "health", label: "Agent Status", icon: Cpu, pulse: true },
    { id: "audit", label: "Audit Trail", icon: History },
    { id: "reports", label: "Reports", icon: FileSpreadsheet },
    { id: "settings", label: "Settings", icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-emerald-950 via-forest-950 to-emerald-950 border-r border-emerald-800/40 text-cream-200 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 z-30 shadow-2xl transition-all">
      {/* Brand Header */}
      <div className="p-5 border-b border-emerald-900/70 relative">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onSelectTab("dashboard")}>
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-forest-800 to-emerald-950 border border-gold-400/50 shadow-emerald-glow group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-gold-300 drop-shadow-md" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-emerald-950" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-base tracking-tight text-white font-sans">FraudGuard</span>
              <span className="text-[10px] px-1.5 py-0.2 font-black rounded bg-gold-500/20 text-gold-300 border border-gold-400/40 font-mono">
                AI
              </span>
            </div>
            <p className="text-[10px] text-emerald-300/75 font-medium tracking-wide">
              Enterprise Fraud Defense
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
          Investigation Suite
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                isActive
                  ? "bg-gradient-to-r from-emerald-800/90 via-forest-800/95 to-emerald-800/80 text-gold-200 border border-gold-400/40 shadow-md shadow-emerald-950/50 font-bold"
                  : "text-emerald-200/80 hover:bg-emerald-900/50 hover:text-white"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gold-400 rounded-r-full shadow-gold-glow" />
              )}
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-gold-300" : "text-emerald-400/70 group-hover:text-gold-300"
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition ${
                    isActive
                      ? "bg-gold-500/25 text-gold-300 border border-gold-400/40 font-mono"
                      : "bg-emerald-900/80 text-emerald-300 group-hover:bg-emerald-800 font-mono"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.pulse && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Premium 3D AI + Human Judgment Card (Bottom) */}
      <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-br from-emerald-900 via-forest-900 to-emerald-950 border border-gold-400/40 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        {/* Specular light highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/60 to-transparent pointer-events-none" />
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-gold-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

        <div className="flex items-start space-x-3 mb-2.5 relative z-10">
          <div className="p-2 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 text-forest-950 shadow-md shadow-gold-500/20 shrink-0">
            <Award className="w-4 h-4 text-forest-950 drop-shadow-sm" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white tracking-tight flex items-center space-x-1">
              <span>AI + Human Judgment</span>
            </h4>
            <p className="text-[11px] font-semibold text-gold-300 mt-0.5">
              Safer Claims. Fairer Outcomes.
            </p>
          </div>
        </div>

        <p className="text-[10px] text-emerald-200/80 leading-relaxed mb-3 relative z-10">
          Continuous multimodal risk triaging with mandatory licensed investigator governance.
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-emerald-800/60 text-[9px] relative z-10 font-mono">
          <span className="text-emerald-300/80 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>SOC 2 CERTIFIED</span>
          </span>
          <span className="bg-emerald-950/90 text-gold-300 px-2 py-0.5 rounded border border-gold-400/30 font-bold">
            ENTERPRISE
          </span>
        </div>
      </div>
    </aside>
  );
};
