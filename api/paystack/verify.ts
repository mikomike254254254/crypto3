import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchLiveUsdPrices, usdToTokenAmount } from "../_prices.js";
import {
  adminClient,
  buildClientWallets,
  ensureUserAccount,
  readTokenBalances,
  requireUser,
  upsertBalance,
  walletAssets,
} from "../_supabase.js";

async function verifyTransaction(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Paystack secret key is missing.");
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const body = await response.json().catch(() => ({})) as {
    status?: boolean;
    message?: string;
    data?: {
      amount: number;
      currency?: string;
      customer?: { email?: string };
      reference: string;
      status: string;
    };
  };

  if (!response.ok || !body.status || !body.data) {
    throw new Error(body.message || "Paystack verification failed.");
  }

  return body.data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await requireUser(req);
    const userRow = await ensureUserAccount(user);
    const { reference, walletId, fiatUsd, fiatKes } = req.body ?? {};
    const kesPerUsdt = Number(process.env.P2P_KES_PER_USDT || "129.5");
    const token = String(walletId || "").toUpperCase();

    if (!reference || !walletAssets.some((asset) => asset.symbol === token || asset.wallet_key.toUpperCase() === token)) {
      return res.status(400).json({ error: "Invalid Paystack verification request." });
    }

    const paystackTransaction = await verifyTransaction(String(reference));
    if (paystackTransaction.status !== "success") {
      return res.status(400).json({ error: "Paystack transaction is not successful." });
    }

    if (paystackTransaction.customer?.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return res.status(403).json({ error: "Paystack transaction does not belong to this user." });
    }

    const supabase = adminClient();
    const note = `Paystack:${paystackTransaction.reference}`;
    const { data: existing, error: existingError } = await supabase
      .from("transactions")
      .select("id")
      .eq("note", note)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      const currency = String(paystackTransaction.currency || "KES").toUpperCase();
      const paidMinor = Number(paystackTransaction.amount || 0) / 100;
      let paidUsd: number;
      let fiatLabel: string;

      if (currency === "KES") {
        const paidKes = Number(fiatKes) > 0 ? Number(fiatKes) : paidMinor;
        paidUsd = Number((paidKes / kesPerUsdt).toFixed(4));
        fiatLabel = `KES ${paidKes.toLocaleString("en-KE")}`;
      } else {
        paidUsd = Number(fiatUsd) > 0 ? Number(fiatUsd) : paidMinor;
        fiatLabel = `$${paidUsd} ${currency}`;
      }

      const prices = await fetchLiveUsdPrices();
      const amount = usdToTokenAmount(paidUsd, token, prices);
      const { error: insertError } = await supabase.from("transactions").insert({
        from_wallet: "paystack",
        to_wallet: userRow.wallet,
        amount,
        token,
        type: "deposit",
        status: "completed",
        note: `${note} — ${fiatLabel} → ${amount} ${token}`,
      });

      if (insertError) {
        throw insertError;
      }

      const balances = await readTokenBalances(userRow.wallet);
      await upsertBalance(userRow.wallet, Number((balances.get(token) || 0).toFixed(8)));
    }

    const wallets = await buildClientWallets(userRow);
    return res.status(200).json({ wallets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paystack verification failed";
    const status = message.includes("session") || message.includes("token") || message.includes("bearer") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
