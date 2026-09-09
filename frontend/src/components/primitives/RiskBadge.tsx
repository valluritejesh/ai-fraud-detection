import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

interface RiskBadgeProps {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  score?: number | string;
  size?: "sm" | "md" | "lg";
  showMeter?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = "md",
  showMeter = false,
  className = "",
}) => {
  const normLevel = (level || "LOW").toUpperCase();

  const configs = {
    LOW: {
      bg: "bg-emerald-500/10 text-emerald-800 border-emerald-500/30",
      pill: "bg-emerald-600 text-white",
      dot: "bg-emerald-500",
      label: "LOW RISK",
      icon: ShieldCheck,
    },
    MEDIUM: {
      bg: "bg-amber-500/10 text-amber-800 border-amber-500/30",
      pill: "bg-amber-600 text-white",
      dot: "bg-amber-500",
      label: "MEDIUM RISK",
      icon: AlertTriangle,
    },
    HIGH: {
      bg: "bg-orange-500/10 text-orange-900 border-orange-500/30",
      pill: "bg-orange-600 text-white",
      dot: "bg-orange-500",
      label: "HIGH RISK",
      icon: AlertTriangle,
    },
    CRITICAL: {
      bg: "bg-rose-500/15 text-rose-900 border-rose-500/40 shadow-sm",
      pill: "bg-rose-600 text-white",
      dot: "bg-rose-600 animate-pulse",
      label: "CRITICAL RISK",
      icon: ShieldAlert,
    },
  };

  const config = configs[normLevel as keyof typeof configs] || configs.LOW;
  const Icon = config.icon;

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] space-x-1",
    md: "px-2.5 py-1 text-xs space-x-1.5",
    lg: "px-3.5 py-1.5 text-sm space-x-2",
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg border font-semibold tracking-wide ${config.bg} ${sizeStyles[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className={`ml-1 px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${config.pill}`}>
          {score}
        </span>
      )}
      {showMeter && typeof score === "number" && (
        <div className="w-8 h-1.5 rounded-full bg-black/10 overflow-hidden ml-1.5">
          <div
            className={`h-full rounded-full ${normLevel === "CRITICAL" ? "bg-rose-500" : normLevel === "HIGH" ? "bg-orange-500" : normLevel === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      )}
    </div>
  );
};
