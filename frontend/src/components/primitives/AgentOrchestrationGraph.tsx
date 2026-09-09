import React, { useState } from "react";
import { Cpu, ShieldCheck, Sparkles, FileText, Camera, History, Scale, Activity } from "lucide-react";

interface AgentOrchestrationGraphProps {
  onSelectAgent?: (agentKey: string) => void;
  className?: string;
}

export const AgentOrchestrationGraph: React.FC<AgentOrchestrationGraphProps> = ({
  onSelectAgent,
  className = "",
}) => {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  const agents = {
    risk: { id: "fraud_risk_engine", name: "AI Risk Engine", role: "0–100 Weighted Triaging", icon: Sparkles, color: "border-gold-400 bg-emerald-900 text-gold-300" },
    verification: { id: "verification_agent", name: "Verification Agent", role: "Cross-Evidence Matrix", icon: Scale, color: "border-emerald-500 bg-emerald-950 text-emerald-300" },
    vision: { id: "vision_agent", name: "Vision Agent", role: "Damage Localization", icon: Camera, color: "border-teal-500 bg-forest-900 text-teal-300" },
    rules: { id: "rules_engine", name: "Rules Engine", role: "Deterministic R01–R05", icon: ShieldCheck, color: "border-emerald-600 bg-emerald-950 text-emerald-300" },
    document: { id: "document_agent", name: "Document Agent", role: "Pydantic & Sanitization", icon: FileText, color: "border-teal-600 bg-forest-900 text-teal-300" },
    pattern: { id: "historical_pattern_agent", name: "Pattern Agent", role: "Recycled Invoices & Velocity", icon: History, color: "border-gold-500 bg-emerald-950 text-gold-300" },
  };

  return (
    <div className={`relative p-4 rounded-2xl bg-gradient-to-b from-emerald-950/90 to-forest-950/95 border border-emerald-800/60 shadow-xl overflow-hidden text-white ${className}`}>
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0B5D4F15_1px,transparent_1px),linear-gradient(to_bottom,#0B5D4F15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-50" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-emerald-900/60 mb-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-gold-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 font-sans">
            AI Orchestration Topology
          </span>
        </div>
        <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>6/6 LIVE</span>
        </span>
      </div>

      {/* Visual Hierarchy Diagram */}
      <div className="relative z-10 flex flex-col items-center space-y-3 py-1">
        {/* Tier 1: AI Risk Engine (Top) */}
        <div
          onMouseEnter={() => setHoveredAgent("risk")}
          onMouseLeave={() => setHoveredAgent(null)}
          onClick={() => onSelectAgent && onSelectAgent(agents.risk.id)}
          className={`cursor-pointer px-3.5 py-2 rounded-xl border transition-all duration-300 shadow-lg flex items-center space-x-2.5 ${agents.risk.color} ${hoveredAgent === "risk" ? "scale-105 ring-2 ring-gold-400/50 shadow-gold-glow" : "hover:border-gold-400"}`}
        >
          <Sparkles className="w-4 h-4 text-gold-300" />
          <div>
            <div className="text-[11px] font-bold tracking-tight">{agents.risk.name}</div>
            <div className="text-[9px] text-emerald-300/80 font-mono">{agents.risk.role}</div>
          </div>
        </div>

        {/* Animated Connector 1 to 2 */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-4 bg-gradient-to-b from-gold-400 to-emerald-400 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 -mt-0.5" />
        </div>

        {/* Tier 2: Verification Agent */}
        <div
          onMouseEnter={() => setHoveredAgent("verification")}
          onMouseLeave={() => setHoveredAgent(null)}
          onClick={() => onSelectAgent && onSelectAgent(agents.verification.id)}
          className={`cursor-pointer px-3.5 py-1.5 rounded-xl border transition-all duration-300 shadow-md flex items-center space-x-2 ${agents.verification.color} ${hoveredAgent === "verification" ? "scale-105 ring-2 ring-emerald-400/50" : "hover:border-emerald-400"}`}
        >
          <Scale className="w-3.5 h-3.5 text-emerald-300" />
          <div>
            <div className="text-[11px] font-bold">{agents.verification.name}</div>
            <div className="text-[9px] text-emerald-400/80 font-mono">{agents.verification.role}</div>
          </div>
        </div>

        {/* Split Connectors: Verification -> Vision & Rules */}
        <div className="w-48 h-4 relative flex items-center justify-center">
          {/* Branching SVG lines */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
            <path
              d="M 96 0 L 96 6 L 36 6 L 36 16"
              fill="none"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="animate-dash-flow"
            />
            <path
              d="M 96 0 L 96 6 L 156 6 L 156 16"
              fill="none"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="animate-dash-flow"
            />
          </svg>
        </div>

        {/* Tier 3: Vision Agent & Rules Engine */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div
            onMouseEnter={() => setHoveredAgent("vision")}
            onMouseLeave={() => setHoveredAgent(null)}
            onClick={() => onSelectAgent && onSelectAgent(agents.vision.id)}
            className={`cursor-pointer p-2 rounded-xl border transition-all duration-300 flex items-center space-x-2 ${agents.vision.color} ${hoveredAgent === "vision" ? "scale-105 ring-2 ring-teal-400/50" : "hover:border-teal-400"}`}
          >
            <Camera className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold truncate">{agents.vision.name}</div>
              <div className="text-[8px] text-teal-400/80 font-mono truncate">{agents.vision.role}</div>
            </div>
          </div>

          <div
            onMouseEnter={() => setHoveredAgent("rules")}
            onMouseLeave={() => setHoveredAgent(null)}
            onClick={() => onSelectAgent && onSelectAgent(agents.rules.id)}
            className={`cursor-pointer p-2 rounded-xl border transition-all duration-300 flex items-center space-x-2 ${agents.rules.color} ${hoveredAgent === "rules" ? "scale-105 ring-2 ring-emerald-400/50" : "hover:border-emerald-400"}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold truncate">{agents.rules.name}</div>
              <div className="text-[8px] text-emerald-400/80 font-mono truncate">{agents.rules.role}</div>
            </div>
          </div>
        </div>

        {/* Connectors to Bottom Tier */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs h-3">
          <div className="flex justify-center">
            <div className="w-0.5 h-full bg-teal-500/60" />
          </div>
          <div className="flex justify-center">
            <div className="w-0.5 h-full bg-gold-500/60" />
          </div>
        </div>

        {/* Tier 4: Document Agent & Pattern Agent */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div
            onMouseEnter={() => setHoveredAgent("document")}
            onMouseLeave={() => setHoveredAgent(null)}
            onClick={() => onSelectAgent && onSelectAgent(agents.document.id)}
            className={`cursor-pointer p-2 rounded-xl border transition-all duration-300 flex items-center space-x-2 ${agents.document.color} ${hoveredAgent === "document" ? "scale-105 ring-2 ring-teal-400/50" : "hover:border-teal-400"}`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold truncate">{agents.document.name}</div>
              <div className="text-[8px] text-teal-400/80 font-mono truncate">Extraction & Sanitizer</div>
            </div>
          </div>

          <div
            onMouseEnter={() => setHoveredAgent("pattern")}
            onMouseLeave={() => setHoveredAgent(null)}
            onClick={() => onSelectAgent && onSelectAgent(agents.pattern.id)}
            className={`cursor-pointer p-2 rounded-xl border transition-all duration-300 flex items-center space-x-2 ${agents.pattern.color} ${hoveredAgent === "pattern" ? "scale-105 ring-2 ring-gold-400/50" : "hover:border-gold-400"}`}
          >
            <History className="w-3.5 h-3.5 text-gold-300 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold truncate">{agents.pattern.name}</div>
              <div className="text-[8px] text-gold-400/80 font-mono truncate">Recycled Hash Graph</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-emerald-300/80">
        <span>Continuous Multimodal Consensus</span>
        <span className="font-mono text-gold-300">~1.9ms DB Sync</span>
      </div>
    </div>
  );
};
