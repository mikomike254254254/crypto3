export const WALLEX_CANONICAL_ORIGIN = "https://wallex.online";

const LEGACY_ORIGIN_PATTERN = /\.vercel\.app$/i;

function isLocalOrigin(origin: string) {
  return origin.includes("localhost") || origin.includes("127.0.0.1");
}

function isLegacyOrigin(origin: string) {
  return LEGACY_ORIGIN_PATTERN.test(origin) || origin.includes("wallex-online-new");
}

/** Production always uses wallex.online — never old Vercel preview URLs from env. */
export function getWallexOrigin() {
  const configured = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "");
  const current =
    typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";

  if (current && isLocalOrigin(current)) {
    return current;
  }

  if (current && !isLegacyOrigin(current) && current.includes("wallex.online")) {
    return current;
  }

  if (configured && !isLegacyOrigin(configured)) {
    return configured;
  }

  return WALLEX_CANONICAL_ORIGIN;
}

export function buildWallexRedirectUrl(path = "/") {
  const base = getWallexOrigin().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/** Send users on old Vercel hosts back to wallex.online after OAuth. */
export function redirectLegacyHostIfNeeded() {
  if (typeof window === "undefined") return;

  const { hostname, pathname, search, hash } = window.location;
  if (hostname === "wallex.online" || isLocalOrigin(hostname)) return;

  if (hostname.endsWith(".vercel.app") || hostname.includes("wallex-online-new")) {
    // Preserve hash for OAuth callback
    window.location.replace(`${WALLEX_CANONICAL_ORIGIN}${pathname}${search}${hash}`);
  }
}
