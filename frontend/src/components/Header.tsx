import React, { useEffect, useRef } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  RefreshCw,
  Command,
  Activity,
  ShieldAlert
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-cream-700/80 px-6 py-3 flex items-center justify-between shadow-card-soft transition-all">
      {/* Specular highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none" />

      {/* Left: Context Breadcrumb */}
      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2 text-xs text-forest-800/80">
          <span className="font-bold text-emerald-950">Fraud Intelligence</span>
          <span className="text-cream-800">/</span>
          <span className="text-forest-700 font-semibold">SIU Command Center</span>
        </div>
      </div>

      {/* Center: Search Bar with Ctrl+K focus */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-forest-800/60 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search claims, policy, VIN, claimant, signal... (Ctrl + K)"
            className="w-full pl-10 pr-20 py-2 rounded-xl text-xs bg-cream-400/80 border border-cream-700 text-emerald-950 placeholder-forest-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 focus:bg-white transition-all shadow-inner"
          />
          <button
            onClick={() => searchInputRef.current?.focus()}
            className="absolute right-3 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-cream-600/70 border border-cream-700 text-[10px] font-mono text-forest-900 font-bold hover:bg-cream-600 transition"
          >
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </button>
        </div>
      </div>

      {/* Right: Telemetry, Notifications & User Avatar */}
      <div className="flex items-center space-x-3.5">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl hover:bg-cream-400 text-forest-800 hover:text-emerald-950 transition border border-transparent hover:border-cream-700"
            title="Refresh All Claims"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-700" : ""}`} />
          </button>
        )}

        {/* Live System Indicator */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-500/30 text-[11px] font-bold text-emerald-900 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>6 Agents Live</span>
          <span className="text-[9px] font-mono text-emerald-700 opacity-70">· 1.9ms</span>
        </div>

        {/* Notifications Icon */}
        <button className="relative p-2 rounded-xl hover:bg-cream-400 text-forest-800 hover:text-emerald-950 transition border border-transparent hover:border-cream-700">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-cream-700/80 cursor-pointer group">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-800 via-teal-700 to-gold-500 p-0.5 shadow-sm group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[10px] bg-emerald-950 flex items-center justify-center text-gold-300 font-black text-xs">
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
              Lead SIU Officer
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-forest-800/60 group-hover:text-emerald-900 transition" />
        </div>
      </div>
    </header>
  );
};
