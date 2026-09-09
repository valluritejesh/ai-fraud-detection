import React from "react";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Scale,
  Activity
} from "lucide-react";
import { Claim } from "../types";

interface MetricsCardsProps {
  claims: Claim[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ claims }) => {
  const total = claims.length;

  const low = claims.filter(
    (c) => (c.final_risk_level ?? c.risk_level) === "LOW"
  ).length;

  const medium = claims.filter(
    (c) => (c.final_risk_level ?? c.risk_level) === "MEDIUM"
  ).length;

  const high = claims.filter(
    (c) => (c.final_risk_level ?? c.risk_level) === "HIGH"
  ).length;

  const critical = claims.filter(
    (c) => (c.final_risk_level ?? c.risk_level) === "CRITICAL"
  ).length;

  const siuQueue = claims.filter(
    (c) =>
      (c.final_risk_level ?? c.risk_level) === "CRITICAL" ||
      (c.final_risk_level ?? c.risk_level) === "HIGH" ||
      c.status === "IN_REVIEW" ||
      c.status === "ESCALATED" ||
      c.status === "REVIEW_REQUIRED" ||
      c.status === "HUMAN_REVIEW"
  ).length;

  const cards = [
    {
      id: "total",
      title: "TOTAL CLAIMS",
      value: total,
      subtext: "Continuous Triage",
      trend: "↑ 12%",
      trendLabel: "portfolio intake",
      trendColor: "bg-forest-900/10 text-forest-900 border-forest-700/20",
      icon: FileText,
      iconBg: "bg-forest-900/10 text-forest-800 border-forest-700/20",
      gradient: "from-white via-cream-50/50 to-white",
      glowBorder: "border-cream-700/90 hover:border-forest-700/40",
      hoverShadow: "hover:shadow-[0_12px_28px_rgba(11,79,66,0.12)]",
      sparkColor: "#0B5D4F",
      sparkFill: "rgba(11, 93, 79, 0.12)",
      sparkPath: "M0 25 Q15 28 30 18 T60 12 T90 20 T120 10 L120 35 L0 35 Z",
      strokePath: "M0 25 Q15 28 30 18 T60 12 T90 20 T120 10",
      dot: { cx: 120, cy: 10 },
      hasPulse: false,
    },
    {
      id: "low",
      title: "LOW RISK",
      value: low,
      subtext: "STP Eligible (Auto-Pass)",
      trend: `${total ? Math.round((low / total) * 100) : 0}%`,
      trendLabel: "straight-through",
      trendColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      icon: ShieldCheck,
      iconBg: "bg-emerald-500/15 text-emerald-800 border-emerald-400/40",
      gradient: "from-emerald-50/40 via-white to-white",
      glowBorder: "border-emerald-200/80 hover:border-emerald-400/80",
      hoverShadow: "hover:shadow-[0_12px_28px_rgba(11,93,79,0.18)]",
      sparkColor: "#087F6B",
      sparkFill: "rgba(8, 127, 107, 0.14)",
      sparkPath: "M0 30 Q20 25 40 16 T80 8 T120 4 L120 35 L0 35 Z",
      strokePath: "M0 30 Q20 25 40 16 T80 8 T120 4",
      dot: { cx: 120, cy: 4 },
      hasPulse: true,
      pulseColor: "bg-emerald-500",
    },
    {
      id: "medium",
      title: "MEDIUM RISK",
      value: medium,
      subtext: "Monitored / Validation",
      trend: "Watchlist",
      trendLabel: "secondary audit",
      trendColor: "bg-gold-50 text-gold-900 border-gold-300",
      icon: Activity,
      iconBg: "bg-gold-500/15 text-gold-800 border-gold-400/40",
      gradient: "from-gold-50/30 via-white to-white",
      glowBorder: "border-gold-200/80 hover:border-gold-400/80",
      hoverShadow: "hover:shadow-[0_12px_28px_rgba(217,164,65,0.18)]",
      sparkColor: "#D9A441",
      sparkFill: "rgba(217, 164, 65, 0.15)",
      sparkPath: "M0 18 Q25 24 50 14 T100 22 T120 16 L120 35 L0 35 Z",
      strokePath: "M0 18 Q25 24 50 14 T100 22 T120 16",
      dot: { cx: 120, cy: 16 },
      hasPulse: false,
    },
    {
      id: "high",
      title: "HIGH RISK",
      value: high,
      subtext: "Rules & Damage Conflicts",
      trend: "R01–R05",
      trendLabel: "rule triggers",
      trendColor: "bg-orange-50 text-orange-950 border-orange-300",
      icon: AlertTriangle,
      iconBg: "bg-orange-500/15 text-orange-800 border-orange-400/40",
      gradient: "from-orange-50/40 via-white to-white",
      glowBorder: "border-orange-200/80 hover:border-orange-400/80",
      hoverShadow: "hover:shadow-[0_12px_28px_rgba(234,88,12,0.18)]",
      sparkColor: "#EA580C",
      sparkFill: "rgba(234, 88, 12, 0.15)",
      sparkPath: "M0 28 Q30 18 60 26 T90 12 T120 8 L120 35 L0 35 Z",
      strokePath: "M0 28 Q30 18 60 26 T90 12 T120 8",
      dot: { cx: 120, cy: 8 },
      hasPulse: false,
    },
    {
      id: "critical",
      title: "CRITICAL RISK",
      value: critical,
      subtext: "Severe Anomaly / Recycled",
      trend: "81–100",
      trendLabel: "score band",
      trendColor: "bg-rose-50 text-rose-950 border-rose-300",
      icon: Flame,
      iconBg: "bg-rose-500/15 text-rose-800 border-rose-400/40",
      gradient: "from-rose-50/40 via-white to-white",
      glowBorder: "border-rose-200/80 hover:border-rose-400/80",
      hoverShadow: "hover:shadow-[0_12px_28px_rgba(225,29,72,0.2)]",
      sparkColor: "#E11D48",
      sparkFill: "rgba(225, 29, 72, 0.16)",
      sparkPath: "M0 32 Q25 28 50 18 T80 14 T120 4 L120 35 L0 35 Z",
      strokePath: "M0 32 Q25 28 50 18 T80 14 T120 4",
      dot: { cx: 120, cy: 4 },
      hasPulse: true,
      pulseColor: "bg-rose-600",
    },
    {
      id: "siu",
      title: "SIU QUEUE",
      value: siuQueue,
      subtext: "Mandatory SIU Review",
      trend: "Human Decision",
      trendLabel: "governance lock",
      trendColor: "bg-teal-50 text-teal-900 border-teal-300",
      icon: Scale,
      iconBg: "bg-teal-500/15 text-teal-800 border-teal-400/40",
      gradient: "from-teal-50/40 via-white to-white",
      glowBorder: "border-teal-200/80 hover:border-teal-400/80",
      hoverShadow: "hover:shadow-[0_12px_28px_rgba(8,127,107,0.18)]",
      sparkColor: "#0D9488",
      sparkFill: "rgba(13, 148, 136, 0.15)",
      sparkPath: "M0 24 Q30 20 60 12 T90 18 T120 8 L120 35 L0 35 Z",
      strokePath: "M0 24 Q30 20 60 12 T90 18 T120 8",
      dot: { cx: 120, cy: 8 },
      hasPulse: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-3.5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className={`relative bg-gradient-to-b ${c.gradient} backdrop-blur-xl border ${c.glowBorder} rounded-2xl p-3.5 sm:p-4 shadow-card-soft ${c.hoverShadow} transition-all duration-300 group hover:-translate-y-1 overflow-hidden flex flex-col justify-between`}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

            {/* Subtle background watermark */}
            <div className="absolute -right-3 -bottom-3 w-20 h-20 opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
              <Icon className="w-full h-full text-forest-950" />
            </div>

            <div>
              {/* Header: Title + Semantic Icon */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-forest-800 font-mono">
                  {c.title}
                </span>
                <div
                  className={`relative p-1.5 rounded-lg border ${c.iconBg} shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {c.hasPulse && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${c.pulseColor} animate-ping`}
                    />
                  )}
                </div>
              </div>

              {/* Large Metric Display */}
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-forest-950 tracking-tight font-sans">
                  {c.value}
                </span>
                <span
                  className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${c.trendColor} shrink-0`}
                >
                  {c.trend}
                </span>
              </div>

              {/* Subtext description */}
              <p className="text-[11px] text-forest-700 font-medium tracking-tight mt-0.5 leading-snug">
                {c.subtext}
              </p>
            </div>

            {/* Bottom Activity Curve / Micro Sparkline */}
            <div className="mt-3 pt-2 border-t border-cream-600/50 flex items-center justify-between">
              <span className="text-[9px] font-mono text-forest-700/80 capitalize">
                {c.trendLabel}
              </span>
              <div className="w-16 h-6 shrink-0 relative overflow-hidden">
                <svg
                  viewBox="0 0 120 35"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <path d={c.sparkPath} fill={c.sparkFill} />
                  <path
                    d={c.strokePath}
                    fill="none"
                    stroke={c.sparkColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {c.dot && (
                    <circle
                      cx={c.dot.cx}
                      cy={c.dot.cy}
                      r="3"
                      fill={c.sparkColor}
                      className="drop-shadow-sm"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
