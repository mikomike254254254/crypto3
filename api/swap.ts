import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  adminClient,
  buildClientWallets,
  ensureUserAccount,
  readTokenBalances,
  requireUser,
  SWAP_RATES_USD,
  upsertBalance,
} from "./_supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await requireUser(req);
    const userRow = await ensureUserAccount(user);
    const { fromWalletKey, toWalletKey, amount } = req.body ?? {};
    const fromToken = String(fromWalletKey || "usdt").toUpperCase();
    const toToken = String(toWalletKey || "btc").toUpperCase();
    const parsedAmount = Number(amount);

    if (!SWAP_RATES_USD[fromToken] || !SWAP_RATES_USD[toToken]) {
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

    const usdValue = parsedAmount * SWAP_RATES_USD[fromToken];
    const receiveAmount = Number((usdValue / SWAP_RATES_USD[toToken]).toFixed(8));

    const supabase = adminClient();
    const note = `Swap ${parsedAmount} ${fromToken} → ${receiveAmount} ${toToken}`;

    const { error: debitError } = await supabase.from("transactions").insert({
      from_wallet: userRow.wallet,
      to_wallet: "swap",
      amount: parsedAmount,
      token: fromToken,
      type: "swap",
      status: "completed",
      note,
    });

    if (debitError) throw debitError;

    const { error: creditError } = await supabase.from("transactions").insert({
      from_wallet: "swap",
      to_wallet: userRow.wallet,
      amount: receiveAmount,
      token: toToken,
      type: "swap",
      status: "completed",
      note,
    });

    if (creditError) throw creditError;

    const nextBalances = await readTokenBalances(userRow.wallet);
    await upsertBalance(userRow.wallet, Number((nextBalances.get(fromToken) || 0).toFixed(8)));

    return res.status(200).json({
      wallets: await buildClientWallets(userRow),
      received: receiveAmount,
      receivedToken: toToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swap failed";
    const status = message.includes("session") || message.includes("token") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
