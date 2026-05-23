type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function registerPwaInstallPrompt() {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  });
}

export function canInstallPwa() {
  return Boolean(deferredPrompt);
}

export function isPwaInstalled() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export async function promptPwaInstall() {
  if (!deferredPrompt) {
    throw new Error("Install is not available yet. Use your browser menu: Add to Home Screen.");
  }

  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;

  if (choice.outcome !== "accepted") {
    throw new Error("Install was cancelled.");
  }
}
