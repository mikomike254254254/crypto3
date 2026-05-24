import type { Transaction } from "../types/crypto";

export type TxDisplay = {
  title: string;
  subtitle: string;
  sign: "+" | "-";
  isCredit: boolean;
};

export function getTransactionDisplay(tx: Transaction): TxDisplay {
  const note = tx.label || "";
  const currency = tx.currency || tx.symbol || "";
  const shortAddr = tx.address ? `${tx.address.slice(0, 6)}…${tx.address.slice(-4)}` : "";

  if (note.includes("Gas fee")) {
    return { title: "Welcome gas credit", subtitle: "Signup bonus", sign: "+", isCredit: true };
  }
  if (note.includes("KYC verification bonus")) {
    const pending = tx.status === "pending";
    return {
      title: pending ? "KYC bonus (pending)" : "KYC bonus released",
      subtitle: pending ? "Complete verification to unlock" : "Added to your wallet",
      sign: "+",
      isCredit: true,
    };
  }
  if (note.includes("P2P")) {
    const isBuy = /\bdeposit\b/i.test(note) || /\bbuy\b/i.test(note);
    const traderMatch = note.match(/Trader\s+([^—]+)/i);
    const traderName = traderMatch?.[1]?.trim() || "P2P merchant";
    return {
      title: isBuy ? `P2P buy (${traderName})` : `P2P sell (${traderName})`,
      subtitle: note.replace(/^P2P\s+/i, ""),
      sign: isBuy ? "+" : "-",
      isCredit: isBuy,
    };
  }
  if (note.startsWith("Swap ") || tx.type === "swap") {
    const isOut = tx.type === "send" || tx.type === "withdraw";
    return {
      title: isOut ? "Swapped out" : "Swapped in",
      subtitle: note.replace(/^Swap\s+/i, "") || `${currency} exchange`,
      sign: isOut ? "-" : "+",
      isCredit: !isOut,
    };
  }
  if (tx.type === "deposit" || tx.type === "buy") {
    return {
      title: tx.type === "buy" ? "Card purchase" : "Deposit",
      subtitle: shortAddr ? `To ${shortAddr}` : "Funds added",
      sign: "+",
      isCredit: true,
    };
  }
  if (tx.type === "receive") {
    return {
      title: "Received",
      subtitle: shortAddr ? `From ${shortAddr}` : "Incoming transfer",
      sign: "+",
      isCredit: true,
    };
  }
  if (tx.type === "withdraw") {
    return {
      title: "Withdrawal",
      subtitle: shortAddr ? `To ${shortAddr}` : "Sent externally",
      sign: "-",
      isCredit: false,
    };
  }
  if (tx.type === "send" || tx.type === "sell") {
    return {
      title: tx.type === "sell" ? "Sold" : "Sent",
      subtitle: shortAddr ? `To ${shortAddr}` : "Outgoing transfer",
      sign: "-",
      isCredit: false,
    };
  }
  if (tx.type === "gas_fee") {
    return { title: "Gas fee credit", subtitle: "Bonus", sign: "+", isCredit: true };
  }
  if (tx.type === "kyc_bonus") {
    return {
      title: tx.status === "pending" ? "KYC bonus (pending)" : "KYC bonus",
      subtitle: "Verification reward",
      sign: "+",
      isCredit: true,
    };
  }

  const typeName = String(tx.type || "transaction");
  return {
    title: typeName.charAt(0).toUpperCase() + typeName.slice(1),
    subtitle: note || shortAddr || "Transaction",
    sign: "+",
    isCredit: true,
  };
}

export function formatTxStatus(status: string) {
  if (status === "completed") return "Completed";
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  return status;
}
