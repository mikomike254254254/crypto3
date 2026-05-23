import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  adminClient,
  buildClientWallets,
  createNotification,
  ensureUserAccount,
  isKycVerified,
  readTokenBalances,
  requireUser,
  upsertBalance,
} from "./_supabase.js";

const transactionTypes = ["deposit", "withdraw", "send"] as const;
type TransactionType = typeof transactionTypes[number];

function recipientCandidates(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return [];

  const values = new Set<string>([raw, raw.toLowerCase()]);

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    ["account", "address", "wallet"].forEach((key) => {
      const item = url.searchParams.get(key);
      if (item) {
        values.add(item);
        values.add(item.toLowerCase());
      }
    });
    const hostPath = `${url.hostname}${url.pathname}`;
    values.add(hostPath);
  } catch {
    // Plain wallet addresses are valid recipients too.
  }

  return Array.from(values).filter(Boolean);
}

function toClientTransaction(tx: any, wallet: string) {
  const outgoing = tx.from_wallet === wallet;

  return {
    id: tx.id,
    type: outgoing ? "send" : tx.type === "deposit" ? "deposit" : "receive",
    amount: Number(tx.amount),
    currency: tx.token,
    date: tx.created_at,
    status: tx.status,
    address: outgoing ? tx.to_wallet : tx.from_wallet,
  };
}

async function updateStoredBalance(wallet: string, token: string) {
  const balances = await readTokenBalances(wallet);
  await upsertBalance(wallet, Number((balances.get(token) || 0).toFixed(8)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!["GET", "POST"].includes(req.method || "")) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await requireUser(req);
    const supabase = adminClient();
    const userRow = await ensureUserAccount(user);

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`from_wallet.eq.${userRow.wallet},to_wallet.eq.${userRow.wallet}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return res.status(200).json({
        transactions: (data || []).map((tx) => toClientTransaction(tx, userRow.wallet)),
      });
    }

    const { type, walletId, amount, address, network } = req.body ?? {};
    const transactionType = String(type) as TransactionType;
    const token = String(walletId || "usdt").toUpperCase();
    const parsedAmount = Number(amount);

    if (!transactionTypes.includes(transactionType) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid transaction payload." });
    }

    if ((transactionType === "send" || transactionType === "withdraw") && !isKycVerified(userRow.kyc_status)) {
      return res.status(403).json({ error: "KYC verification is required to send or sell crypto." });
    }

    const balances = await readTokenBalances(userRow.wallet);
    const currentBalance = balances.get(token) || 0;
    const isDebit = transactionType === "withdraw" || transactionType === "send";

    if (isDebit && currentBalance < parsedAmount) {
      return res.status(400).json({ error: "Insufficient wallet balance." });
    }

    const candidates = recipientCandidates(address);
    let recipient: any = null;

    if (transactionType === "send" && candidates.length) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .in("wallet", candidates);

      if (error) throw error;
      recipient = (data || []).find((row) => row.wallet !== userRow.wallet) || null;

    }

    const toWallet = transactionType === "deposit"
      ? userRow.wallet
      : recipient?.wallet || String(address || "external");

    const fromWallet = transactionType === "deposit"
      ? "external"
      : userRow.wallet;

    const status = transactionType === "withdraw" && !recipient ? "pending" : "completed";
    const note = [
      transactionType === "deposit" ? "External incoming deposit" : recipient ? "Wallex wallet transfer" : "External withdrawal request",
      network ? `Network: ${network}` : "",
    ].filter(Boolean).join(" - ");

    const { error: txError } = await supabase.from("transactions").insert({
      from_wallet: fromWallet,
      to_wallet: toWallet,
      amount: parsedAmount,
      token,
      type: transactionType === "send" ? "transfer" : transactionType,
      status,
      note,
    });

    if (txError) throw txError;

    await updateStoredBalance(userRow.wallet, token);
    if (recipient) {
      await updateStoredBalance(recipient.wallet, token);
      if (recipient.auth_user_id) {
        await createNotification(recipient.auth_user_id, {
          type: "receive",
          title: "Crypto received",
          body: `${userRow.full_name || "A Wallex user"} sent you ${parsedAmount} ${token}`,
          amount: parsedAmount,
          token,
          fromWallet: userRow.wallet,
        });
      }
    }

    const wallets = await buildClientWallets(userRow);
    return res.status(200).json({ wallets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction request failed";
    const status = message.includes("session") || message.includes("token") || message.includes("bearer") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
