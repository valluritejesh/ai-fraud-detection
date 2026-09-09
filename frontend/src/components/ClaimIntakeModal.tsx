import React, { useState } from "react";
import { X, Upload, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, FileText, Camera } from "lucide-react";
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
  const [claimantName, setClaimantName] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [claimantId, setClaimantId] = useState("");
  const [incidentDate, setIncidentDate] = useState("2026-08-22");
  const [incidentLocation, setIncidentLocation] = useState("Downtown Expressway, Austin, TX");
  const [vehicleMake, setVehicleMake] = useState("Toyota");
  const [vehicleModel, setVehicleModel] = useState("Camry");
  const [vehicleYear, setVehicleYear] = useState(2022);
  const [vehicleVin, setVehicleVin] = useState("4T1B11HK5JU" + Math.floor(100000 + Math.random() * 900000));
  const [claimedAmount, setClaimedAmount] = useState<number>(3200);
  const [vehicleValue, setVehicleValue] = useState<number>(24000);
  const [incidentDescription, setIncidentDescription] = useState("Collision at intersection during heavy rain.");

  const [files, setFiles] = useState<{ file: File; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<"form" | "processing" | "done">("form");
  const [statusMsg, setStatusMsg] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => [...prev, { file: e.target.files![0], type: docType }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCurrentStep("processing");
    setStatusMsg("Step 1/3: Registering Claim in Data Layer...");

    try {
      // 1. Create claim
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

      // 2. Upload evidence files
      if (files.length > 0) {
        setStatusMsg(`Step 2/3: Uploading & Hashing ${files.length} Evidence Artifacts...`);
        for (const item of files) {
          await claimsApi.uploadEvidence(claim.id, item.file, item.type);
        }
      }

      // 3. Trigger multi-agent pipeline
      setStatusMsg("Step 3/3: Running Multi-Agent Investigation Pipeline...");
      await claimsApi.analyzeClaim(claim.id);

      setCurrentStep("done");
      setStatusMsg(`Claim ${claim.id} analyzed successfully!`);
      setTimeout(() => {
        onSuccess(claim.id);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert("Intake failed: " + (err.response?.data?.detail || err.message));
      setIsSubmitting(false);
      setCurrentStep("form");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-md">
      <div className="bg-white border border-cream-700 rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-xl text-forest-700 hover:text-emerald-950 hover:bg-cream-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-cream-600">
          <div className="p-2.5 rounded-2xl bg-forest-800 text-gold-300 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-emerald-950 font-sans tracking-tight">
              New Insurance Claim Intake
            </h3>
            <p className="text-xs text-forest-700">
              Submit FNOL, repair bills, and photos for instant multi-agent triaging
            </p>
          </div>
        </div>

        {currentStep === "processing" ? (
          <div className="py-12 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-cream-500 border-t-forest-800 animate-spin" />
              <Sparkles className="w-6 h-6 text-gold-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-sm font-bold text-emerald-950">{statusMsg}</p>
            <p className="text-xs text-forest-700">
              Document Agent, Vision Agent, Rules Engine & Risk Engine working...
            </p>
          </div>
        ) : currentStep === "done" ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <h4 className="text-lg font-bold text-emerald-950">Intake & Analysis Complete!</h4>
            <p className="text-xs text-forest-700">Opening investigation dossier...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Claimant & Policy Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-forest-900 block mb-1">Claimant Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Michael Vance"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-cream-300/40 border border-cream-600 text-emerald-950 placeholder-forest-800/40 focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label className="font-bold text-forest-900 block mb-1">Policy Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. POL-99210"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-cream-300/40 border border-cream-600 text-emerald-950 placeholder-forest-800/40 focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-forest-900 block mb-1">Year</label>
                <input
                  type="number"
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-cream-300/40 border border-cream-600 text-emerald-950 focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label className="font-bold text-forest-900 block mb-1">Make</label>
                <input
                  type="text"
                  value={vehicleMake}
                  onChange={(e) => setVehicleMake(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-cream-300/40 border border-cream-600 text-emerald-950 focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div className="col-span-2">
                <label className="font-bold text-forest-900 block mb-1">Model</label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-cream-300/40 border border-cream-600 text-emerald-950 focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            {/* VIN */}
            <div>
              <label className="font-bold text-forest-900 block mb-1">Vehicle VIN (17 Characters) *</label>
              <input
                required
                type="text"
                value={vehicleVin}
                onChange={(e) => setVehicleVin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-cream-300/40 border border-cream-600 text-emerald-950 font-mono focus:outline-none focus:border-emerald-700 uppercase"
              />
            </div>

            {/* Financial Amounts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-forest-900 block mb-1">Claimed Damage Amount ($) *</label>
                <input
                  required
                  type="number"
                  value={claimedAmount}
                  onChange={(e) => setClaimedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-cream-300/40 border border-cream-600 text-emerald-950 font-bold focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label className="font-bold text-forest-900 block mb-1">Vehicle Fair Market Value ($)</label>
                <input
                  type="number"
                  value={vehicleValue}
                  onChange={(e) => setVehicleValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-cream-300/40 border border-cream-600 text-emerald-950 font-bold focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            {/* Evidence Attachments Uploader */}
            <div className="pt-2 border-t border-cream-600">
              <label className="font-bold text-forest-900 block mb-2">Multimodal Evidence Attachments</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: "claim_form", label: "Claim Form (FNOL)", icon: FileText },
                  { type: "repair_estimate", label: "Repair Estimate", icon: FileText },
                  { type: "invoice", label: "Final Invoice", icon: FileText },
                  { type: "damage_photo", label: "Damage Photo", icon: Camera },
                ].map((item) => {
                  const Icon = item.icon;
                  const isUploaded = files.some((f) => f.type === item.type);
                  return (
                    <label
                      key={item.type}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        isUploaded
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                          : "bg-cream-300/30 border-cream-600 hover:border-forest-700 text-forest-800"
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1 text-forest-800" />
                      <span className="text-[10px] font-bold">{item.label}</span>
                      <span className="text-[9px] text-forest-700 font-mono mt-0.5">
                        {isUploaded ? "✓ Attached" : "+ Upload"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, item.type)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-cream-600">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-forest-700 hover:text-emerald-950 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-emerald-900 text-gold-300 font-bold text-xs shadow-sm border border-gold-400/30 transition flex items-center space-x-2"
              >
                <span>Submit & Run AI Triaging</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
