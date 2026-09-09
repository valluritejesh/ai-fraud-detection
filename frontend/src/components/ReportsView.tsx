import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building,
  Scale,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { Claim } from "../types";

interface ReportsViewProps {
  claims: Claim[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ claims }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (reportName: string) => {
    setDownloading(reportName);
    setTimeout(() => {
      // Simulate report generation & file download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
        JSON.stringify({
          report: reportName,
          generated_at: new Date().toISOString(),
          claims_monitored: claims.length,
          export_grade: "ENTERPRISE_AUDIT_GRADE",
          summary: "FraudGuard AI Multi-Agent Compliance and Exposure Report"
        }, null, 2)
      );
      const dlAnchor = document.createElement("a");
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", `${reportName.toLowerCase().replace(/\s+/g, "_")}_2026.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      setDownloading(null);
    }, 800);
  };

  const reports = [
    {
      id: "rep-1",
      title: "Executive Fraud Exposure & Savings Summary",
      period: "Q1 2026 (Live Trailing)",
      desc: "Comprehensive financial audit detailing straight-through processing savings vs flagged SIU indemnity prevention.",
      metrics: "20 Claims Monitored · $284,400 Total Exposure",
      badge: "EXECUTIVE",
      icon: Scale,
    },
    {
      id: "rep-2",
      title: "Deterministic Rule Verification (R01–R05)",
      period: "Continuous Active",
      desc: "Audit trail log tracking deterministic rule triggers, threshold breaches, and model confidence scores across all claims.",
      metrics: "12 Rule Breaches · 100% Deterministic Integrity",
      badge: "COMPLIANCE",
      icon: ShieldCheck,
    },
    {
      id: "rep-3",
      title: "Repair Shop & Vendor Risk Intelligence",
      period: "Trailing 180 Days",
      desc: "Entity relationship mapping for syndicated fraud, repeated billing inflation, and duplicate invoice patterns.",
      metrics: "QuickCash Collision Flagged · 2 Recycled Invoices",
      badge: "SIU INTEL",
      icon: Building,
    },
    {
      id: "rep-4",
      title: "SOC 2 Type II & AI Sovereignty Ledger",
      period: "Annual Compliance Audit",
      desc: "Cryptographic event ledger demonstrating strict compliance with the 'AI Recommends. Human Decides' legal framework.",
      metrics: "100% Human Final Decision Adherence",
      badge: "AUDIT GRADE",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-cream-700/80 shadow-card-soft">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-black text-forest-950 font-sans tracking-tight flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-forest-800" />
              <span>EXECUTIVE FRAUD EXPOSURE & COMPLIANCE REPORTS</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              AUDIT-GRADE
            </span>
          </div>
          <p className="text-xs text-forest-700 font-medium mt-0.5">
            Exportable regulatory packages, underwriting loss reduction metrics, and multi-agent audit dossiers
          </p>
        </div>

        <button
          onClick={() => handleDownload("Full_Portfolio_Audit_Package")}
          disabled={downloading !== null}
          className="flex items-center space-x-2 px-4 py-2 bg-forest-950 hover:bg-forest-900 text-gold-300 rounded-xl text-xs font-bold transition shadow-sm border border-gold-400/40 w-fit"
        >
          <Download className={`w-4 h-4 ${downloading === "Full_Portfolio_Audit_Package" ? "animate-bounce" : ""}`} />
          <span>Export Full Audit Package (JSON)</span>
        </button>
      </div>

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reports.map((r) => {
          const Icon = r.icon;
          const isThisDownloading = downloading === r.title;
          return (
            <div
              key={r.id}
              className="p-6 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft hover:shadow-card-elevated transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-forest-900/10 text-forest-900 border border-forest-700/20">
                      <Icon className="w-5 h-5 text-forest-800" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-cream-300 text-forest-950 border border-cream-600">
                        {r.badge}
                      </span>
                      <div className="text-xs font-mono text-forest-600 mt-0.5">{r.period}</div>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-black text-forest-950 font-sans tracking-tight">
                  {r.title}
                </h3>

                <p className="text-xs text-forest-800 leading-relaxed">
                  {r.desc}
                </p>

                <div className="p-3 rounded-2xl bg-cream-100/70 border border-cream-600/70 text-xs font-mono font-bold text-forest-950">
                  {r.metrics}
                </div>
              </div>

              <div className="pt-3 border-t border-cream-600/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-forest-700">Format: Signed JSON / CSV</span>
                <button
                  onClick={() => handleDownload(r.title)}
                  disabled={isThisDownloading}
                  className="px-3.5 py-1.5 rounded-xl bg-forest-950 hover:bg-forest-900 text-gold-300 font-bold text-xs flex items-center space-x-1.5 transition"
                >
                  <Download className={`w-3.5 h-3.5 ${isThisDownloading ? "animate-spin" : ""}`} />
                  <span>{isThisDownloading ? "Generating..." : "Download Report"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
