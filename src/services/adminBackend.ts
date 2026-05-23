import { supabase } from "../lib/supabase";
import { Wallet } from "../types/crypto";

export type AdminUser = {
  id: string;
  email?: string;
  name: string;
  walletAddress: string;
  kycStatus: "not_started" | "pending" | "verified" | "rejected";
  createdAt: string;
  wallets: Wallet[];
  totalUsd: number;
};

export type AdminTransaction = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string;
  address?: string;
  createdAt: string;
  walletKey?: string;
};

export type AdminDashboardData = {
  totals: {
    users: number;
    tvl: number;
    pendingKyc: number;
    transactions: number;
  };
  users: AdminUser[];
  transactions: AdminTransaction[];
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminRequest(init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  Object.entries(await authHeaders()).forEach(([key, value]) => headers.set(key, value));

  const response = await fetch("/api/admin", { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Admin request failed");
  }

  return response.json() as Promise<AdminDashboardData>;
}

export function fetchAdminDashboard() {
  return adminRequest();
}

export function runAdminAction(payload: Record<string, unknown>) {
  return adminRequest({
    method: "POST",
    body: JSON.stringify(payload),
  });
}
