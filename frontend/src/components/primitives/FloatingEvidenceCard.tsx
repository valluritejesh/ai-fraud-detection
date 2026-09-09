import React from "react";
import { FileText, Camera, FileSpreadsheet, ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface FloatingEvidenceCardProps {
  title: string;
  docType: "claim_form" | "repair_estimate" | "police_report" | "damage_photo" | string;
  status: "VERIFIED" | "ANOMALY" | "MISMATCH" | "SANITIZED" | string;
  detail: string;
  amount?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingEvidenceCard: React.FC<FloatingEvidenceCardProps> = ({
  title,
  docType,
  status,
  detail,
  amount,
  className = "",
  style,
}) => {
  const getIcon = () => {
    switch (docType) {
      case "damage_photo":
        return Camera;
      case "repair_estimate":
        return FileSpreadsheet;
      case "police_report":
        return ShieldCheck;
      default:
        return FileText;
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "VERIFIED":
        return {
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          stamp: "VERIFIED",
          icon: CheckCircle2,
          border: "border-emerald-500/40",
        };
      case "ANOMALY":
      case "MISMATCH":
        return {
          bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          stamp: "CONFLICT",
          icon: AlertTriangle,
          border: "border-rose-500/50",
        };
      case "SANITIZED":
        return {
          bg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          stamp: "SANITIZED",
          icon: ShieldAlert,
          border: "border-purple-500/50",
        };
      default:
        return {
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          stamp: "REVIEW",
          icon: AlertTriangle,
          border: "border-amber-500/40",
        };
    }
  };

  const Icon = getIcon();
  const statusCfg = getStatusConfig();
  const StatusIcon = statusCfg.icon;

  return (
    <div
      style={style}
      className={`relative p-3 rounded-2xl bg-gradient-to-br from-emerald-950/95 via-forest-900/90 to-emerald-900/95 backdrop-blur-xl border ${statusCfg.border} shadow-2xl text-white transition-all duration-300 hover:scale-105 hover:z-30 select-none ${className}`}
    >
      {/* Specular highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none rounded-t-2xl" />

      {/* Top row: Icon + Type + Stamp Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-800/80 border border-emerald-700/60 text-gold-300">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold tracking-tight text-white">{title}</span>
        </div>

        <span
          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${statusCfg.bg}`}
        >
          <StatusIcon className="w-2.5 h-2.5" />
          <span>{statusCfg.stamp}</span>
        </span>
      </div>

      {/* Detail narrative */}
      <p className="text-[10px] text-emerald-100/80 line-clamp-2 leading-tight">{detail}</p>

      {/* Bottom tag: Amount or metadata */}
      {amount && (
        <div className="mt-2 pt-1.5 border-t border-emerald-800/50 flex items-center justify-between">
          <span className="text-[9px] text-forest-700 font-mono">EXTRACTED SUM</span>
          <span className="text-xs font-mono font-bold text-gold-300">{amount}</span>
        </div>
      )}
    </div>
  );
};
