import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminClient, ensureUserAccount, normalizeKycStatus, requireUser, toDatabaseKycStatus } from "./_supabase.js";

type AuthUser = Awaited<ReturnType<typeof requireUser>>;
type UserRow = Record<string, unknown>;

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Profile request failed";
}

function isMissingColumnError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return message.includes("column") || message.includes("schema cache") || message.includes("does not exist");
}

function profileFromRow(user: AuthUser, row: UserRow) {
  const meta = user.user_metadata ?? {};
  return {
    ...row,
    user_id: user.id,
    full_name: (row.full_name as string) || meta.full_name || meta.name || user.email?.split("@")[0] || "Wallet User",
    kyc_status: normalizeKycStatus((row.kyc_status as string) || undefined),
    onboarding_complete: Boolean(row.onboarding_complete) || Boolean(meta.onboarding_complete),
    avatar_character: (row.avatar_character as string) || (meta.avatar_character as string) || null,
    avatar_gradient: (row.avatar_gradient as string) || (meta.avatar_gradient as string) || null,
    avatar_url: (row.avatar_url as string) || (meta.avatar_url as string) || null,
  };
}

async function syncProfileMetadata(
  user: AuthUser,
  patch: {
    fullName?: string;
    avatarGradient?: string;
    avatarCharacter?: string;
    avatarUrl?: string;
    onboardingComplete?: boolean;
  },
) {
  const metadata: Record<string, string | boolean> = { ...(user.user_metadata ?? {}) };

  if (typeof patch.fullName === "string" && patch.fullName.trim()) {
    metadata.full_name = patch.fullName.trim();
  }
  if (typeof patch.avatarGradient === "string") metadata.avatar_gradient = patch.avatarGradient;
  if (typeof patch.avatarCharacter === "string") metadata.avatar_character = patch.avatarCharacter;
  if (typeof patch.avatarUrl === "string") metadata.avatar_url = patch.avatarUrl;
  if (typeof patch.onboardingComplete === "boolean") metadata.onboarding_complete = patch.onboardingComplete;

  const supabase = adminClient();
  const { error } = await supabase.auth.admin.updateUserById(user.id, { user_metadata: metadata });
  if (error) throw error;

  return metadata;
}

async function updateUserRow(authUserId: string, patch: Record<string, string | boolean>) {
  const supabase = adminClient();

  const attempt = async (fields: Record<string, string | boolean>) =>
    supabase.from("users").update(fields).eq("auth_user_id", authUserId).select("*").single();

  let { data, error } = await attempt(patch);
  if (!error) return data;

  if (!isMissingColumnError(error)) throw error;

  const safe: Record<string, string | boolean> = {};
  if (typeof patch.full_name === "string") safe.full_name = patch.full_name;
  if (typeof patch.avatar_url === "string") safe.avatar_url = patch.avatar_url;
  if (typeof patch.kyc_status === "string") safe.kyc_status = patch.kyc_status;

  ({ data, error } = await attempt(safe));
  if (error) throw error;

  return {
    ...data,
    avatar_character: patch.avatar_character ?? data.avatar_character,
    avatar_gradient: patch.avatar_gradient ?? data.avatar_gradient,
    onboarding_complete: patch.onboarding_complete ?? data.onboarding_complete,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireUser(req);
    const userRow = await ensureUserAccount(user);

    if (req.method === "GET") {
      return res.status(200).json({
        profile: profileFromRow(user, userRow),
      });
    }

    if (req.method === "POST") {
      const { fullName, avatarGradient, avatarCharacter, avatarUrl, kycStatus, onboardingComplete } = req.body ?? {};
      const patch: Record<string, string | boolean> = {};

      if (typeof fullName === "string" && fullName.trim()) patch.full_name = fullName.trim();
      if (typeof avatarGradient === "string") patch.avatar_gradient = avatarGradient;
      if (typeof avatarCharacter === "string") patch.avatar_character = avatarCharacter;
      if (typeof avatarUrl === "string") patch.avatar_url = avatarUrl;
      if (typeof kycStatus === "string") patch.kyc_status = toDatabaseKycStatus(kycStatus);
      if (typeof onboardingComplete === "boolean") patch.onboarding_complete = onboardingComplete;

      let data = userRow;
      if (Object.keys(patch).length > 0) {
        data = await updateUserRow(user.id, patch);
      }

      const metadata = await syncProfileMetadata(user, {
        fullName: typeof fullName === "string" ? fullName : undefined,
        avatarGradient: typeof avatarGradient === "string" ? avatarGradient : undefined,
        avatarCharacter: typeof avatarCharacter === "string" ? avatarCharacter : undefined,
        avatarUrl: typeof avatarUrl === "string" ? avatarUrl : undefined,
        onboardingComplete: typeof onboardingComplete === "boolean" ? onboardingComplete : undefined,
      });

      const mergedRow = {
        ...data,
        full_name: patch.full_name ?? data.full_name,
        avatar_character: patch.avatar_character ?? data.avatar_character ?? metadata.avatar_character,
        avatar_gradient: patch.avatar_gradient ?? data.avatar_gradient ?? metadata.avatar_gradient,
        avatar_url: patch.avatar_url ?? data.avatar_url ?? metadata.avatar_url,
        onboarding_complete: patch.onboarding_complete ?? data.onboarding_complete ?? metadata.onboarding_complete,
      };

      return res.status(200).json({
        profile: profileFromRow(user, mergedRow),
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message = errorMessage(error);
    const status =
      message.includes("session") ||
      message.includes("token") ||
      message.includes("bearer") ||
      message.includes("Missing SUPABASE")
        ? 401
        : 500;
    return res.status(status).json({ error: message });
  }
}
