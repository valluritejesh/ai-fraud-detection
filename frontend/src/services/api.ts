import axios from "axios";
import { Claim, ClaimDetail, SystemHealth, AuditLog } from "../types";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 30000,
});

export const claimsApi = {
  listClaims: async (params?: { status?: string; risk_level?: string }): Promise<Claim[]> => {
    const res = await api.get<Claim[]>("/claims", { params });
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
};

export const healthApi = {
  getHealth: async (): Promise<SystemHealth> => {
    const res = await api.get<SystemHealth>("/health");
    return res.data;
  },
};
