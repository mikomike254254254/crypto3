import { createClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";

function resolveWallexOrigin() {
  const configured = (process.env.VITE_APP_URL || "").replace(/\/$/, "");
  if (configured && !/\.vercel\.app$/i.test(configured) && !configured.includes("wallex-online-new")) {
    return configured;
  }
  return "https://wallex.online";
}

export const WALLEX_ORIGIN = resolveWallexOrigin();

export const walletAssets = [
  { wallet_key: "usdt", name: "USDT Wallet", symbol: "USDT", change: 0.4, color: "green" },
  { wallet_key: "xrp", name: "XRP Wallet", symbol: "XRP", change: 1.1, color: "blue" },
  { wallet_key: "btc", name: "BTC Wallet", symbol: "BTC", change: -2.1, color: "orange" },
  { wallet_key: "eth", name: "ETH Wallet", symbol: "ETH", change: 3.8, color: "blue" },
];

export const SWAP_RATES_USD: Record<string, number> = {
  USDT: 1,
  XRP: 0.52,
  BTC: 67432,
  ETH: 3521,
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function adminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireUser(req: VercelRequest) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("Missing bearer token.");
  }

  const supabase = adminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Invalid session.");
  }

  return data.user;
}

export function toClientWallet(row: any) {
  return {
    id: row.wallet_key,
    name: row.name,
    symbol: row.symbol,
    balance: Number(row.balance),
    change: Number(row.change),
    color: row.color,
    accountNumber: row.account_number,
    address: row.address,
  };
}

export function walletAddressForUserId(userId: string) {
  return `r${userId.replace(/-/g, "")}`;
}

export function walletAddressForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return `e${hash.toString(16).padStart(12, "0")}`;
}

export function buildWallexPayLink(wallet: string, symbol: string, walletKey: string, network = "TRC20") {
  const params = new URLSearchParams({
    account: wallet,
    wallet: walletKey,
    symbol,
    network,
  });
  return `${WALLEX_ORIGIN}/pay?${params.toString()}`;
}

export function isKycVerified(status?: string) {
  return status === "verified";
}

function isMissingColumnError(error: { message?: string }) {
  const msg = (error.message || "").toLowerCase();
  return msg.includes("column") || msg.includes("schema cache");
}

export async function createNotification(
  authUserId: string,
  payload: { type: string; title: string; body: string; amount?: number; token?: string; fromWallet?: string },
) {
  if (!authUserId) return;

  const supabase = adminClient();
  const message = [payload.title, payload.body].filter(Boolean).join(": ").trim() || payload.title || "Wallex";
  const extras = {
    amount: payload.amount ?? null,
    token: payload.token ?? null,
    from_wallet: payload.fromWallet ?? null,
  };

  const attempts: Record<string, unknown>[] = [
    { user_id: authUserId, type: payload.type, message, ...extras },
    { user_id: authUserId, type: payload.type, message },
    {
      user_id: authUserId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      ...extras,
    },
    {
      auth_user_id: authUserId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      ...extras,
    },
    { auth_user_id: authUserId, type: payload.type, title: payload.title, body: payload.body },
  ];

  for (const row of attempts) {
    const { error } = await supabase.from("notifications").insert(row);
    if (!error) return;
    if (!isMissingColumnError(error)) return;
  }
}

export function normalizeKycStatus(status?: string) {
  if (status === "verified" || status === "pending" || status === "rejected") {
    return status;
  }

  return "not_started";
}

export function toDatabaseKycStatus(status?: string) {
  return status === "not_started" ? "unverified" : status || "unverified";
}

export async function ensureUserAccount(user: Awaited<ReturnType<typeof requireUser>>) {
  const supabase = adminClient();
  const { data: existing, error: readError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing;

  const wallet = walletAddressForUserId(user.id);
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Wallet User";

  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert({
      auth_user_id: user.id,
      wallet,
      email: user.email,
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url || null,
      kyc_status: "unverified",
      signup_bonus_awarded: false,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;

  await upsertBalance(wallet, 0);

  const { awardSignupBonuses } = await import("./_bonuses.js");
  await awardSignupBonuses(inserted);

  return inserted;
}

export async function upsertBalance(wallet: string, amount: number) {
  const supabase = adminClient();
  const { error } = await supabase
    .from("balances")
    .upsert({ wallet, amount, updated_at: new Date().toISOString() }, { onConflict: "wallet" });

  if (error) throw error;
}

export function balancesFromTransactions(transactions: any[], wallet: string) {
  const balances = new Map<string, number>();

  for (const tx of transactions) {
    const token = String(tx.token || "USDT").toUpperCase();
    const amount = Number(tx.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0 || tx.status === "failed") continue;

    if (tx.to_wallet === wallet && tx.status === "completed") {
      balances.set(token, (balances.get(token) || 0) + amount);
    }

    if (tx.from_wallet === wallet) {
      balances.set(token, (balances.get(token) || 0) - amount);
    }
  }

  return balances;
}

export async function readTokenBalances(wallet: string) {
  const supabase = adminClient();
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .or(`from_wallet.eq.${wallet},to_wallet.eq.${wallet}`)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return balancesFromTransactions(transactions || [], wallet);
}

export function getP2pTraderConfig() {
  const rate = Number(process.env.P2P_TRADER_RATE || "15.9");
  const currency = process.env.P2P_TRADER_RATE_CURRENCY || "CAD";
  const symbol = currency === "CAD" ? "C$" : currency === "USD" ? "$" : `${currency} `;
  return {
    id: "jeff",
    name: process.env.P2P_TRADER_NAME || "Jeff",
    online: process.env.P2P_TRADER_ONLINE !== "false",
    verified: true,
    countryCode: "KE",
    countryName: "Kenya",
    rate,
    rateCurrency: currency,
    rateDisplay: `${symbol}${rate.toFixed(2)}`,
    kesPerUsdt: Number(process.env.P2P_KES_PER_USDT || "129.5"),
    completedTrades: Number(process.env.P2P_TRADER_TRADES || "1248"),
    responseMins: Number(process.env.P2P_TRADER_RESPONSE_MINS || "3"),
  };
}

export async function buildClientWallets(userRow: any) {
  const balances = await readTokenBalances(userRow.wallet);

  return walletAssets.map((asset) => ({
    id: asset.wallet_key,
    name: asset.name,
    symbol: asset.symbol,
    balance: Number((balances.get(asset.symbol) || 0).toFixed(8)),
    change: asset.change,
    color: asset.color,
    accountNumber: userRow.wallet,
    address: buildWallexPayLink(userRow.wallet, asset.symbol, asset.wallet_key),
  }));
}
