import React from "react";
import {
  Search,
  Bell,
  ChevronDown,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Command
} from "lucide-react";

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  searchQuery = "",
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-cream-700/80 px-6 py-3.5 flex items-center justify-between shadow-card-soft transition-all">
      {/* Left: Context */}
      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2 text-xs text-forest-800/80">
          <span className="font-semibold text-emerald-900">Fraud Intelligence</span>
          <span className="text-cream-800">/</span>
          <span className="text-forest-700 font-medium">SIU Command Center</span>
        </div>
      </div>

      {/* Center: Large Search Bar with Ctrl+K */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-forest-800/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search claims, policy, VIN, claimant, signal..."
            className="w-full pl-10 pr-20 py-2 rounded-xl text-xs bg-cream-400/80 border border-cream-700/80 text-emerald-950 placeholder-forest-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 focus:bg-white transition-all shadow-inner"
          />
          <div className="absolute right-3 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-cream-600/60 border border-cream-700 text-[10px] font-mono text-forest-900/70 font-semibold pointer-events-none">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Live Telemetry, Notifications & User Avatar */}
      <div className="flex items-center space-x-4">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl hover:bg-cream-500/80 text-forest-800 hover:text-emerald-900 transition border border-transparent hover:border-cream-700"
            title="Refresh All Claims"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-700" : ""}`} />
          </button>
        )}

        {/* Live System Indicator */}
        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-100/70 border border-emerald-500/30 text-[11px] font-semibold text-emerald-900">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>6 Agents Live</span>
        </div>

        {/* Notifications Icon */}
        <button className="relative p-2 rounded-xl hover:bg-cream-500/80 text-forest-800 hover:text-emerald-900 transition border border-transparent hover:border-cream-700">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-risk-critical rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-3 pl-2 border-l border-cream-700/80 cursor-pointer group">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-800 via-teal-700 to-gold-500 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-[10px] bg-emerald-950 flex items-center justify-center text-gold-300 font-bold text-xs">
                SJ
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-emerald-950 leading-none group-hover:text-emerald-700 transition">
              Sarah Johnson
            </p>
            <p className="text-[10px] text-forest-700 font-medium mt-0.5">
              SIU Senior Investigator
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-forest-800/60 group-hover:text-emerald-900 transition" />
        </div>
      </div>
    </header>
  );
};
