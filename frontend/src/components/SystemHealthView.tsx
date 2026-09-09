import React, { useEffect, useState } from "react";
import { Server, CheckCircle2, Database, Shield, Cpu, RefreshCw } from "lucide-react";
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <span>Agent Architecture & Observability</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time status of backend multi-agent workers and database pipelines</p>
        </div>
        <button
          onClick={fetchHealth}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>System Status</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white">{health.status}</p>
            <p className="text-[11px] text-slate-500 font-mono">Uptime: {health.uptime_seconds}s • v{health.version}</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Database Engine</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl font-bold text-white">{health.database.status}</p>
            <p className="text-[11px] text-slate-500 font-mono">Query Latency: {health.database.latency_ms} ms</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Fraud Signals Generated</span>
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xl font-bold text-white">{health.metrics.total_fraud_signals_generated}</p>
            <p className="text-[11px] text-slate-500 font-mono">Total Claims: {health.metrics.total_claims}</p>
          </div>
        </div>
      )}

      {/* Agents Matrix */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span>Independent Autonomous Agent Services</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {[
            {
              name: "Document Processing Agent",
              role: "Schema extraction from Claim Forms, Invoices, Estimates & Police Reports",
              status: "ACTIVE",
              type: "Pydantic + Heuristic/Azure OCR",
            },
            {
              name: "Vision / Image Analysis Agent",
              role: "Accident photo component localization & repair estimate mismatch detection",
              status: "ACTIVE",
              type: "Multimodal Visual Inspection",
            },
            {
              name: "Historical Pattern Agent",
              role: "Claimant velocity, repeat collision shops & historical cost benchmark deviations",
              status: "ACTIVE",
              type: "Statistical Anomaly Engine",
            },
            {
              name: "Deterministic Rules Engine",
              role: "Evaluates strict business rules (duplicate invoices, date contradictions)",
              status: "ACTIVE",
              type: "Deterministic Constraints",
            },
            {
              name: "Evidence Verification Agent",
              role: "Cross-checks conflicting evidence sources (Claim vs Police, Photo vs Estimate)",
              status: "ACTIVE",
              type: "Multi-Source Reconciliation",
            },
            {
              name: "Fraud Risk Engine",
              role: "Synthesizes multi-agent signals into 0-100 score with explainability",
              status: "ACTIVE",
              type: "Composite Transparent Scorer",
            },
          ].map((agent, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{agent.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {agent.status}
                </span>
              </div>
              <p className="text-slate-400">{agent.role}</p>
              <div className="flex justify-between items-center pt-1 text-[10px] text-slate-500 font-mono">
                <span>Type: {agent.type}</span>
                <span className="text-blue-400 font-semibold">Local & Azure Ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
