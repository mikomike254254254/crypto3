import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchLiveUsdPrices } from "./_prices.js";
import {
  adminClient,
  buildClientWallets,
  createNotification,
  ensureUserAccount,
  readTokenBalances,
  requireUser,
  walletAssets,
} from "./_supabase.js";

function walletKeyToSymbol(key: string) {
  const asset = walletAssets.find((a) => a.wallet_key === String(key).toLowerCase());
  return (asset?.symbol || String(key)).toUpperCase();
}

function isMissingColumnError(error: { message?: string }) {
  const msg = (error.message || "").toLowerCase();
  return msg.includes("column") || msg.includes("schema cache") || msg.includes("does not exist");
}

async function insertLedgerTx(row: Record<string, unknown>) {
  const supabase = adminClient();
  const attempts: Record<string, unknown>[] = [
    row,
    { ...row, note: undefined },
    { ...row, type: row.type === "swap" ? "send" : row.type },
  ];

  for (const payload of attempts) {
    const { error } = await supabase.from("transactions").insert(payload);
    if (!error) return;
    if (!isMissingColumnError(error)) throw error;
  }

  throw new Error("Could not record swap transaction.");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await requireUser(req);
    const userRow = await ensureUserAccount(user);
    const { fromWalletKey, toWalletKey, amount } = req.body ?? {};
    const fromToken = walletKeyToSymbol(fromWalletKey || "usdt");
    const toToken = walletKeyToSymbol(toWalletKey || "btc");
    const parsedAmount = Number(amount);

    const prices = await fetchLiveUsdPrices();
    if (!prices[fromToken] || !prices[toToken]) {
      return res.status(400).json({ error: "Unsupported swap pair." });
    }

    if (fromToken === toToken) {
      return res.status(400).json({ error: "Choose two different assets to swap." });
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Enter a valid swap amount." });
    }

    const balances = await readTokenBalances(userRow.wallet);
    const current = balances.get(fromToken) || 0;

    if (current < parsedAmount) {
      return res.status(400).json({ error: `Insufficient ${fromToken} balance.` });
    }

    const usdValue = parsedAmount * prices[fromToken];
    const receiveAmount = Number((usdValue / prices[toToken]).toFixed(8));
    const note = `Swap ${parsedAmount} ${fromToken} → ${receiveAmount} ${toToken}`;

    // Insert the outgoing (send) ledger entry
    await insertLedgerTx({
      from_wallet: userRow.wallet,
      to_wallet: "swap",
      amount: parsedAmount,
      token: fromToken,
      type: "send",
      status: "completed",
      note,
    });

    // Insert the incoming (deposit) ledger entry
    await insertLedgerTx({
      from_wallet: "swap",
      to_wallet: userRow.wallet,
      amount: receiveAmount,
      token: toToken,
      type: "deposit",
      status: "completed",
      note,
    });

    // Create a notification
    try {
      await createNotification(user.id, {
        type: "swap",
        title: "Swap completed",
        body: `Swapped ${parsedAmount} ${fromToken} → ${receiveAmount} ${toToken}`,
        amount: parsedAmount,
        token: fromToken,
      });
    } catch {
      // notification is best-effort
    }

    // Build wallets from transactions ledger - this reads ALL tokens
    const wallets = await buildClientWallets(userRow);

    return res.status(200).json({
      wallets,
      received: receiveAmount,
      receivedToken: toToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swap failed";
    const status = message.includes("session") || message.includes("token") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}