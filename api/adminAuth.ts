import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function panelSecret() {
  return process.env.ADMIN_PANEL_PASSWORD || process.env.ADMIN_PASSWORD || "";
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || "wallexsupport@proton.me")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function verifyAdminCredentials(email: string, password: string) {
  const secret = panelSecret();
  if (!secret) {
    throw new Error("ADMIN_PANEL_PASSWORD is not configured on the server.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!adminEmails().includes(normalizedEmail)) {
    return false;
  }

  const a = Buffer.from(password);
  const b = Buffer.from(secret);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function issueAdminPanelToken(email: string) {
  const secret = panelSecret();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${email.trim().toLowerCase()}:${expiresAt}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return {
    token: Buffer.from(`${payload}:${signature}`).toString("base64url"),
    expiresAt,
  };
}

export function verifyAdminPanelToken(token?: string) {
  const secret = panelSecret();
  if (!secret || !token) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [email, expiresAtRaw, signature] = decoded.split(":");
    if (!email || !expiresAtRaw || !signature) {
      return null;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      return null;
    }

    if (!adminEmails().includes(email.toLowerCase())) {
      return null;
    }

    const payload = `${email}:${expiresAtRaw}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }

    return { email: email.toLowerCase(), expiresAt };
  } catch {
    return null;
  }
}
