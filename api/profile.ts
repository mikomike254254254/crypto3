import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminClient, ensureUserAccount, normalizeKycStatus, requireUser, toDatabaseKycStatus } from "./_supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireUser(req);
    const supabase = adminClient();
    const userRow = await ensureUserAccount(user);

    if (req.method === "GET") {
      return res.status(200).json({
        profile: {
          ...userRow,
          user_id: user.id,
          kyc_status: normalizeKycStatus(userRow.kyc_status),
        },
      });
    }

    if (req.method === "POST") {
      const { fullName, avatarGradient, kycStatus } = req.body ?? {};
      const patch: Record<string, string> = {};

      if (typeof fullName === "string") patch.full_name = fullName;
      if (typeof avatarGradient === "string") patch.avatar_gradient = avatarGradient;
      if (typeof kycStatus === "string") patch.kyc_status = toDatabaseKycStatus(kycStatus);

      const { data, error } = await supabase
        .from("users")
        .update({
          ...patch,
        })
        .eq("auth_user_id", user.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        profile: {
          ...data,
          user_id: user.id,
          kyc_status: normalizeKycStatus(data.kyc_status),
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile request failed";
    const status = message.includes("session") || message.includes("token") || message.includes("bearer") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
