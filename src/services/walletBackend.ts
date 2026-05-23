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
  return apiRequest<{
    profile: {
      kyc_status?: string;
      full_name?: string;
      avatar_gradient?: string;
      avatar_character?: string;
      avatar_url?: string;
      onboarding_complete?: boolean;
    };
  }>("/api/profile");
}

export type WalletNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  amount?: number;
  token?: string;
  fromWallet?: string;
  readAt?: string | null;
  createdAt: string;
};

export async function updateProfileInBackend(profile: {
  fullName?: string;
  avatarGradient?: string;
  avatarCharacter?: string;
  avatarUrl?: string;
  kycStatus?: string;
  onboardingComplete?: boolean;
}) {
  return apiRequest<{
    profile: {
      kyc_status?: string;
      full_name?: string;
      avatar_gradient?: string;
      avatar_character?: string;
      avatar_url?: string;
      onboarding_complete?: boolean;
    };
  }>("/api/profile", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function fetchNotificationsFromBackend() {
  return apiRequest<{ notifications: WalletNotification[] }>("/api/notifications");
}

export async function dismissNotification(id: string) {
  return apiRequest<{ ok: boolean }>("/api/notifications", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ ok: boolean }>("/api/notifications", {
    method: "POST",
    body: JSON.stringify({ markAllRead: true }),
  });
}

export async function fetchReferralInfo() {
  return apiRequest<{ code: string; link: string; referredBy: string | null; wallet: string }>("/api/referral");
}

export async function applyReferralCode(code: string) {
  return apiRequest<{ ok: boolean; message: string; referredBy: string }>("/api/referral", {
    method: "POST",
    body: JSON.stringify({ code }),
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

export async function verifyPaystackDeposit(reference: string, walletId: string, fiatUsd?: number) {
  return apiRequest<{ wallets: Wallet[] }>("/api/paystack/verify", {
    method: "POST",
    body: JSON.stringify({ reference, walletId, fiatUsd }),
  });
}

export type PayRecipient = {
  wallet: string;
  fullName: string;
  avatarUrl: string | null;
  avatarCharacter: string | null;
  avatarGradient: string | null;
  symbol: string;
  walletKey: string;
  network: string;
};

export async function lookupPayRecipient(account: string, symbol?: string, walletKey?: string, network?: string) {
  const params = new URLSearchParams({ account });
  if (symbol) params.set("symbol", symbol);
  if (walletKey) params.set("wallet", walletKey);
  if (network) params.set("network", network);
  return apiRequest<{ recipient: PayRecipient }>(`/api/pay/lookup?${params.toString()}`);
}

export async function swapWalletAssets(fromWalletKey: string, toWalletKey: string, amount: number) {
  return apiRequest<{ wallets: Wallet[]; received: number; receivedToken: string }>("/api/swap", {
    method: "POST",
    body: JSON.stringify({ fromWalletKey, toWalletKey, amount }),
  });
}
