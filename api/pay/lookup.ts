import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminClient } from "../_supabase.js";

function lookupCandidates(value: string) {
  const raw = value.trim();
  const set = new Set<string>([raw, raw.toLowerCase()]);
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const account = url.searchParams.get("account");
    const wallet = url.searchParams.get("wallet");
    if (account) {
      set.add(account);
      set.add(account.toLowerCase());
    }
    if (wallet) {
      set.add(wallet);
      set.add(wallet.toLowerCase());
    }
  } catch {
    // plain wallet id
  }
  return Array.from(set).filter(Boolean);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = String(req.query.account || "").trim();
    if (!account) {
      return res.status(400).json({ error: "Missing account parameter." });
    }

    const candidates = lookupCandidates(account);
    const supabase = adminClient();

    const { data: rows, error } = await supabase.from("users").select("*").in("wallet", candidates);

    if (error) throw error;

    const recipient = (rows || [])[0] || null;

    if (!recipient) {
      return res.status(404).json({ error: "Wallex wallet not found." });
    }

    const symbol = String(req.query.symbol || "USDT").toUpperCase();
    const walletKey = String(req.query.wallet || "usdt").toLowerCase();

    return res.status(200).json({
      recipient: {
        wallet: recipient.wallet,
        fullName: recipient.full_name || "Wallex user",
        avatarUrl: recipient.avatar_url || null,
        avatarCharacter: recipient.avatar_character || null,
        avatarGradient: recipient.avatar_gradient || null,
        symbol,
        walletKey,
        network: String(req.query.network || "TRC20"),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return res.status(500).json({ error: message });
  }
}
