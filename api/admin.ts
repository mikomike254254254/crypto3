import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdminPanelToken } from "./adminAuth.js";
import { releaseKycPendingBonus } from "./_bonuses.js";
import {
  adminClient,
  balancesFromTransactions,
  createNotification,
  normalizeKycStatus,
  readTokenBalances,
  upsertBalance,
  walletAddressForEmail,
  walletAddressForUserId,
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

async function signedKycUrl(supabase: ReturnType<typeof adminClient>, path?: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

async function ensureAdminTreasury(supabase: ReturnType<typeof adminClient>, txRows: any[]) {
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || "wallexsupport@proton.me")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const { data: dbUsers } = await supabase.from("users").select("*");

  for (const row of dbUsers || []) {
    if (!row.email || !adminEmails.includes(String(row.email).toLowerCase())) continue;

    const balances = balancesFromTransactions(txRows, row.wallet);
    const xrp = balances.get("XRP") || 0;
    if (xrp >= 1_000_000) continue;

    const amount = Number((1_000_000 - xrp).toFixed(8));
    await supabase.from("transactions").insert({
      from_wallet: "system",
      to_wallet: row.wallet,
      amount,
      token: "XRP",
      type: "transfer",
      status: "completed",
      note: "Admin treasury ? 1M XRP",
    });
    await upsertBalance(row.wallet, Number(((await readTokenBalances(row.wallet)).get("XRP") || 0).toFixed(8)));
  }
}

async function loadKycSubmissions(supabase: ReturnType<typeof adminClient>, dbUsers: any[]) {
  const { data: rows, error } = await supabase
    .from("kyc_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];

  const emailByAuth = new Map((dbUsers || []).map((row) => [row.auth_user_id, row.email]));
  const nameByAuth = new Map((dbUsers || []).map((row) => [row.auth_user_id, row.full_name]));

  const userByWallet = new Map((dbUsers || []).map((u) => [u.wallet, u]));

  return Promise.all(
    (rows || []).map(async (row) => {
      const linked = row.auth_user_id
        ? (dbUsers || []).find((u) => u.auth_user_id === row.auth_user_id)
        : userByWallet.get(row.wallet);
      const authUserId = row.auth_user_id || linked?.auth_user_id || linked?.id || undefined;

      return {
      id: row.id,
      authUserId,
      email: linked?.email || emailByAuth.get(row.auth_user_id) || null,
      name: row.legal_name || linked?.full_name || nameByAuth.get(row.auth_user_id) || "User",
      wallet: row.wallet,
      status: row.status,
      documentType: row.document_type,
      legalName: row.legal_name,
      country: row.country,
      createdAt: row.created_at,
      frontUrl: await signedKycUrl(supabase, row.front_path),
      backUrl: await signedKycUrl(supabase, row.back_path),
      selfieUrl: await signedKycUrl(supabase, row.selfie_path),
    };
    }),
  );
}

async function resolveUserForKyc(body: { userId?: string; kycSubmissionId?: string }) {
  const userId = String(body.userId || "").trim();
  if (userId) {
    return findUserRow(userId);
  }

  const submissionId = String(body.kycSubmissionId || "").trim();
  if (!submissionId) {
    throw new Error("Select a user or open a KYC submission to review.");
  }

  const supabase = adminClient();
  const { data: submission, error } = await supabase
    .from("kyc_submissions")
    .select("auth_user_id, wallet")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) throw error;
  if (!submission) throw new Error("KYC submission not found.");

  if (submission.auth_user_id) {
    return findUserRow(submission.auth_user_id);
  }

  if (submission.wallet) {
    const byWallet = await findUserByWallet(submission.wallet);
    if (byWallet) return byWallet;
  }

  throw new Error("KYC submission is not linked to a user account.");
}

async function readAdminData() {
  const supabase = adminClient();
  const authUsers = await listAuthUsers();

  let { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (txError) throw txError;

  await ensureAdminTreasury(supabase, transactions || []);

  const refreshed = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (refreshed.error) throw refreshed.error;
  transactions = refreshed.data;

  const { data: dbUsers, error: usersError } = await supabase.from("users").select("*");
  if (usersError) throw usersError;

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

  const kycSubmissions = await loadKycSubmissions(supabase, dbUsers || []);

  return {
    totals: {
      users: users.length,
      tvl: users.reduce((sum, user) => sum + user.totalUsd, 0),
      pendingKyc: users.filter((user) => user.kycStatus === "pending").length,
      transactions: txRows.length,
    },
    users,
    kycSubmissions,
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

async function findAuthUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const authUsers = await listAuthUsers();
  return authUsers.find((user) => user.email?.toLowerCase() === normalized);
}

async function ensureUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("Valid recipient email is required.");
  }

  const supabase = adminClient();
  const { data: byEmail, error: emailError } = await supabase
    .from("users")
    .select("*")
    .ilike("email", normalized)
    .maybeSingle();

  if (emailError) throw emailError;
  if (byEmail) return byEmail;

  const authUser = await findAuthUserByEmail(normalized);
  if (authUser) {
    const { data: byAuth, error: authError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (authError) throw authError;
    if (byAuth) return byAuth;

    const wallet = walletAddressForUserId(authUser.id);
    const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || normalized.split("@")[0] || "Wallet User";
    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUser.id,
        wallet,
        email: authUser.email || normalized,
        full_name: fullName,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        kyc_status: "unverified",
        signup_bonus_awarded: false,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;
    await upsertBalance(wallet, 0);
    return inserted;
  }

  const wallet = walletAddressForEmail(normalized);
  const { data: existingWallet, error: walletError } = await supabase
    .from("users")
    .select("*")
    .eq("wallet", wallet)
    .maybeSingle();

  if (walletError) throw walletError;
  if (existingWallet) return existingWallet;

  const { data: created, error: createError } = await supabase
    .from("users")
    .insert({
      wallet,
      email: normalized,
      full_name: normalized.split("@")[0] || "Wallet User",
      kyc_status: "unverified",
      signup_bonus_awarded: false,
    })
    .select("*")
    .single();

  if (createError) throw createError;
  await upsertBalance(wallet, 0);
  return created;
}

async function resolveTargetUser(action: AdminAction, body: any) {
  const recipientEmail = String(body.recipientEmail || "").trim();
  if (recipientEmail && (action === "award" || action === "set_balance" || action === "create_transaction")) {
    return ensureUserByEmail(recipientEmail);
  }

  const userId = String(body.userId || "").trim();
  if (!userId) {
    throw new Error("Select a user or enter a recipient email.");
  }

  return findUserRow(userId);
}

async function writeAdminAction(action: AdminAction, body: any, adminEmail: string) {
  const supabase = adminClient();
  const userRow =
    action === "update_kyc" ? await resolveUserForKyc(body) : await resolveTargetUser(action, body);
  const token = String(body.walletKey || "usdt").toUpperCase();
  const amount = Number(body.amount);

  if (action === "wallet_transfer") {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number.");
    }

    const recipientEmail = String(body.recipientEmail || "").trim();
    const toUserId = String(body.toUserId || "");
    const toRow = recipientEmail
      ? await ensureUserByEmail(recipientEmail)
      : toUserId
        ? await findUserRow(toUserId)
        : await findUserByWallet(String(body.toWallet || ""));

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
      try {
        await createNotification(toRow.auth_user_id, {
          type: "receive",
          title: "Crypto received",
          body: `You received ${amount} ${token} in your Wallex wallet`,
          amount,
          token,
          fromWallet,
        });
      } catch {
        // transfer succeeds even if notification row fails
      }
    }

    return;
  }

  if (action === "update_kyc") {
    const nextStatus = String(body.kycStatus || "");
    if (!["not_started", "pending", "verified", "rejected"].includes(nextStatus)) {
      throw new Error("Invalid KYC status.");
    }

    const dbStatus = nextStatus === "not_started" ? "unverified" : nextStatus;
    const userFilter = userRow.auth_user_id
      ? supabase.from("users").update({ kyc_status: dbStatus }).eq("auth_user_id", userRow.auth_user_id)
      : supabase.from("users").update({ kyc_status: dbStatus }).eq("id", userRow.id);

    const { error } = await userFilter;
    if (error) throw error;

    if (body.kycSubmissionId) {
      await supabase
        .from("kyc_submissions")
        .update({ status: nextStatus === "not_started" ? "pending" : nextStatus })
        .eq("id", body.kycSubmissionId);
    }

    if (nextStatus === "verified") {
      await releaseKycPendingBonus(userRow);
      if (userRow.auth_user_id) {
        try {
          await createNotification(userRow.auth_user_id, {
            type: "receive",
            title: "KYC approved",
            body: "Your identity is verified. Your $15 bonus is now in your wallet.",
            amount: 15,
            token: "USDT",
            fromWallet: "system",
          });
        } catch {
          // KYC status still updated if notifications table is missing columns
        }
      }
    }

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

    if ((action === "award" || action === "create_transaction") && userRow.auth_user_id && !isDebit) {
      try {
        await createNotification(userRow.auth_user_id, {
          type: "receive",
          title: action === "award" ? "Crypto awarded" : "Balance updated",
          body: `You received ${amount} ${token} in your Wallex wallet`,
          amount,
          token,
          fromWallet: "system",
        });
      } catch {
        // ledger updated even if notification insert fails
      }
    }
  }

  const nextBalances = await readTokenBalances(userRow.wallet);
  await upsertBalance(userRow.wallet, Number((nextBalances.get(token) || 0).toFixed(8)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Handle admin login at /api/admin (POST with email/password)
    if (req.method === "POST" && req.body?.action === "login") {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }
      
      const { verifyAdminCredentials, issueAdminPanelToken } = await import("./adminAuth.js");
      if (!verifyAdminCredentials(String(email), String(password))) {
        return res.status(401).json({ error: "Invalid admin credentials." });
      }
      
      const session = issueAdminPanelToken(String(email));
      return res.status(200).json({
        ok: true,
        email: String(email).trim().toLowerCase(),
        token: session.token,
        expiresAt: session.expiresAt,
      });
    }
    
    const adminSession = requireAdminPanel(req);

    if (req.method === "GET") {
      const data = await readAdminData();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const action = String(req.body?.action || "");

      if (action === "broadcast_notification") {
        const title = String(req.body?.title || "Wallex");
        const body = String(req.body?.body || req.body?.message || "");
        const targetAuthUserId = req.body?.authUserId || req.body?.auth_user_id;
        const supabase = adminClient();

        if (!body.trim()) {
          return res.status(400).json({ error: "Notification message is required." });
        }

        if (targetAuthUserId) {
          await createNotification(String(targetAuthUserId), {
            type: "system",
            title,
            body,
          });
        } else {
          const { data: rows, error } = await supabase.from("users").select("auth_user_id").not("auth_user_id", "is", null);
          if (error) throw error;
          for (const row of rows || []) {
            if (row.auth_user_id) {
              try {
                await createNotification(row.auth_user_id, { type: "broadcast", title, body });
              } catch {
                // continue broadcast if one notification row fails
              }
            }
          }
        }

        const data = await readAdminData();
        return res.status(200).json(data);
      }

      if (!["set_balance", "award", "create_transaction", "update_kyc", "wallet_transfer"].includes(action)) {
        return res.status(400).json({ error: "Invalid admin action." });
      }

      await writeAdminAction(action as AdminAction, req.body, adminSession.email);
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
