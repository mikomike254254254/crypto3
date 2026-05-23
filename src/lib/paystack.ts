let paystackLoader: Promise<void> | null = null;

export type PaystackCheckoutOptions = {
  amount: number;
  email: string;
  name?: string;
  reference: string;
  currency?: string;
  onSuccess: (reference: string) => void | Promise<void>;
  onCancel?: () => void;
  onError?: (message: string) => void;
};

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      if ((window as Window & { PaystackPop?: unknown }).PaystackPop) resolve();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Payment checkout could not load."));
    document.head.appendChild(script);
  });
}

export function loadPaystack() {
  if (paystackLoader) return paystackLoader;

  paystackLoader = (async () => {
    try {
      await loadScript("https://js.paystack.co/v2/inline.js");
      if (window.PaystackPop) return;
    } catch {
      // fall through to v1
    }
    await loadScript("https://js.paystack.co/v1/inline.js");
  })();

  return paystackLoader;
}

function openV2Checkout(publicKey: string, options: PaystackCheckoutOptions) {
  const popup = new window.PaystackPop!();
  popup.newTransaction({
    key: publicKey,
    email: options.email,
    amount: Math.round(options.amount * 100),
    currency: options.currency || "KES",
    reference: options.reference,
    firstName: options.name?.split(" ")[0],
    lastName: options.name?.split(" ").slice(1).join(" ") || undefined,
    onSuccess: (transaction: { reference?: string; trxref?: string }) => {
      const reference = transaction.reference || transaction.trxref || options.reference;
      void options.onSuccess(reference);
    },
    onCancel: () => options.onCancel?.(),
    onError: (error: { message?: string }) => options.onError?.(error.message || "Top-up checkout failed."),
  });
}

function openV1Checkout(publicKey: string, options: PaystackCheckoutOptions) {
  const PaystackPopFn = window.PaystackPop as unknown as {
    setup?: (config: Record<string, unknown>) => { openIframe: () => void };
  };

  if (!PaystackPopFn?.setup) {
    throw new Error("Top-up checkout is unavailable.");
  }

  const handler = PaystackPopFn.setup({
    key: publicKey,
    email: options.email,
    amount: Math.round(options.amount * 100),
    currency: options.currency || "KES",
    ref: options.reference,
    firstname: options.name?.split(" ")[0],
    lastname: options.name?.split(" ").slice(1).join(" ") || undefined,
    callback: (response: { reference?: string; trxref?: string }) => {
      const reference = response.reference || response.trxref || options.reference;
      void options.onSuccess(reference);
    },
    onClose: () => options.onCancel?.(),
  });

  handler.openIframe();
}

export const PAYSTACK_CURRENCY = "KES";

export async function startPaystackCheckout(options: PaystackCheckoutOptions) {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
  if (!publicKey || publicKey.includes("xxx")) {
    throw new Error("Top-up is not available right now. Please try again later.");
  }

  await loadPaystack();

  const checkoutOptions = { ...options, currency: options.currency || PAYSTACK_CURRENCY };

  const Pop = window.PaystackPop as unknown as
    | (new () => { newTransaction: (options: Record<string, unknown>) => void })
    | { setup: (config: Record<string, unknown>) => { openIframe: () => void } };

  if (Pop && typeof Pop === "function" && "setup" in Pop && typeof Pop.setup === "function") {
    openV1Checkout(publicKey, checkoutOptions);
    return;
  }

  if (window.PaystackPop) {
    openV2Checkout(publicKey, checkoutOptions);
    return;
  }

  throw new Error("Top-up checkout is unavailable.");
}
