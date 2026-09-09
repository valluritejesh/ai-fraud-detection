import React from "react";
import { ShieldCheck, Activity, PlusCircle, Server, RefreshCw } from "lucide-react";

interface NavbarProps {
  currentTab: "dashboard" | "new_claim" | "health";
  onSelectTab: (tab: "dashboard" | "new_claim" | "health") => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab("dashboard")}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">FraudGuard AI</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                PROD-STYLE
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Multimodal Fraud Investigation Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSelectTab("dashboard")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
              currentTab === "dashboard"
                ? "bg-slate-800 text-blue-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Investigation Dashboard</span>
          </button>

          <button
            onClick={() => onSelectTab("new_claim")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
              currentTab === "new_claim"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/30"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Claim</span>
          </button>

          <button
            onClick={() => onSelectTab("health")}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              currentTab === "health"
                ? "bg-slate-800 text-emerald-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Agent Status</span>
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1" />

          <button
            onClick={onRefresh}
            title="Refresh Claim Data"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
