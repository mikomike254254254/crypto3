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
  // Log everything for debugging
  console.log("[SWAP] Request received");
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Step 1: Authenticate user
    console.log("[SWAP] Authenticating...");
    const user = await requireUser(req);
    console.log("[SWAP] User:", user.id);
    
    const userRow = await ensureUserAccount(user);
    console.log("[SWAP] Wallet:", userRow.wallet);
    
    const { fromWalletKey, toWalletKey, amount } = req.body ?? {};
    const fromToken = walletKeyToSymbol(fromWalletKey || "usdt");
    const toToken = walletKeyToSymbol(toWalletKey || "btc");
    const parsedAmount = Number(amount);
    console.log("[SWAP] From:", fromToken, "To:", toToken, "Amount:", parsedAmount);

    // Step 2: Get prices
    console.log("[SWAP] Fetching prices...");
    const prices = await fetchLiveUsdPrices();
    if (!prices[fromToken] || !prices[toToken]) {
      return res.status(400).json({ error: "Unsupported swap pair.", prices: Object.keys(prices) });
    }

    if (fromToken === toToken) {
      return res.status(400).json({ error: "Choose two different assets to swap." });
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Enter a valid swap amount." });
    }

    // Step 3: Check balance
    console.log("[SWAP] Checking balance...");
    const balances = await readTokenBalances(userRow.wallet);
    const current = balances.get(fromToken) || 0;
    console.log("[SWAP] Current", fromToken, "balance:", current);

    if (current < parsedAmount) {
      return res.status(400).json({ error: `Insufficient ${fromToken} balance.` });
    }

    const usdValue = parsedAmount * prices[fromToken];
    const receiveAmount = Number((usdValue / prices[toToken]).toFixed(8));
    const note = `Swap ${parsedAmount} ${fromToken} → ${receiveAmount} ${toToken}`;
    console.log("[SWAP] Receive:", receiveAmount, toToken);

    const supabase = adminClient();

    // Step 4: Check what columns exist on the transactions table
    console.log("[SWAP] Checking transactions table schema...");
    let hasNoteColumn = false;
    let hasTypeColumn = false;
    let hasNetworkColumn = false;
    try {
      const { data: sample } = await supabase.from("transactions").select("*").limit(1);
      if (sample && sample.length > 0) {
        const cols = Object.keys(sample[0]);
        console.log("[SWAP] Transactions columns:", cols.join(", "));
        hasNoteColumn = cols.includes("note");
        hasTypeColumn = cols.includes("type");
        hasNetworkColumn = cols.includes("network");
      } else {
        // Table is empty but exists - try inserting a dummy and deleting
        console.log("[SWAP] Transactions table exists but empty");
        hasNoteColumn = true; // assume all columns exist
        hasTypeColumn = true;
      }
    } catch (e) {
      console.log("[SWAP] Error checking schema:", String(e));
      // Assume they exist
      hasNoteColumn = true;
      hasTypeColumn = true;
    }

    // Step 5: Insert the two ledger entries with maximum compatibility
    type TxRow = {
      from_wallet: string;
      to_wallet: string;
      amount: number;
      token: string;
      type: string;
      status: string;
      note?: string;
    };

    const tx1: TxRow = {
      from_wallet: userRow.wallet,
      to_wallet: "swap",
      amount: parsedAmount,
      token: fromToken,
      type: "send",
      status: "completed",
    };
    
    const tx2: TxRow = {
      from_wallet: "swap",
      to_wallet: userRow.wallet,
      amount: receiveAmount,
      token: toToken,
      type: "deposit",
      status: "completed",
    };

    // Only add note if column exists
    if (hasNoteColumn) {
      tx1.note = note;
      tx2.note = note;
    }

    async function insertTx(tx: TxRow, label: string) {
      console.log("[SWAP] Inserting", label, "...");
      const { error } = await supabase.from("transactions").insert({
        from_wallet: tx.from_wallet,
        to_wallet: tx.to_wallet,
        amount: tx.amount,
        token: tx.token,
        type: tx.type,
        status: tx.status,
        ...(tx.note ? { note: tx.note } : {}),
      });
      if (error) {
        console.log("[SWAP] Insert error for", label, ":", error.message);
        // If using note column failed, try without note
        if (tx.note && error.message?.includes("note")) {
          console.log("[SWAP] Retrying", label, "without note...");
          const { error: err2 } = await supabase.from("transactions").insert({
            from_wallet: tx.from_wallet,
            to_wallet: tx.to_wallet,
            amount: tx.amount,
            token: tx.token,
            type: tx.type,
            status: tx.status,
          });
          if (err2) throw err2;
        } else {
          throw error;
        }
      }
      console.log("[SWAP] Inserted", label, "successfully");
    }

    await insertTx(tx1, "outgoing swap tx");
    await insertTx(tx2, "incoming swap tx");

    // Step 6: Create notification (best-effort)
    try {
      await createNotification(user.id, {
        type: "swap",
        title: "Swap completed",
        body: `Swapped ${parsedAmount} ${fromToken} → ${receiveAmount} ${toToken}`,
        amount: parsedAmount,
        token: fromToken,
      });
    } catch (e) {
      console.log("[SWAP] Notification skipped:", String(e));
    }

    // Step 7: Build wallets from transactions ledger
    console.log("[SWAP] Building wallets...");
    const wallets = await buildClientWallets(userRow);
    console.log("[SWAP] Wallets built successfully");

    return res.status(200).json({
      wallets,
      received: receiveAmount,
      receivedToken: toToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swap failed";
    console.log("[SWAP ERROR]", message);
    // Log the full error object for debugging
    if (error instanceof Error && error.stack) {
      console.log("[SWAP ERROR STACK]", error.stack);
    }
    const status = message.includes("session") || message.includes("token") ? 401 : 500;
    return res.status(status).json({ error: message, detail: error instanceof Error ? error.message : String(error) });
  }
}