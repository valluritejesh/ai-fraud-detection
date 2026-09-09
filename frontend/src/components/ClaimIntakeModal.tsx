import React, { useState } from "react";
import {
  X,
  Upload,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  FileText,
  Camera,
  Cpu,
  Lock,
  ArrowRight,
  Plus,
  Trash2
} from "lucide-react";
import { claimsApi } from "../services/api";

interface ClaimIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (claimId: string) => void;
}

export const ClaimIntakeModal: React.FC<ClaimIntakeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [claimantName, setClaimantName] = useState("Jonathan Miller");
  const [policyId, setPolicyId] = useState("POL-88210");
  const [claimantId, setClaimantId] = useState("CUST-5512");
  const [incidentDate, setIncidentDate] = useState("2026-08-28");
  const [incidentLocation, setIncidentLocation] = useState("Interstate 35 & 6th St, Austin, TX");
  const [vehicleMake, setVehicleMake] = useState("Tesla");
  const [vehicleModel, setVehicleModel] = useState("Model 3");
  const [vehicleYear, setVehicleYear] = useState(2023);
  const [vehicleVin, setVehicleVin] = useState("5YJ3E1EB8NF" + Math.floor(100000 + Math.random() * 900000));
  const [claimedAmount, setClaimedAmount] = useState<number>(5400);
  const [vehicleValue, setVehicleValue] = useState<number>(38000);
  const [incidentDescription, setIncidentDescription] = useState("Rear-ended at stoplight during rush hour congestion.");

  const [files, setFiles] = useState<{ file: File; type: string; status: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(1);
  const [statusMsg, setStatusMsg] = useState("");
  const [createdClaimId, setCreatedClaimId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setFiles((prev) => [
        ...prev,
        { file: newFile, type: docType, status: "Verified" }
      ]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const steps = [
    { num: 1, label: "Claim Details" },
    { num: 2, label: "Evidence Upload" },
    { num: 3, label: "AI Extraction" },
    { num: 4, label: "Cross Verification" },
    { num: 5, label: "Risk Analysis" },
    { num: 6, label: "Investigator Review" },
  ];

  const handleStartPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Stage 1: Register Claim
      setPipelineProgress(1);
      setStatusMsg("Stage 1/6: Registering Claim in Data Layer...");
      const claim = await claimsApi.createClaim({
        policy_id: policyId || `POL-${Math.floor(10000 + Math.random() * 90000)}`,
        claimant_id: claimantId || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        claimant_name: claimantName || "Anonymous Claimant",
        incident_date: incidentDate,
        incident_location: incidentLocation,
        incident_description: incidentDescription,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: Number(vehicleYear),
        vehicle_vin: vehicleVin,
        estimated_vehicle_value: Number(vehicleValue),
        claimed_amount: Number(claimedAmount),
      });
      setCreatedClaimId(claim.id);

      // Stage 2: Evidence Upload & Hashing
      setPipelineProgress(2);
      setStatusMsg(`Stage 2/6: Uploading & SHA-256 Hashing ${files.length} Evidence Artifacts...`);
      if (files.length > 0) {
        for (const item of files) {
          await claimsApi.uploadEvidence(claim.id, item.file, item.type);
        }
      }

      // Stage 3: AI Document Extraction
      setPipelineProgress(3);
      setStatusMsg("Stage 3/6: Document Agent Parsing OCR & Line Items...");
      await new Promise((r) => setTimeout(r, 600));

      // Stage 4: Cross Verification
      setPipelineProgress(4);
      setStatusMsg("Stage 4/6: Verification Agent Cross-Checking Dates & Labor Ratios...");
      await new Promise((r) => setTimeout(r, 600));

      // Stage 5: Risk Analysis
      setPipelineProgress(5);
      setStatusMsg("Stage 5/6: Risk Engine Synthesizing Multi-Agent Consensus...");
      await claimsApi.analyzeClaim(claim.id);

      // Stage 6: Investigator Review Complete
      setPipelineProgress(6);
      setStatusMsg(`Stage 6/6: Triage Complete! Claim ${claim.id} Ready for Review.`);

      setTimeout(() => {
        onSuccess(claim.id);
        onClose();
      }, 1400);
    } catch (err: any) {
      alert("Intake failed: " + (err.response?.data?.detail || err.message));
      setIsSubmitting(false);
      setPipelineProgress(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-cream-700 rounded-3xl shadow-2xl max-w-3xl w-full p-6 md:p-8 max-h-[92vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-xl text-forest-700 hover:text-forest-950 hover:bg-cream-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="border-b border-cream-600/70 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 font-mono">
              AI-POWERED CLAIM INTAKE
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-forest-950 font-sans tracking-tight mt-0.5">
            Submit New Insurance Claim & Launch Multi-Agent Triage
          </h2>
          <p className="text-xs text-forest-700 mt-1">
            Automated document ingestion, SHA-256 cryptographic verification, and instant risk scoring
          </p>
        </div>

        {/* 6-Step Visual Progress Bar */}
        <div className="mb-6 bg-cream-100/70 p-4 rounded-2xl border border-cream-600/70">
          <div className="grid grid-cols-6 gap-2">
            {steps.map((s) => {
              const isPastOrCurrent = isSubmitting ? pipelineProgress >= s.num : activeStep >= s.num;
              const isCurrent = isSubmitting ? pipelineProgress === s.num : activeStep === s.num;
              return (
                <div key={s.num} className="text-center space-y-1">
                  <div
                    className={`w-7 h-7 mx-auto rounded-full text-xs font-mono font-bold flex items-center justify-center transition-all ${
                      isCurrent
                        ? "bg-forest-950 text-gold-300 ring-2 ring-gold-400 scale-105"
                        : isPastOrCurrent
                        ? "bg-emerald-700 text-white"
                        : "bg-cream-300 text-forest-700"
                    }`}
                  >
                    {isSubmitting && pipelineProgress > s.num ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      s.num
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-forest-900 leading-tight hidden sm:block">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        {isSubmitting ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-forest-950 text-gold-300 flex items-center justify-center mx-auto shadow-gold-glow animate-pulse">
              <Cpu className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-forest-950 font-sans">
                {statusMsg}
              </h3>
              <p className="text-xs text-forest-700 font-mono">
                Multi-Agent Workers analyzing multimodal evidence artifacts...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStartPipeline} className="space-y-6">
            {/* Step 1: Claim Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans border-b border-cream-600/60 pb-1.5">
                1. Claimant & Incident Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-forest-900 block mb-1">Claimant Name:</label>
                  <input
                    type="text"
                    required
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    className="w-full bg-cream-100/60 border border-cream-600/80 rounded-xl px-3 py-2 text-xs text-forest-950 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-900 block mb-1">Policy ID:</label>
                  <input
                    type="text"
                    required
                    value={policyId}
                    onChange={(e) => setPolicyId(e.target.value)}
                    className="w-full bg-cream-100/60 border border-cream-600/80 rounded-xl px-3 py-2 text-xs text-forest-950 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-900 block mb-1">Incident Date:</label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-cream-100/60 border border-cream-600/80 rounded-xl px-3 py-2 text-xs text-forest-950 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-bold text-forest-900 block mb-1">Vehicle Make:</label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full bg-cream-100/60 border border-cream-600/80 rounded-xl px-3 py-2 text-xs text-forest-950 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-900 block mb-1">Model:</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full bg-cream-100/60 border border-cream-600/80 rounded-xl px-3 py-2 text-xs text-forest-950 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-900 block mb-1">Year:</label>
                  <input
                    type="number"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(Number(e.target.value))}
                    className="w-full bg-cream-100/60 border border-cream-600/80 rounded-xl px-3 py-2 text-xs text-forest-950 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-900 block mb-1">VIN:</label>
                  <input
                    type="text"
                    value={vehicleVin}
                    onChange={(e) => setVehicleVin(e.target.value)}
                    className="w-full bg-cream-100/60 border border-cream-600/80 rounded-xl px-3 py-2 text-xs text-forest-950 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-forest-900 block mb-1">Estimated Vehicle FMV ($):</label>
                  <input
                    type="number"
                    value={vehicleValue}
                    onChange={(e) => setVehicleValue(Number(e.target.value))}
                    className="w-full bg-cream-100/60 border border-cream-600/80 rounded-xl px-3 py-2 text-xs text-forest-950 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-900 block mb-1">Claimed Repair Amount ($):</label>
                  <input
                    type="number"
                    value={claimedAmount}
                    onChange={(e) => setClaimedAmount(Number(e.target.value))}
                    className="w-full bg-cream-100/60 border border-cream-600/80 rounded-xl px-3 py-2 text-xs text-forest-950 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Multimodal Evidence Upload */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-cream-600/60 pb-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-forest-950 font-sans">
                  2. Multimodal Evidence Ingestion & Cryptographic Hashing
                </h3>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-forest-700">
                  <span>SHA-256</span>
                  <span>•</span>
                  <span>MIME Validated</span>
                  <span>•</span>
                  <span>25MB Limit</span>
                </div>
              </div>

              {/* Drag & Drop Surface */}
              <div className="p-6 rounded-3xl border-2 border-dashed border-cream-700 hover:border-emerald-700 transition-colors bg-cream-100/50 text-center space-y-3">
                <Upload className="w-8 h-8 text-forest-800 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-forest-950">
                    DRAG & DROP EVIDENCE ARTIFACTS
                  </p>
                  <p className="text-[11px] text-forest-700">
                    Supports Claim Forms, Repair Estimates, Parts Invoices, Police Reports, and Accident Photos
                  </p>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white border border-cream-600 hover:bg-cream-200 text-forest-900 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs">
                    <FileText className="w-3.5 h-3.5 text-forest-800" />
                    <span>+ Claim Form</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileAdd(e, "claim_form")}
                    />
                  </label>

                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white border border-cream-600 hover:bg-cream-200 text-forest-900 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs">
                    <FileText className="w-3.5 h-3.5 text-emerald-800" />
                    <span>+ Repair Estimate</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileAdd(e, "repair_estimate")}
                    />
                  </label>

                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white border border-cream-600 hover:bg-cream-200 text-forest-900 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs">
                    <FileText className="w-3.5 h-3.5 text-amber-800" />
                    <span>+ Invoice</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileAdd(e, "invoice")}
                    />
                  </label>

                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white border border-cream-600 hover:bg-cream-200 text-forest-900 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs">
                    <Camera className="w-3.5 h-3.5 text-rose-800" />
                    <span>+ Damage Photo</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileAdd(e, "damage_photo")}
                    />
                  </label>
                </div>
              </div>

              {/* Uploaded Files Table */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-forest-800 font-mono">
                    Staged Evidence Artifacts ({files.length}):
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {files.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-cream-600 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold text-forest-950">{item.file.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cream-200 text-forest-800">
                            {item.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] text-emerald-800 font-bold">
                            {(item.file.size / 1024).toFixed(0)} KB · Ready
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-cream-600 flex items-center justify-between">
              <span className="text-[11px] font-mono text-forest-700">
                Mode: [LOCAL DEMO / MOCK]
              </span>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-forest-800 hover:from-emerald-700 hover:to-forest-700 text-white font-black text-xs shadow-lg shadow-emerald-950/20 active:scale-95 transition-all flex items-center space-x-2"
              >
                <span>Launch Multi-Agent Investigation Pipeline</span>
                <ArrowRight className="w-4 h-4 text-gold-300" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
