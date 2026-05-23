/// <reference types="vite/client" />

interface Window {
  Tawk_API?: {
    hideWidget?: () => void;
    showWidget?: () => void;
    maximize?: () => void;
    minimize?: () => void;
    onChatMinimized?: () => void;
  };
  Tawk_LoadStart?: Date;
  Paystack?: new () => {
    newTransaction: (options: {
      key: string;
      email: string;
      amount: number;
      reference: string;
      firstName?: string;
      lastName?: string;
      onSuccess?: (transaction: { reference?: string; trxref?: string }) => void;
      onCancel?: () => void;
      onError?: (error: { message?: string }) => void;
    }) => void;
  };
}
