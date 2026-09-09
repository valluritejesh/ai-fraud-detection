import React, { useEffect, useState } from "react";
import { Server, CheckCircle2, Database, Shield, Cpu, RefreshCw, Activity, Lock } from "lucide-react";
import { SystemHealth } from "../types";
import { healthApi } from "../services/api";

export const SystemHealthView: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await healthApi.getHealth();
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-emerald-950 tracking-tight flex items-center space-x-2 font-sans">
            <Server className="w-5 h-5 text-forest-800" />
            <span>Agent Architecture & Observability</span>
          </h2>
          <p className="text-xs text-forest-700 mt-0.5">
            Real-time status of backend multi-agent workers, risk engine, and database latency
          </p>
        </div>
        <button
          onClick={fetchHealth}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-cream-300 text-forest-900 border border-cream-700 rounded-xl text-xs font-bold transition shadow-sm w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-700" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {health && (
        <>
          {/* Top 3 KPI Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/95 backdrop-blur-md border border-cream-700/80 rounded-2xl p-5 space-y-2 shadow-card-soft">
              <div className="flex items-center justify-between text-xs text-forest-700">
                <span className="font-bold uppercase tracking-wider text-[10px]">Platform Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-950 font-sans">{health.status}</div>
              <p className="text-[11px] text-forest-800 font-mono">Uptime: {health.uptime_seconds.toFixed(0)}s</p>
            </div>

            <div className="bg-white/95 backdrop-blur-md border border-cream-700/80 rounded-2xl p-5 space-y-2 shadow-card-soft">
              <div className="flex items-center justify-between text-xs text-forest-700">
                <span className="font-bold uppercase tracking-wider text-[10px]">Database Latency</span>
                <Database className="w-4 h-4 text-forest-800" />
              </div>
              <div className="text-2xl font-black text-emerald-950 font-sans">{health.database.latency_ms.toFixed(1)} ms</div>
              <p className="text-[11px] text-forest-800 font-mono">Status: {health.database.status} (Async SQLAlchemy)</p>
            </div>

            <div className="bg-white/95 backdrop-blur-md border border-cream-700/80 rounded-2xl p-5 space-y-2 shadow-card-soft">
              <div className="flex items-center justify-between text-xs text-forest-700">
                <span className="font-bold uppercase tracking-wider text-[10px]">Active Subsystems</span>
                <Cpu className="w-4 h-4 text-forest-800" />
              </div>
              <div className="text-2xl font-black text-emerald-950 font-sans">
                {Object.keys(health.agents).length} / {Object.keys(health.agents).length}
              </div>
              <p className="text-[11px] text-forest-800 font-mono">All Pipeline Workers Online</p>
            </div>
          </div>

          {/* Multi-Agent Architecture Grid */}
          <div className="bg-white/95 backdrop-blur-md border border-cream-700/80 rounded-2xl p-6 space-y-4 shadow-card-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-sans">
              Multi-Agent Pipeline Health & Provider Modes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(health.agents).map(([agentName, status]) => (
                <div key={agentName} className="p-4 rounded-xl bg-cream-300/40 border border-cream-600 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950 capitalize">
                      {agentName.replace(/_/g, " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {status}
                    </span>
                  </div>
                  <p className="text-[10px] text-forest-700 font-mono">
                    Mode: LOCAL DEMO / MOCK
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="bg-white/95 backdrop-blur-md border border-cream-700/80 rounded-2xl p-6 space-y-4 shadow-card-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-sans">
              Operational Throughput Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-cream-300/40 rounded-xl border border-cream-600">
                <span className="text-forest-700 block mb-1">Total Claims Ingested</span>
                <span className="text-2xl font-black text-emerald-950">{health.metrics.total_claims}</span>
              </div>
              <div className="p-3 bg-cream-300/40 rounded-xl border border-cream-600">
                <span className="text-forest-700 block mb-1">Under SIU Review</span>
                <span className="text-2xl font-black text-emerald-950">{health.metrics.claims_under_review}</span>
              </div>
              <div className="p-3 bg-cream-300/40 rounded-xl border border-cream-600">
                <span className="text-forest-700 block mb-1">High / Critical Flags</span>
                <span className="text-2xl font-black text-rose-700">{health.metrics.high_critical_risk_claims}</span>
              </div>
              <div className="p-3 bg-cream-300/40 rounded-xl border border-cream-600">
                <span className="text-forest-700 block mb-1">Average Risk Score</span>
                <span className="text-2xl font-black text-emerald-950">{health.metrics.average_risk_score.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
