import { readAdminSession } from "../lib/adminSession";
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
  fromWallet?: string;
  toWallet?: string;
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

export async function loginAdminPanel(email: string, password: string) {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Admin login failed");
  }

  return response.json() as Promise<{ token: string; email: string; expiresAt: number }>;
}

async function adminRequest(init: RequestInit = {}) {
  const session = readAdminSession();
  if (!session) {
    throw new Error("Admin access denied. Sign in at /mikeadmin with your admin password.");
  }

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Admin-Token", session.token);

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
