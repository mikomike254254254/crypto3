/** Primary support contact — used across app, landing, P2P, and settings */
export const SUPPORT_EMAIL = "wallexsupport@proton.me";

export function supportMailto(subject = "Wallex support") {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
