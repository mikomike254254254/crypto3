import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdminPanelToken } from "./adminAuth.js";
import {
  adminClient,
  balancesFromTransactions,
  createNotification,
  normalizeKycStatus,
  readTokenBalances,
  upsertBalance,
  walletAssets,
} from "./_supabase.js";

type AdminAction = "set_balance" | "award" | "create_transaction" | "update_kyc" | "wallet_transfer";

function requireAdminPanel(req: VercelRequest) {
  const token = String(req.headers["x-admin-token"] || "");
  const session = verifyAdminPanelToken(token);
  if (!session) {
    throw new Error("Admin access denied. Sign in at /mikeadmin with your admin password.");
  }
  return session;
}

function userLabel(name?: string, email?: string) {
  return name || email?.split("@")[0] || "Wallet user";
}

async function listAuthUsers() {
  const supabase = adminClient();
  try {
    const users: { id: string; email?: string; user_metadata?: Record<string, string> }[] = [];
    let page = 1;

    while (page <= 10) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw error;

      users.push(...data.users);
      if (data.users.length < 100) break;
      page += 1;
    }

    return users;
  } catch {
    return [];
  }
}

function buildWallets(wallet: string, balances: Map<string, number>) {
  return walletAssets.map((asset) => ({
    id: asset.wallet_key,
    name: asset.name,
    symbol: asset.symbol,
    balance: Number((balances.get(asset.symbol) || 0).toFixed(8)),
    change: asset.change,
    color: asset.color,
    accountNumber: wallet,
    address: wallet,
  }));
}

async function readAdminData() {
  const supabase = adminClient();
  const authUsers = await listAuthUsers();
  const [{ data: dbUsers, error: usersError }, { data: transactions, error: txError }] = await Promise.all([
    supabase.from("users").select("*"),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(500),
  ]);

  if (usersError) throw usersError;
  if (txError) throw txError;

  const authById = new Map(authUsers.map((user) => [user.id, user]));
  const txRows = transactions || [];

  const users = (dbUsers || []).map((row) => {
    const authUser = authById.get(row.auth_user_id);
    const balances = balancesFromTransactions(txRows, row.wallet);
    const wallets = buildWallets(row.wallet, balances);
    const totalUsd = wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0);

    return {
      id: row.auth_user_id || row.id,
      email: row.email || authUser?.email,
      name: row.full_name || (authUser ? userLabel(authUser.user_metadata?.full_name, authUser.email) : "Wallet user"),
      walletAddress: row.wallet,
      kycStatus: normalizeKycStatus(row.kyc_status),
      createdAt: row.created_at,
      wallets,
      totalUsd,
    };
  });

  const walletToUserId = new Map((dbUsers || []).map((row) => [row.wallet, row.auth_user_id || row.id]));

  return {
    totals: {
      users: users.length,
      tvl: users.reduce((sum, user) => sum + user.totalUsd, 0),
      pendingKyc: users.filter((user) => user.kycStatus === "pending").length,
      transactions: txRows.length,
    },
    users,
    transactions: txRows.slice(0, 100).map((tx) => ({
      id: tx.id,
      userId: walletToUserId.get(tx.to_wallet) || walletToUserId.get(tx.from_wallet) || "",
      type: tx.type,
      amount: Number(tx.amount),
      currency: tx.token,
      status: tx.status,
      reference: tx.note || tx.id,
      fromWallet: tx.from_wallet,
      toWallet: tx.to_wallet,
      address: tx.to_wallet,
      createdAt: tx.created_at,
      walletKey: String(tx.token || "").toLowerCase(),
    })),
  };
}

async function findUserRow(userId: string) {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("User is required.");
  return data;
}

async function findUserByWallet(wallet: string) {
  const supabase = adminClient();
  const { data, error } = await supabase.from("users").select("*").eq("wallet", wallet).maybeSingle();
  if (error) throw error;
  return data;
}

async function writeAdminAction(action: AdminAction, body: any, adminEmail: string) {
  const supabase = adminClient();
  const userRow = await findUserRow(String(body.userId || ""));
  const token = String(body.walletKey || "usdt").toUpperCase();
  const amount = Number(body.amount);

  if (action === "wallet_transfer") {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number.");
    }

    const toUserId = String(body.toUserId || "");
    const toRow = toUserId ? await findUserRow(toUserId) : await findUserByWallet(String(body.toWallet || ""));
    if (!toRow) {
      throw new Error("Recipient wallet not found.");
    }

    const fromWallet = body.debitUser ? userRow.wallet : "system";
    if (body.debitUser) {
      const balances = await readTokenBalances(userRow.wallet);
      if ((balances.get(token) || 0) < amount) {
        throw new Error("Insufficient sender balance.");
      }
    }

    const { error } = await supabase.from("transactions").insert({
      from_wallet: fromWallet,
      to_wallet: toRow.wallet,
      amount,
      token,
      type: "transfer",
      status: "completed",
      note: body.note || `Admin transfer by ${adminEmail}`,
    });

    if (error) throw error;

    if (body.debitUser) {
      await upsertBalance(userRow.wallet, Number(((await readTokenBalances(userRow.wallet)).get(token) || 0).toFixed(8)));
    }
    await upsertBalance(toRow.wallet, Number(((await readTokenBalances(toRow.wallet)).get(token) || 0).toFixed(8)));

    if (toRow.auth_user_id) {
      await createNotification(toRow.auth_user_id, {
        type: "receive",
        title: "Crypto received",
        body: `You received ${amount} ${token} in your Wallex wallet`,
        amount,
        token,
        fromWallet,
      });
    }

    return;
  }

  if (action === "update_kyc") {
    const nextStatus = String(body.kycStatus || "");
    if (!["not_started", "pending", "verified", "rejected"].includes(nextStatus)) {
      throw new Error("Invalid KYC status.");
    }

    const { error } = await supabase
      .from("users")
      .update({ kyc_status: nextStatus === "not_started" ? "unverified" : nextStatus })
      .eq("id", userRow.id);

    if (error) throw error;
    return;
  }

  if (!Number.isFinite(amount) || amount < 0 || (action !== "set_balance" && amount === 0)) {
    throw new Error("Amount must be a positive number.");
  }

  const currentBalances = await readTokenBalances(userRow.wallet);
  const currentBalance = currentBalances.get(token) || 0;

  if (action === "set_balance") {
    const diff = amount - currentBalance;
    if (diff !== 0) {
      const { error } = await supabase.from("transactions").insert({
        from_wallet: diff > 0 ? "system" : userRow.wallet,
        to_wallet: diff > 0 ? userRow.wallet : "system",
        amount: Math.abs(diff),
        token,
        type: "transfer",
        status: "completed",
        note: `Admin balance set by ${adminEmail}`,
      });

      if (error) throw error;
    }
  } else {
    const rawType = String(body.type || (action === "award" ? "admin_award" : "deposit"));
    const isDebit = rawType === "withdraw" || rawType === "send";

    if (isDebit && currentBalance < amount) {
      throw new Error("Insufficient wallet balance.");
    }

    const { error } = await supabase.from("transactions").insert({
      from_wallet: isDebit ? userRow.wallet : "system",
      to_wallet: isDebit ? String(body.address || "external") : userRow.wallet,
      amount,
      token,
      type: action === "award" || rawType === "receive" || rawType === "send" ? "transfer" : rawType,
      status: body.status || "completed",
      note: body.note || `Admin action by ${adminEmail}`,
    });

    if (error) throw error;
  }

  const nextBalances = await readTokenBalances(userRow.wallet);
  await upsertBalance(userRow.wallet, Number((nextBalances.get(token) || 0).toFixed(8)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const adminSession = requireAdminPanel(req);

    if (req.method === "GET") {
      const data = await readAdminData();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const action = req.body?.action as AdminAction;
      if (!["set_balance", "award", "create_transaction", "update_kyc", "wallet_transfer"].includes(action)) {
        return res.status(400).json({ error: "Invalid admin action." });
      }

      await writeAdminAction(action, req.body, adminSession.email);
      const data = await readAdminData();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Admin request failed";
    const status = message.includes("denied") ? 403 : message.includes("session") || message.includes("token") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
