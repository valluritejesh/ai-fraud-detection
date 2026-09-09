import React from "react";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Scale,
  TrendingUp,
  ShieldQuestion
} from "lucide-react";
import { Claim } from "../types";

interface MetricsCardsProps {
  claims: Claim[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ claims }) => {
  const totalClaims = claims.length;
  const lowRisk = claims.filter((c) => (c.final_risk_score ?? c.risk_score) <= 30).length;
  const medRisk = claims.filter(
    (c) => (c.final_risk_score ?? c.risk_score) > 30 && (c.final_risk_score ?? c.risk_score) <= 60
  ).length;
  const highRisk = claims.filter(
    (c) => (c.final_risk_score ?? c.risk_score) > 60 && (c.final_risk_score ?? c.risk_score) <= 80
  ).length;
  const critRisk = claims.filter((c) => (c.final_risk_score ?? c.risk_score) > 80).length;
  const siuQueue = claims.filter(
    (c) => c.status === "REVIEW_REQUIRED" || c.status === "HUMAN_REVIEW" || (c.final_risk_score ?? c.risk_score) >= 60
  ).length;

  const cards = [
    {
      title: "TOTAL CLAIMS",
      count: totalClaims,
      trend: "↑ 12%",
      subtitle: "Active claims in pipeline",
      icon: FileText,
      iconColor: "text-forest-800",
      iconBg: "bg-forest-800/10 border-forest-800/20",
      accentBar: "bg-forest-800",
      sparkline: "M0,15 Q20,5 40,12 T80,8 T100,4",
      sparkColor: "#0B5D4F",
    },
    {
      title: "LOW RISK",
      count: lowRisk,
      trend: "STP Eligible",
      subtitle: "Score 0–30 • Fast-track pay",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      accentBar: "bg-emerald-500",
      sparkline: "M0,12 Q25,8 50,14 T100,6",
      sparkColor: "#10B981",
    },
    {
      title: "MEDIUM RISK",
      count: medRisk,
      trend: "Monitored",
      subtitle: "Score 31–60 • Standard review",
      icon: ShieldQuestion,
      iconColor: "text-gold-600",
      iconBg: "bg-gold-500/10 border-gold-500/20",
      accentBar: "bg-gold-500",
      sparkline: "M0,10 Q30,16 60,6 T100,10",
      sparkColor: "#D9A441",
    },
    {
      title: "HIGH RISK",
      count: highRisk,
      trend: "Attention",
      subtitle: "Score 61–80 • SIU review",
      icon: AlertTriangle,
      iconColor: "text-risk-high",
      iconBg: "bg-orange-500/10 border-orange-500/20",
      accentBar: "bg-risk-high",
      sparkline: "M0,14 Q30,10 60,18 T100,6",
      sparkColor: "#F97316",
    },
    {
      title: "CRITICAL RISK",
      count: critRisk,
      trend: "Immediate",
      subtitle: "Score 81–100 • Priority freeze",
      icon: ShieldAlert,
      iconColor: "text-risk-critical",
      iconBg: "bg-rose-500/10 border-rose-500/20",
      accentBar: "bg-risk-critical",
      sparkline: "M0,16 Q20,18 40,8 T80,4 T100,2",
      sparkColor: "#EF4444",
    },
    {
      title: "SIU QUEUE",
      count: siuQueue,
      trend: "Assigned",
      subtitle: "Requires investigator determination",
      icon: Scale,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-500/10 border-purple-500/20",
      accentBar: "bg-purple-600",
      sparkline: "M0,8 Q30,14 60,8 T100,4",
      sparkColor: "#9333EA",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white/90 backdrop-blur-md rounded-2xl border border-cream-700/80 p-4 shadow-card-soft hover:shadow-card-elevated transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
          >
            {/* Top Row: Icon & Trend */}
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl border ${card.iconBg} ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cream-500 text-forest-900 border border-cream-700 font-mono">
                {card.trend}
              </span>
            </div>

            {/* Middle: Numbers & Title */}
            <div className="my-1">
              <div className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight font-sans">
                {card.count}
              </div>
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-forest-700 mt-0.5">
                {card.title}
              </h3>
            </div>

            {/* Bottom: Subtitle & Sparkline */}
            <div className="pt-2 border-t border-cream-600/60 flex items-center justify-between">
              <p className="text-[10px] text-forest-800/70 font-medium truncate max-w-[100px]">
                {card.subtitle}
              </p>
              <svg className="w-12 h-4 shrink-0 overflow-visible opacity-70 group-hover:opacity-100 transition" viewBox="0 0 100 20">
                <path
                  d={card.sparkline}
                  fill="none"
                  stroke={card.sparkColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Accent Bar bottom edge */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.accentBar} opacity-80`} />
          </div>
        );
      })}
    </div>
  );
};
