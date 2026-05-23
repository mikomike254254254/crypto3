import { Wallet } from "../types/crypto";

export const WALLEX_ORIGIN = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") || "https://wallex.online";

export function getAccountNumber(wallet: Wallet) {
  return wallet.accountNumber || `WLX-${wallet.symbol}-${wallet.id}`.toUpperCase();
}

export function buildReceiveLink(wallet: Wallet, network: string) {
  const account = getAccountNumber(wallet);
  const params = new URLSearchParams({
    account,
    wallet: wallet.id,
    symbol: wallet.symbol,
    network,
  });

  return `${WALLEX_ORIGIN}/pay?${params.toString()}`;
}

export function getReceiveAddress(wallet: Wallet, network: string) {
  if (wallet.address?.startsWith("http")) {
    return wallet.address;
  }

  return buildReceiveLink(wallet, network);
}

export function parseScannedWalletValue(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const account = url.searchParams.get("account");
    const address = account || url.searchParams.get("address") || url.searchParams.get("wallet") || value;
    return { address, raw: value, account: account || undefined };
  } catch {
    return { address: value, raw: value };
  }
}
