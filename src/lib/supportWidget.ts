const TAWK_SRC = "https://embed.tawk.to/6a0c2ccfd76c0f1c34167874/1jovou3c6";

let supportLoader: Promise<void> | null = null;
let supportExpanded = false;
let supportObserverStarted = false;

function createTawkApi() {
  if (!window.Tawk_API) {
    window.Tawk_API = {};
  }

  return window.Tawk_API;
}

function syncSupportFrames() {
  const frames = Array.from(document.querySelectorAll("iframe"));
  for (const frame of frames) {
    const rect = frame.getBoundingClientRect();
    const isLikelyTawkSurface =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > window.innerWidth - 420 &&
      rect.bottom > window.innerHeight - 420;

    if (!isLikelyTawkSurface) {
      continue;
    }

    const isLauncher = rect.width <= 100 && rect.height <= 100;
    frame.style.display = !supportExpanded && !isLauncher ? "none" : "";
  }
}

function ensureSupportObserver() {
  if (supportObserverStarted) {
    return;
  }

  supportObserverStarted = true;
  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(syncSupportFrames);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  });
}

export function loadSupportWidget() {
  if (supportLoader) {
    return supportLoader;
  }

  supportLoader = new Promise<void>((resolve, reject) => {
    if (document.querySelector('script[data-support="tawk"]')) {
      resolve();
      return;
    }

    createTawkApi();
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.async = true;
    script.src = TAWK_SRC;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    script.dataset.support = "tawk";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Support chat could not load."));
    document.head.appendChild(script);
  });

  return supportLoader;
}

export async function setSupportVisibility(visible: boolean) {
  await loadSupportWidget().catch(() => undefined);
  const api = createTawkApi();
  ensureSupportObserver();
  supportExpanded = false;
  api.onChatMinimized = () => {
    supportExpanded = false;
    syncSupportFrames();
  };

  if (visible) {
    api.showWidget?.();
    api.minimize?.();
  } else {
    api.hideWidget?.();
    api.minimize?.();
  }

  window.setTimeout(syncSupportFrames, 200);
}

export async function openSupportChat() {
  await loadSupportWidget();
  const api = createTawkApi();
  ensureSupportObserver();
  supportExpanded = true;
  api.showWidget?.();
  api.maximize?.();
  window.setTimeout(syncSupportFrames, 200);
}
