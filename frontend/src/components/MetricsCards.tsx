import React from "react";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Scale,
  TrendingUp,
  TrendingDown
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
      c.status === "ESCALATED"
  ).length;

  const cards = [
    {
      title: "TOTAL CLAIMS",
      value: total,
      subtext: "Active portfolio claims",
      trend: "Continuous Triage",
      trendColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: FileText,
      iconBg: "bg-forest-900/10 text-forest-800 border-forest-700/20",
      sparkColor: "#0B5D4F",
      sparkPath: "M0 25 Q15 28 30 18 T60 12 T90 20 T120 10",
    },
    {
      title: "LOW RISK",
      value: low,
      subtext: "Straight-through automation",
      trend: `${total > 0 ? Math.round((low / total) * 100) : 0}% Clean`,
      trendColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: ShieldCheck,
      iconBg: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
      sparkColor: "#10B981",
      sparkPath: "M0 15 Q20 8 40 18 T80 10 T100 12 T120 6",
    },
    {
      title: "MEDIUM RISK",
      value: medium,
      subtext: "Watch list & validation",
      trend: "Score 31–60",
      trendColor: "bg-amber-100 text-amber-800 border-amber-300",
      icon: AlertTriangle,
      iconBg: "bg-amber-500/15 text-amber-700 border-amber-500/30",
      sparkColor: "#E5A11A",
      sparkPath: "M0 20 Q30 20 60 14 T90 16 T120 18",
    },
    {
      title: "HIGH RISK",
      value: high,
      subtext: "Deterministic rule conflicts",
      trend: "Score 61–80",
      trendColor: "bg-orange-100 text-orange-900 border-orange-300",
      icon: AlertTriangle,
      iconBg: "bg-orange-500/15 text-orange-700 border-orange-500/30",
      sparkColor: "#F97316",
      sparkPath: "M0 28 Q25 24 50 16 T85 10 T120 8",
    },
    {
      title: "CRITICAL RISK",
      value: critical,
      subtext: "Severe anomaly & recycled",
      trend: "Score 81–100",
      trendColor: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
      icon: Flame,
      iconBg: "bg-rose-500/15 text-rose-600 border-rose-500/30",
      sparkColor: "#EF4444",
      sparkPath: "M0 30 Q20 28 50 18 T90 8 T120 4",
    },
    {
      title: "SIU QUEUE",
      value: siuQueue,
      subtext: "Mandatory human review",
      trend: "Priority Escalation",
      trendColor: "bg-gold-100 text-gold-900 border-gold-300 font-bold",
      icon: Scale,
      iconBg: "bg-gold-500/20 text-gold-700 border-gold-400/40",
      sparkColor: "#D9A441",
      sparkPath: "M0 24 Q30 20 60 12 T90 6 T120 8",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-7">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-cream-700/80 shadow-card-soft hover:shadow-card-elevated hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
          >
            {/* Top Specular Line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cream-500 to-transparent pointer-events-none" />

            {/* Subtle background sparkline */}
            <svg
              className="absolute right-0 bottom-0 w-28 h-12 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity"
              viewBox="0 0 120 35"
              fill="none"
            >
              <path
                d={card.sparkPath}
                stroke={card.sparkColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Top row: Title + Icon */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-forest-700 font-mono">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg border ${card.iconBg}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Middle row: Big Metric Number */}
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-forest-950">
                {card.value}
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${card.trendColor}`}>
                {card.trend}
              </span>
            </div>

            {/* Bottom: Subtext */}
            <p className="text-[10px] text-forest-700 font-medium mt-1 truncate">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
