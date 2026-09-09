import React, { useState } from "react";
import { X, Upload, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
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
        claimant_name: claimantName,
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

      // 2. Upload files if any
      if (files.length > 0) {
        setStatusMsg(`Step 2/3: Uploading ${files.length} evidence file(s) with SHA-256 verification...`);
        for (const item of files) {
          await claimsApi.uploadEvidence(claim.id, item.file, item.type);
        }
      }

      // 3. Trigger Orchestrator
      setStatusMsg("Step 3/3: Running Parallel Multi-Agent Fraud Detection Pipeline...");
      await claimsApi.analyzeClaim(claim.id);

      setStatusMsg("Analysis Complete! Routing to dashboard.");
      setCurrentStep("done");
      setTimeout(() => {
        onSuccess(claim.id);
        onClose();
      }, 1000);
    } catch (err: any) {
      alert("Intake submission failed: " + (err?.response?.data?.detail || err.message));
      setCurrentStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white">Submit Claim & Trigger AI Investigation</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentStep === "processing" ? (
          <div className="py-12 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-sm font-semibold text-white">{statusMsg}</p>
            <p className="text-xs text-slate-400">
              Coordinating Document Agent, Vision Agent, Historical Pattern Agent, Deterministic Rules, and Verification Agent...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Claimant Full Name *</label>
                <input
                  required
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  placeholder="e.g. Samuel Rodriguez"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Policy ID *</label>
                <input
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  placeholder="e.g. POL-89021"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Vehicle Make</label>
                <input
                  value={vehicleMake}
                  onChange={(e) => setVehicleMake(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Model</label>
                <input
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Year</label>
                <input
                  type="number"
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">VIN (17 chars) *</label>
                <input
                  required
                  value={vehicleVin}
                  onChange={(e) => setVehicleVin(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Date *</label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Claimed Repair Amount ($) *</label>
                <input
                  type="number"
                  required
                  value={claimedAmount}
                  onChange={(e) => setClaimedAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Estimated Vehicle Value ($)</label>
                <input
                  type="number"
                  value={vehicleValue}
                  onChange={(e) => setVehicleValue(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Accident Narrative / Description</label>
              <textarea
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* Evidence Attachments Upload Area */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Attach Supporting Evidence (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-dashed border-slate-700 rounded-lg text-center bg-slate-800/40">
                  <p className="text-[11px] font-semibold text-slate-300 mb-1">Repair Estimate / Invoice</p>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "repair_estimate")}
                    className="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-blue-600 file:text-white"
                  />
                </div>
                <div className="p-3 border border-dashed border-slate-700 rounded-lg text-center bg-slate-800/40">
                  <p className="text-[11px] font-semibold text-slate-300 mb-1">Accident Photograph</p>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "damage_photo")}
                    className="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-blue-600 file:text-white"
                  />
                </div>
              </div>
              {files.length > 0 && (
                <div className="text-[10px] text-emerald-400 font-mono">
                  {files.length} file(s) selected: {files.map(f => `${f.file.name} (${f.type})`).join(", ")}
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow-md shadow-blue-600/30"
              >
                Submit & Analyze Claim
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
