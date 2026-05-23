export type UserSettings = {
  currency: string;
  notifications: boolean;
  priceAlerts: boolean;
  transactionAlerts: boolean;
  hideBalance: boolean;
  biometric: boolean;
};

const DEFAULT_SETTINGS: UserSettings = {
  currency: "USD",
  notifications: true,
  priceAlerts: true,
  transactionAlerts: true,
  hideBalance: false,
  biometric: true,
};

function storageKey(userId: string) {
  return `wallex_settings:${userId}`;
}

export function loadUserSettings(userId: string): UserSettings {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveUserSettings(userId: string, settings: Partial<UserSettings>) {
  const next = { ...loadUserSettings(userId), ...settings };
  localStorage.setItem(storageKey(userId), JSON.stringify(next));
  return next;
}
