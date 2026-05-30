import type { User } from "@supabase/supabase-js";

type UserMeta = Record<string, unknown>;

function metaString(meta: UserMeta, ...keys: string[]) {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function isGoogleAuthUser(user: User | null | undefined) {
  if (!user) return false;
  const provider = user.app_metadata?.provider;
  if (provider === "google") return true;
  const identities = user.identities ?? [];
  return identities.some((identity) => identity.provider === "google");
}

export function getGoogleDisplayName(user: User | null | undefined) {
  if (!user) return "";
  const meta = (user.user_metadata ?? {}) as UserMeta;
  return metaString(meta, "full_name", "name") || user.email?.split("@")[0] || "";
}

/** Google OAuth stores the photo in `picture`; Supabase may also mirror `avatar_url`. */
export function getGoogleAvatarUrl(user: User | null | undefined) {
  if (!user) return "";
  const meta = (user.user_metadata ?? {}) as UserMeta;
  return metaString(meta, "avatar_url", "picture", "avatar");
}

export function getProfileAvatarUrl(user: User | null | undefined, rowAvatarUrl?: string | null) {
  const fromRow = rowAvatarUrl?.trim();
  if (fromRow) return fromRow;
  return getGoogleAvatarUrl(user);
}

export function googleProfilePatch(user: User) {
  const meta = (user.user_metadata ?? {}) as UserMeta;
  const fullName = getGoogleDisplayName(user);
  const avatarUrl = getGoogleAvatarUrl(user);
  const next: Record<string, string> = { ...meta } as Record<string, string>;

  if (fullName) next.full_name = fullName;
  if (avatarUrl) {
    next.avatar_url = avatarUrl;
    next.picture = avatarUrl;
  }
  if (isGoogleAuthUser(user)) next.auth_provider = "google";

  return { fullName, avatarUrl, metadata: next };
}
