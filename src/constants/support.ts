/** Primary support contact — used across app, landing, and settings */
export const SUPPORT_EMAIL = "mikomike420@gmail.com";

export function supportMailto(subject = "Wallex support") {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
