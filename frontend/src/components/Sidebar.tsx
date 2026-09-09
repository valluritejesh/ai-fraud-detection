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
  Sparkles
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
  claimCount = 12,
  investigationCount = 5,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
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
    <aside className="w-64 bg-emerald-950/95 backdrop-blur-xl border-r border-emerald-800/40 text-cream-200 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 z-30 transition-all">
      {/* Brand Header */}
      <div className="p-5 border-b border-emerald-900/60">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab("dashboard")}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-forest-800 to-emerald-950 border border-gold-400/40 shadow-emerald-glow">
            <ShieldCheck className="w-6 h-6 text-gold-300 drop-shadow-md" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-sans">FraudGuard</span>
              <span className="text-xs px-1.5 py-0.2 font-black rounded bg-gold-600/30 text-gold-300 border border-gold-500/40">AI</span>
            </div>
            <p className="text-[10px] text-emerald-300/70 font-medium tracking-wide">
              Detect · Investigate · Prevent
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">
          Investigation Suite
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-emerald-800/80 to-forest-800/90 text-gold-200 border border-gold-400/30 shadow-sm"
                  : "text-emerald-200/80 hover:bg-emerald-900/40 hover:text-white"
              }`}
            >
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
                      ? "bg-gold-500/20 text-gold-300 border border-gold-400/30"
                      : "bg-emerald-900/60 text-emerald-300 group-hover:bg-emerald-800"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.pulse && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom AI Shield Card */}
      <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-forest-900/80 to-emerald-950 border border-emerald-700/40 shadow-glass relative overflow-hidden">
        <div className="absolute -right-3 -top-3 w-16 h-16 bg-gold-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-start space-x-3 mb-2 relative">
          <div className="p-2 rounded-xl bg-emerald-800/60 border border-emerald-600/40 shadow-inner">
            <Sparkles className="w-4 h-4 text-gold-300" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">AI + Human Judgment</h4>
            <p className="text-[11px] text-emerald-200/70 leading-snug">Safer Claims. Fairer Outcomes.</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-emerald-800/40 text-[10px]">
          <span className="text-emerald-400/80 font-mono font-medium">PROD-STYLE</span>
          <span className="bg-emerald-950/80 text-gold-300/90 px-1.5 py-0.5 rounded border border-gold-500/20 font-mono">
            v1.0.0
          </span>
        </div>
      </div>
    </aside>
  );
};
