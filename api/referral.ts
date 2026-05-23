import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminClient, ensureUserAccount, requireUser } from "./_supabase.js";

function referralCodeForWallet(wallet: string) {
  const clean = wallet.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `WLX${clean.slice(0, 8)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireUser(req);
    const userRow = await ensureUserAccount(user);
    const supabase = adminClient();
    const myCode = referralCodeForWallet(userRow.wallet);
    const referredBy = (user.user_metadata?.referred_by as string) || null;

    if (req.method === "GET") {
      return res.status(200).json({
        code: myCode,
        link: `https://wallex.online/?ref=${myCode}`,
        referredBy,
        wallet: userRow.wallet,
      });
    }

    if (req.method === "POST") {
      const { code } = req.body ?? {};
      const normalized = String(code || "")
        .trim()
        .toUpperCase()
        .replace(/^REF[-_]?/i, "");

      if (!normalized || normalized.length < 4) {
        return res.status(400).json({ error: "Enter a valid referral code." });
      }

      if (normalized === myCode) {
        return res.status(400).json({ error: "You cannot use your own referral code." });
      }

      if (referredBy) {
        return res.status(400).json({ error: "Referral code already applied to your account." });
      }

      const { data: referrer } = await supabase.from("users").select("wallet, auth_user_id").limit(500);

      const match = (referrer || []).find((row) => referralCodeForWallet(row.wallet) === normalized);

      if (!match) {
        return res.status(404).json({ error: "Referral code not found." });
      }

      const { error: metaError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          referred_by: normalized,
          referred_by_wallet: match.wallet,
        },
      });

      if (metaError) throw metaError;

      return res.status(200).json({
        ok: true,
        referredBy: normalized,
        message: "Referral code applied. Welcome bonus rules apply on your account.",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Referral request failed";
    const status = message.includes("session") || message.includes("token") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
