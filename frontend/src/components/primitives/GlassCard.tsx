import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  variant?: "cream" | "dark" | "gold" | "emerald";
  elevation?: "none" | "soft" | "medium" | "high";
  glow?: "none" | "gold" | "emerald" | "risk";
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = "cream",
  elevation = "soft",
  glow = "none",
  interactive = false,
  className = "",
  style,
  onClick,
}) => {
  const variantStyles = {
    cream: "bg-white/90 backdrop-blur-xl border-cream-700/80 text-forest-900",
    dark: "bg-gradient-to-br from-emerald-950/95 via-forest-900/95 to-emerald-900/95 backdrop-blur-2xl border-emerald-700/40 text-white",
    gold: "bg-gradient-to-br from-gold-100/70 via-white/90 to-gold-50/80 backdrop-blur-xl border-gold-400/40 text-forest-900",
    emerald: "bg-gradient-to-br from-emerald-900/90 via-forest-800/90 to-emerald-950/95 backdrop-blur-xl border-emerald-600/40 text-white",
  };

  const elevationStyles = {
    none: "",
    soft: "shadow-card-soft",
    medium: "shadow-card-elevated",
    high: "shadow-2xl",
  };

  const glowStyles = {
    none: "",
    gold: "shadow-gold-glow",
    emerald: "shadow-emerald-glow",
    risk: "shadow-[0_0_25px_rgba(239,68,68,0.25)]",
  };

  const interactiveStyles = interactive
    ? "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card-elevated hover:border-gold-500/50 active:translate-y-0"
    : "";

  return (
    <div
      onClick={onClick}
      style={style}
      className={`relative rounded-2xl border ${variantStyles[variant]} ${elevationStyles[elevation]} ${glowStyles[glow]} ${interactiveStyles} ${className}`}
    >
      {/* Specular top-edge light highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none rounded-t-2xl" />
      {children}
    </div>
  );
};
