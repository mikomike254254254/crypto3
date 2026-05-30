export const WALLEX_CANONICAL_ORIGIN = "https://wallex.qzz.io";

const LEGACY_ORIGIN_PATTERN = /\.vercel\.app$/i;

const VALID_DOMAINS = ["wallex.qzz.io", "wallex.online"];

function isLocalOrigin(origin: string) {
  return origin.includes("localhost") || origin.includes("127.0.0.1");
}

function isLegacyOrigin(origin: string) {
  return LEGACY_ORIGIN_PATTERN.test(origin) || origin.includes("wallex-online-new");
}

/** Production always uses wallex.qzz.io — never old Vercel preview URLs from env. */
export function getWallexOrigin() {
  const configured = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "");
  const current =
    typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";

  if (current && isLocalOrigin(current)) {
    return current;
  }

  // Accept any valid domain
  if (current && !isLegacyOrigin(current)) {
    const hostname = current.replace(/https?:\/\//, "").split(":")[0];
    if (VALID_DOMAINS.some((d) => hostname === d || hostname.endsWith(d))) {
      return current;
    }
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

/** Send users on old Vercel hosts back to wallex.qzz.io after OAuth. */
export function redirectLegacyHostIfNeeded() {
  if (typeof window === "undefined") return;

  const { hostname, pathname, search, hash } = window.location;
  if (VALID_DOMAINS.some((d) => hostname === d || hostname === `www.${d}`) || isLocalOrigin(hostname)) return;

  if (hostname.endsWith(".vercel.app") || hostname.includes("wallex-online-new")) {
    // Preserve hash for OAuth callback
    window.location.replace(`${WALLEX_CANONICAL_ORIGIN}${pathname}${search}${hash}`);
  }
}