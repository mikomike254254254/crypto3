let paystackLoader: Promise<void> | null = null;

export type PaystackCheckoutOptions = {
  amount: number;
  email: string;
  name?: string;
  reference: string;
  onSuccess: (reference: string) => void | Promise<void>;
  onCancel?: () => void;
  onError?: (message: string) => void;
};

export function loadPaystack() {
  if (paystackLoader) {
    return paystackLoader;
  }

  paystackLoader = new Promise<void>((resolve, reject) => {
    if (window.Paystack) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://js.paystack.co/v2/inline.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Paystack could not load."));
    document.head.appendChild(script);
  });

  return paystackLoader;
}

export async function startPaystackCheckout(options: PaystackCheckoutOptions) {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
  if (!publicKey) {
    throw new Error("Paystack public key is missing.");
  }

  await loadPaystack();
  if (!window.Paystack) {
    throw new Error("Paystack checkout is unavailable.");
  }

  const popup = new window.Paystack();
  popup.newTransaction({
    key: publicKey,
    email: options.email,
    amount: Math.round(options.amount * 100),
    reference: options.reference,
    firstName: options.name?.split(" ")[0],
    lastName: options.name?.split(" ").slice(1).join(" ") || undefined,
    onSuccess: (transaction: { reference?: string; trxref?: string }) => {
      const reference = transaction.reference || transaction.trxref || options.reference;
      void options.onSuccess(reference);
    },
    onCancel: () => options.onCancel?.(),
    onError: (error: { message?: string }) => options.onError?.(error.message || "Paystack checkout failed."),
  });
}
