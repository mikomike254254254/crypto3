import type { VercelRequest, VercelResponse } from "@vercel/node";
import { awardSignupBonuses } from "./_bonuses.js";
import { buildClientWallets, ensureUserAccount, requireUser } from "./_supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await requireUser(req);
    const userRow = await ensureUserAccount(user);
    if (!userRow.signup_bonus_awarded) {
      await awardSignupBonuses(userRow);
    }
    const wallets = await buildClientWallets(userRow);
    return res.status(200).json({ wallets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet request failed";
    const status = message.includes("session") || message.includes("token") || message.includes("bearer") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
