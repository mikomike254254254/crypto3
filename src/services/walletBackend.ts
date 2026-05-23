import { supabase } from "../lib/supabase";
import { Transaction, Wallet } from "../types/crypto";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  Object.entries(await authHeaders()).forEach(([key, value]) => headers.set(key, value));

  const response = await fetch(path, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Wallet backend request failed");
  }

  return response.json();
}

export async function fetchWalletsFromBackend() {
  return apiRequest<{ wallets: Wallet[] }>("/api/wallets");
}

export async function fetchTransactionsFromBackend() {
  return apiRequest<{ transactions: Transaction[] }>("/api/transactions");
}

export async function createWalletTransaction(
  type: "deposit" | "withdraw" | "send",
  walletId: string,
  amount: number,
  options: { address?: string; network?: string } = {},
) {
  return apiRequest<{ wallets: Wallet[] }>("/api/transactions", {
    method: "POST",
    body: JSON.stringify({ type, walletId, amount, ...options }),
  });
}

export async function fetchProfileFromBackend() {
  return apiRequest<{ profile: { kyc_status?: string; full_name?: string; avatar_gradient?: string } }>("/api/profile");
}

export async function updateProfileInBackend(profile: { fullName?: string; avatarGradient?: string; kycStatus?: string }) {
  return apiRequest<{ profile: { kyc_status?: string; full_name?: string; avatar_gradient?: string } }>("/api/profile", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function submitKycToBackend(payload: {
  documentType: string;
  legalName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  frontImage: string;
  backImage: string;
  selfieImage: string;
}) {
  return apiRequest<{ submission: { id: string; status: string } }>("/api/kyc", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyPaystackDeposit(reference: string, walletId: string) {
  return apiRequest<{ wallets: Wallet[] }>("/api/paystack/verify", {
    method: "POST",
    body: JSON.stringify({ reference, walletId }),
  });
}
