import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  adminClient,
  buildClientWallets,
  ensureUserAccount,
  readTokenBalances,
  requireUser,
  walletAssets,
} from "./_supabase.js";

// Hardcoded USD prices - no external API calls needed
const PRICES: Record<string, number> = {
  USDT: 1,
  XRP: 0.52,
  BTC: 67432,
  ETH: 3521,
};

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

    // Validate tokens
    const fromPrice = PRICES[fromToken];
    const toPrice = PRICES[toToken];
    if (!fromPrice || !toPrice) {
      return res.status(400).json({ error: `Unsupported swap pair: ${fromToken}/${toToken}` });
    }

    if (fromToken === toToken) {
      return res.status(400).json({ error: "Choose two different assets to swap." });
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Enter a valid swap amount." });
    }

    // Check balance from transaction ledger
    const balances = await readTokenBalances(userRow.wallet);
    const currentFrom = balances.get(fromToken) || 0;
    if (currentFrom < parsedAmount) {
      return res.status(400).json({
        error: `Insufficient ${fromToken} balance. You have ${currentFrom.toFixed(8)} ${fromToken}.`,
      });
    }

    // Calculate receive amount
    const usdValue = parsedAmount * fromPrice;
    const receiveAmount = Number((usdValue / toPrice).toFixed(8));

    if (!Number.isFinite(receiveAmount) || receiveAmount <= 0) {
      return res.status(400).json({ error: "Swap amount too small." });
    }

    const supabase = adminClient();

    // Insert a transaction row with fallback for missing columns
    const insertTx = async (row: Record<string, unknown>) => {
      const { error } = await supabase.from("transactions").insert(row);
      if (error) {
        // If note column is missing, retry without it
        if (String(error.message || "").toLowerCase().includes("note")) {
          const { note: _, ...cleanRow } = row as any;
          const { error: e2 } = await supabase.from("transactions").insert(cleanRow);
          if (e2) throw e2;
          return;
        }
        throw error;
      }
    };

    const note = `Swap ${parsedAmount} ${fromToken} → ${receiveAmount} ${toToken}`;

    // 1. Deduct fromToken from user's wallet
    await insertTx({
      from_wallet: userRow.wallet,
      to_wallet: "swap",
      amount: parsedAmount,
      token: fromToken,
      type: "send",
      status: "completed",
      note,
    });

    // 2. Credit toToken to user's wallet
    await insertTx({
      from_wallet: "swap",
      to_wallet: userRow.wallet,
      amount: receiveAmount,
      token: toToken,
      type: "deposit",
      status: "completed",
      note,
    });

    // Build wallets from transaction ledger (reads ALL token balances)
    const wallets = await buildClientWallets(userRow);

    return res.status(200).json({
      wallets,
      received: receiveAmount,
      receivedToken: toToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swap failed";
    const status = message.includes("session") || message.includes("token") ? 401 : 500;
    console.error("[SWAP ERROR]", message);
    if (error instanceof Error && error.stack) {
      console.error("[SWAP STACK]", error.stack);
    }
    return res.status(status).json({ error: message });
  }
}