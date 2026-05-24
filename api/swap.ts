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

    const supabase = adminClient();

    // Insert a ledger row, trying with note first then without
    const insertTx = async (row: Record<string, unknown>) => {
      const noNote = { ...row };
      delete (noNote as any).note;
      
      // Try full insert
      const { error } = await supabase.from("transactions").insert(row);
      if (!error) return;
      
      // If note column doesn't exist, retry without note
      if (String(error.message || "").toLowerCase().includes("note")) {
        const { error: e2 } = await supabase.from("transactions").insert(noNote);
        if (e2) throw e2;
        return;
      }
      
      throw error;
    };

    // Insert outgoing tx (send from wallet to swap)
    await insertTx({
      from_wallet: userRow.wallet,
      to_wallet: "swap",
      amount: parsedAmount,
      token: fromToken,
      type: "send",
      status: "completed",
      note,
    });

    // Insert incoming tx (receive from swap to wallet)
    await insertTx({
      from_wallet: "swap",
      to_wallet: userRow.wallet,
      amount: receiveAmount,
      token: toToken,
      type: "deposit",
      status: "completed",
      note,
    });

    // Best-effort notification
    try {
      await createNotification(user.id, {
        type: "swap",
        title: "Swap completed",
        body: `Swapped ${parsedAmount} ${fromToken} → ${receiveAmount} ${toToken}`,
        amount: parsedAmount,
        token: fromToken,
      });
    } catch { /* best-effort */ }

    // Build wallets from transaction ledger
    const wallets = await buildClientWallets(userRow);

    return res.status(200).json({
      wallets,
      received: receiveAmount,
      receivedToken: toToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swap failed";
    const status = message.includes("session") || message.includes("token") ? 401 : 500;
    console.error("[SWAP ERROR]", error);
    return res.status(status).json({ error: message, detail: error instanceof Error ? error.message : String(error) });
  }
}