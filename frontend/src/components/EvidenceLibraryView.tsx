import React, { useState } from "react";
import {
  FileStack,
  Search,
  Camera,
  FileText,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import { Claim, Evidence } from "../types";

interface EvidenceLibraryViewProps {
  claims: Claim[];
  onOpenClaimDossier: (claimId: string) => void;
}

export const EvidenceLibraryView: React.FC<EvidenceLibraryViewProps> = ({
  claims,
  onOpenClaimDossier,
}) => {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [selectedPreview, setSelectedPreview] = useState<{
    id: string;
    filename: string;
    claimId: string;
    type: string;
    hash: string;
    size: string;
    ocr: string;
  } | null>(null);

  // Synthesize evidence items from known claims & benchmark scenarios
  const evidenceItems = [
    {
      id: "EV-90200-01",
      claimId: "CLM-SCENARIO-B",
      filename: "claim_form_clm90200.pdf",
      type: "claim_form",
      size: "1.8 MB",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      ocr: "100%",
      status: "VERIFIED",
      flag: "Loss Date: 2026-03-01",
    },
    {
      id: "EV-90200-02",
      claimId: "CLM-SCENARIO-B",
      filename: "repair_estimate_apex.pdf",
      type: "repair_estimate",
      size: "2.4 MB",
      hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      ocr: "98%",
      status: "INFLATED",
      flag: "Labor Ratio 78% (Rule R02)",
    },
    {
      id: "EV-90200-03",
      claimId: "CLM-SCENARIO-B",
      filename: "invoice_90200_recycled.pdf",
      type: "invoice",
      size: "1.2 MB",
      hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
      ocr: "96%",
      status: "RECYCLED",
      flag: "Duplicate Invoice Match (Rule R04)",
    },
    {
      id: "EV-90200-04",
      claimId: "CLM-SCENARIO-B",
      filename: "photo_front_cam.jpg",
      type: "damage_photo",
      size: "3.6 MB",
      hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      ocr: "95%",
      status: "CONFLICT",
      flag: "Minor Scuff vs Full Replacement (Rule R05)",
    },
    {
      id: "EV-90100-01",
      claimId: "CLM-SCENARIO-A",
      filename: "claim_form_legit.pdf",
      type: "claim_form",
      size: "1.4 MB",
      hash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      ocr: "100%",
      status: "VERIFIED",
      flag: "All Fields Consistent",
    },
    {
      id: "EV-90100-02",
      claimId: "CLM-SCENARIO-A",
      filename: "repair_estimate_legit.pdf",
      type: "repair_estimate",
      size: "2.1 MB",
      hash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
      ocr: "99%",
      status: "VERIFIED",
      flag: "Labor Ratio 38% (Normal)",
    },
    {
      id: "EV-90600-01",
      claimId: "CLM-SCENARIO-F",
      filename: "statement_adversarial.txt",
      type: "witness_statement",
      size: "450 KB",
      hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      ocr: "100%",
      status: "SANITIZED",
      flag: "Indirect Injection Neutralized (Rule SEC-01)",
    },
    {
      id: "EV-90300-01",
      claimId: "CLM-SCENARIO-C",
      filename: "police_report_staged.pdf",
      type: "police_report",
      size: "3.1 MB",
      hash: "96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e",
      ocr: "94%",
      status: "FLAGGED",
      flag: "Uninhabited Road Anomaly",
    },
  ];

  const filtered = evidenceItems.filter((item) => {
    const matchType = filterType === "ALL" || item.type === filterType;
    const matchSearch =
      !search ||
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      item.claimId.toLowerCase().includes(search.toLowerCase()) ||
      item.hash.toLowerCase().includes(search.toLowerCase()) ||
      item.flag.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-cream-700/80 shadow-card-soft">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-black text-forest-950 font-sans tracking-tight flex items-center space-x-2">
              <FileStack className="w-5 h-5 text-forest-800" />
              <span>MULTIMODAL EVIDENCE REPOSITORY</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              TAMPER-EVIDENT
            </span>
          </div>
          <p className="text-xs text-forest-700 font-medium mt-0.5">
            Cross-claim cryptographic hash indexing, OCR extraction schemas, and forensic document inspection
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-forest-800 font-bold bg-cream-200 px-3 py-1.5 rounded-xl border border-cream-600">
            {evidenceItems.length} Hashed Artifacts
          </span>
        </div>
      </div>

      {/* Filter & Search Ribbon */}
      <div className="p-4 bg-white/95 rounded-3xl border border-cream-700/80 shadow-card-soft space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700/60 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename, claim ID, SHA-256 hash, or flag..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-cream-100/60 border border-cream-600/80 text-forest-950 placeholder-forest-700/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "All Evidence" },
              { id: "claim_form", label: "Claim Forms" },
              { id: "repair_estimate", label: "Repair Estimates" },
              { id: "invoice", label: "Invoices" },
              { id: "damage_photo", label: "Damage Photos" },
              { id: "police_report", label: "Police Reports" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  filterType === t.id
                    ? "bg-forest-950 text-white shadow-sm"
                    : "bg-cream-100 text-forest-800 hover:bg-cream-200 border border-cream-600/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Evidence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedPreview(item)}
            className="p-5 rounded-3xl bg-white/95 border border-cream-700/80 shadow-card-soft hover:shadow-card-elevated transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-forest-900/10 text-forest-900 border border-forest-700/20 group-hover:scale-105 transition-transform">
                  {item.type === "damage_photo" ? (
                    <Camera className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <FileText className="w-5 h-5 text-forest-800" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black text-forest-950 truncate max-w-[170px]" title={item.filename}>
                    {item.filename}
                  </h4>
                  <p className="text-[10px] text-forest-700 font-mono mt-0.5">
                    {item.type.replace("_", " ").toUpperCase()} · {item.size}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[9px] font-black font-mono border ${
                  item.status === "VERIFIED"
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : item.status === "SANITIZED"
                    ? "bg-purple-100 text-purple-950 border-purple-300"
                    : "bg-rose-100 text-rose-950 border-rose-300"
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-cream-100/70 border border-cream-600/70 text-xs space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-forest-800">
                <span>Bound Claim:</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenClaimDossier(item.claimId);
                  }}
                  className="font-bold text-emerald-800 hover:underline flex items-center space-x-1"
                >
                  <span>{item.claimId}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[11px] text-forest-950 font-medium">
                {item.flag}
              </div>
            </div>

            <div className="pt-2 border-t border-cream-600/60 flex items-center justify-between text-[10px] font-mono text-forest-700">
              <span className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-forest-800" />
                <span>{item.hash.slice(0, 12)}...</span>
              </span>
              <span className="text-emerald-800 font-bold group-hover:underline flex items-center space-x-1">
                <span>Inspect Forensic</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Forensic Inspection Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-cream-700 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cream-600/70 pb-3">
              <div>
                <h3 className="text-base font-black text-forest-950 font-sans">
                  Forensic Artifact Inspector: {selectedPreview.filename}
                </h3>
                <p className="text-xs text-forest-700 font-mono">
                  SHA-256 Hash Integrity Verified · [LOCAL DEMO / MOCK]
                </p>
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-3 py-1 rounded-xl bg-cream-300 hover:bg-cream-400 text-forest-900 font-bold text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-cream-100 rounded-2xl border border-cream-600 space-y-2">
                <div className="flex justify-between">
                  <span className="text-forest-700">Artifact ID:</span>
                  <span className="font-bold text-forest-950">{selectedPreview.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest-700">Bound Claim:</span>
                  <span className="font-bold text-emerald-800">{selectedPreview.claimId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest-700">Document Type:</span>
                  <span className="font-bold text-forest-950">{selectedPreview.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest-700">OCR Confidence:</span>
                  <span className="font-bold text-emerald-800">{selectedPreview.ocr}</span>
                </div>
                <div className="pt-2 border-t border-cream-600">
                  <span className="text-forest-700 block mb-1">Cryptographic Hash (SHA-256):</span>
                  <span className="text-[10px] break-all bg-white p-2 rounded-xl border block text-forest-950">
                    {selectedPreview.hash}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => {
                    onOpenClaimDossier(selectedPreview.claimId);
                    setSelectedPreview(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-forest-950 text-gold-300 font-bold text-xs hover:bg-forest-900 transition flex items-center space-x-1.5"
                >
                  <span>Open Full Claim Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
