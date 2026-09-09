import React from "react";

interface RiskGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
  strokeWidth?: number;
  className?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  size = 140,
  showLabel = true,
  strokeWidth = 12,
  className = "",
}) => {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 240-degree arc for a speedometer-like gauge
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (safeScore / 100) * arcLength;

  const getColor = (val: number) => {
    if (val >= 80) return { stroke: "#EF4444", text: "text-rose-500", glow: "rgba(239, 68, 68, 0.4)", label: "CRITICAL" };
    if (val >= 60) return { stroke: "#F97316", text: "text-orange-500", glow: "rgba(249, 115, 22, 0.4)", label: "HIGH" };
    if (val >= 35) return { stroke: "#E5A11A", text: "text-amber-500", glow: "rgba(229, 161, 26, 0.4)", label: "MEDIUM" };
    return { stroke: "#10B981", text: "text-emerald-500", glow: "rgba(16, 185, 129, 0.4)", label: "LOW" };
  };

  const status = getColor(safeScore);

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform rotate-[150deg] overflow-visible"
      >
        <defs>
          <filter id={`gauge-glow-${safeScore}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id={`gauge-gradient-${safeScore}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="40%" stopColor="#E5A11A" />
            <stop offset="70%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          className="text-black/10"
        />

        {/* Dynamic active score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={status.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter={`url(#gauge-glow-${safeScore})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Central Score readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
        <span className="text-3xl font-black tracking-tight text-forest-950 font-mono">
          {safeScore}
        </span>
        <span className="text-[10px] font-bold text-forest-700/80 uppercase tracking-wider -mt-0.5">
          / 100
        </span>
        {showLabel && (
          <span className={`text-[10px] font-extrabold uppercase tracking-widest mt-1 ${status.text}`}>
            {status.label}
          </span>
        )}
      </div>
    </div>
  );
};
