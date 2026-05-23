const PERM_KEY = "wallex.notifications.asked";

export function canUseDeviceNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function ensureNotificationPermission() {
  if (!canUseDeviceNotifications()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  if (localStorage.getItem(PERM_KEY) === "1") {
    const result = await Notification.requestPermission();
    return result === "granted";
  }
  return false;
}

export async function promptNotificationPermission() {
  if (!canUseDeviceNotifications()) {
    throw new Error("This browser does not support notifications.");
  }
  localStorage.setItem(PERM_KEY, "1");
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showDeviceNotification(title: string, body: string, tag?: string) {
  if (!canUseDeviceNotifications() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: tag || "wallex",
      requireInteraction: false,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // ignore — e.g. iOS quirks
  }
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch (err) {
    console.warn("Service worker registration failed.", err);
    return null;
  }
}
