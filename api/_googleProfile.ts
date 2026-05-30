type UserMeta = Record<string, unknown>;

function metaString(meta: UserMeta, ...keys: string[]) {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function getGoogleDisplayName(user: { email?: string | null; user_metadata?: UserMeta }) {
  const meta = user.user_metadata ?? {};
  return metaString(meta, "full_name", "name") || user.email?.split("@")[0] || "Wallet User";
}

export function getGoogleAvatarUrl(user: { user_metadata?: UserMeta }) {
  const meta = user.user_metadata ?? {};
  return metaString(meta, "avatar_url", "picture", "avatar") || null;
}
