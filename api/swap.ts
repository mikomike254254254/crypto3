import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminClient, walletAssets } from "./_supabase.js";

const PRICES: Record<string, number> = {
  USDT: 1, XRP: 0.52, BTC: 67432, ETH: 3521,
};

function walletKeyToSymbol(key: string) {
  const asset = walletAssets.find((a) => a.wallet_key === String(key).toLowerCase());
  return (asset?.symbol || String(key)).toUpperCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Get auth header
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return res.status(401).json({ error: "Missing bearer token." });
    }

    // Verify user with Supabase
    const supabase = adminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: "Invalid session." });
    }
    const user = userData.user;

    // Get or create user row
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    
    if (!existing) {
      return res.status(400).json({ error: "User account not found. Please sign in again." });
    }
    const userRow = existing;

    const { fromWalletKey, toWalletKey, amount } = req.body ?? {};
    const fromToken = walletKeyToSymbol(fromWalletKey || "usdt");
    const toToken = walletKeyToSymbol(toWalletKey || "btc");
    const parsedAmount = Number(amount);

    // Validate
    const fromPrice = PRICES[fromToken];
    const toPrice = PRICES[toToken];
    if (!fromPrice || !toPrice) {
      return res.status(400).json({ error: `Unsupported pair: ${fromToken}/${toToken}` });
    }
    if (fromToken === toToken) {
      return res.status(400).json({ error: "Choose two different assets." });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Enter a valid amount." });
    }

    // Read balances
    const { data: txs, error: txsErr } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_wallet.eq.${userRow.wallet},to_wallet.eq.${userRow.wallet}`)
      .order("created_at", { ascending: true });

    if (txsErr) return res.status(500).json({ error: "Failed to read transactions", detail: txsErr.message });

    const balanceMap = new Map<string, number>();
    for (const tx of txs || []) {
      const sym = String(tx.token || "USDT").toUpperCase();
      const amt = Number(tx.amount || 0);
      if (!Number.isFinite(amt) || amt <= 0 || tx.status === "failed") continue;
      if (tx.to_wallet === userRow.wallet && tx.status === "completed") {
        balanceMap.set(sym, (balanceMap.get(sym) || 0) + amt);
      }
      if (tx.from_wallet === userRow.wallet) {
        balanceMap.set(sym, (balanceMap.get(sym) || 0) - amt);
      }
    }

    const currentFrom = balanceMap.get(fromToken) || 0;
    if (currentFrom < parsedAmount) {
      return res.status(400).json({ error: `Insufficient ${fromToken}. Have ${currentFrom.toFixed(8)}.` });
    }

    const usdValue = parsedAmount * fromPrice;
    const receiveAmount = Number((usdValue / toPrice).toFixed(8));
    if (!Number.isFinite(receiveAmount) || receiveAmount <= 0) {
      return res.status(400).json({ error: "Amount too small." });
    }

    // Insert two transaction rows (deduct fromToken, credit toToken)
    // Minimal insert - no note, no created_at (Supabase defaults)
    for (const row of [
      {
        from_wallet: userRow.wallet,
        to_wallet: "swap",
        amount: parsedAmount,
        token: fromToken,
        type: "send",
        status: "completed",
      },
      {
        from_wallet: "swap",
        to_wallet: userRow.wallet,
        amount: receiveAmount,
        token: toToken,
        type: "deposit",
        status: "completed",
      },
    ]) {
      const { error } = await supabase.from("transactions").insert(row);
      if (error) {
        console.error("[SWAP INSERT ERROR]", error.message, JSON.stringify(row));
        return res.status(500).json({ error: "Failed to insert tx", detail: error.message, row });
      }
    }

    // Build wallets from transactions
    const { data: allTxs } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_wallet.eq.${userRow.wallet},to_wallet.eq.${userRow.wallet}`)
      .order("created_at", { ascending: true });

    const finalBalances = new Map<string, number>();
    for (const tx of allTxs || []) {
      const sym = String(tx.token || "USDT").toUpperCase();
      const amt = Number(tx.amount || 0);
      if (!Number.isFinite(amt) || amt <= 0 || tx.status === "failed") continue;
      if (tx.to_wallet === userRow.wallet && tx.status === "completed") {
        finalBalances.set(sym, (finalBalances.get(sym) || 0) + amt);
      }
      if (tx.from_wallet === userRow.wallet) {
        finalBalances.set(sym, (finalBalances.get(sym) || 0) - amt);
      }
    }

    const wallets = walletAssets.map((a) => ({
      id: a.wallet_key,
      name: a.name,
      symbol: a.symbol,
      balance: Number((finalBalances.get(a.symbol) || 0).toFixed(8)),
      change: a.change,
      color: a.color,
      accountNumber: userRow.wallet,
      address: `https://wallex.online/pay?account=${userRow.wallet}&wallet=${a.wallet_key}&symbol=${a.symbol}&network=TRC20`,
    }));

    return res.status(200).json({ wallets, received: receiveAmount, receivedToken: toToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swap failed";
    const detail = error instanceof Error ? error.stack : String(error);
    console.error("[SWAP ERROR]", message, detail);
    return res.status(500).json({ error: message, detail });
  }
}