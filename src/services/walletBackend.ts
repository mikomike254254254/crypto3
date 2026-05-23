import { supabase } from "../lib/supabase";
import type { P2pTrader } from "../lib/p2pTrader";
import { parseP2pTrader } from "../lib/p2pTrader";
import { Transaction, Wallet } from "../types/crypto";

async function authHeaders(forceRefresh = false): Promise<Record<string, string>> {
  if (forceRefresh) {
    await supabase.auth.refreshSession().catch(() => undefined);
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(path: string, init: RequestInit = {}, allowEmptyOn401 = false): Promise<T> {
  const run = async (refresh: boolean) => {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    Object.entries(await authHeaders(refresh)).forEach(([key, value]) => headers.set(key, value));
    return fetch(path, { ...init, headers });
  };

  let response = await run(false);
  if (response.status === 401) {
    response = await run(true);
  }

  if (response.status === 401 && allowEmptyOn401) {
    return {} as T;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Wallet backend request failed");
  }

  return response.json();
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

export async function fetchWalletsFromBackend() {
  const data = await apiRequest<{ wallets: Wallet[]; p2pTrader?: P2pTrader }>("/api/wallets", {}, true);
  return {
    wallets: data.wallets || [],
    p2pTrader: parseP2pTrader(data.p2pTrader),
  };
}

export async function fetchTransactionsFromBackend() {
  const data = await apiRequest<{ transactions: Transaction[] }>("/api/transactions", {}, true);
  return { transactions: data.transactions || [] };
}

export async function fetchNotificationsFromBackend() {
  const data = await apiRequest<{ notifications: WalletNotification[] }>("/api/notifications", {}, true);
  return { notifications: data.notifications || [] };
}

export async function createP2pOrder(amount: number, side: "buy" | "sell", traderName: string) {
  const type = side === "buy" ? "deposit" : "withdraw";
  return apiRequest<{ wallets: Wallet[] }>("/api/transactions", {
    method: "POST",
    body: JSON.stringify({
      type,
      walletId: "usdt",
      amount,
      address: `P2P:${traderName}`,
      network: "P2P",
    }),
  });
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
