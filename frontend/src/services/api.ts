import axios from "axios";
import { Claim, ClaimDetail, SystemHealth, AuditLog } from "../types";

const getApiBaseUrl = (): string => {
  // 1. Explicit environment variable override
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envBase) {
    return envBase;
  }
  // 2. Standalone Docker frontend running on port 8080 targets backend on port 8000
  if (typeof window !== "undefined" && window.location.port === "8080") {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  // 3. Default: Vite dev server (port 5173 proxied to 8000) or FastAPI serving SPA on port 8000
  return "/api/v1";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

export const claimsApi = {
  listClaims: async (params?: { status?: string; risk_level?: string }): Promise<Claim[]> => {
    const res = await api.get<Claim[]>("/claims", { params });
    if (!Array.isArray(res.data)) {
      console.warn("claimsApi.listClaims received non-array data:", res.data);
      return [];
    }
    return res.data;
  },

  getClaim: async (claimId: string): Promise<ClaimDetail> => {
    const res = await api.get<ClaimDetail>(`/claims/${claimId}`);
    return res.data;
  },

  createClaim: async (payload: Partial<Claim>): Promise<Claim> => {
    const res = await api.post<Claim>("/claims", payload);
    return res.data;
  },

  uploadEvidence: async (claimId: string, file: File, documentType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);
    const res = await api.post(`/claims/${claimId}/evidence`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  analyzeClaim: async (claimId: string): Promise<ClaimDetail> => {
    const res = await api.post<ClaimDetail>(`/claims/${claimId}/analyze`);
    return res.data;
  },

  getAuditTrail: async (claimId: string): Promise<AuditLog[]> => {
    const res = await api.get<AuditLog[]>(`/claims/${claimId}/audit-trail`);
    return res.data;
  },

  syncExternalClaims: async (claimId: string, systemName = "Guidewire ClaimCenter (Mock Adapter)") => {
    const res = await api.post(`/external-claims/sync/${claimId}`, {
      external_system: systemName,
      target_environment: "mock_simulation",
    });
    return res.data;
  },
};

export const investigationApi = {
  addNote: async (claimId: string, text: string, author?: string) => {
    const res = await api.post(`/investigations/claim/${claimId}/notes`, { text, author });
    return res.data;
  },

  overrideRisk: async (claimId: string, overrideScore: number, reason: string, investigator?: string) => {
    const res = await api.post(`/investigations/claim/${claimId}/override`, {
      override_score: overrideScore,
      override_reason: reason,
      investigator,
    });
    return res.data;
  },

  submitFinalDecision: async (claimId: string, decision: string, reason: string, decidedBy?: string) => {
    const res = await api.post(`/investigations/claim/${claimId}/final-decision`, {
      decision,
      reason,
      decided_by: decidedBy,
    });
    return res.data;
  },

  getInvestigationStatus: async (investigationId: string) => {
    const res = await api.get(`/investigations/${investigationId}/status`);
    return res.data;
  },

  getClaimInvestigation: async (claimId: string) => {
    const res = await api.get(`/claims/${claimId}/investigation`);
    return res.data;
  },

  triggerInvestigation: async (claimId: string) => {
    const res = await api.post(`/investigations/trigger/${claimId}`);
    return res.data;
  },

  getStreamUrl: (investigationId: string) => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    let host = window.location.host;
    if (typeof window !== "undefined" && window.location.port === "8080") {
      host = `${window.location.hostname}:8000`;
    }
    return `${proto}//${host}/api/v1/investigations/${investigationId}/stream`;
  },
};

export const healthApi = {
  getHealth: async (): Promise<SystemHealth> => {
    const res = await api.get<SystemHealth>("/health");
    return res.data;
  },
};
