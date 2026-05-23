import { Wallet } from "../types/crypto";

export const WALLEX_ORIGIN = "https://wallex.online";

export function getAccountNumber(wallet: Wallet) {
  return wallet.accountNumber || `WLX-${wallet.symbol}-${wallet.id}`.toUpperCase();
}

export function getReceiveAddress(wallet: Wallet, network: string) {
  return wallet.address || `${wallet.symbol}-${network}-${getAccountNumber(wallet)}`;
}

export function buildReceiveLink(wallet: Wallet, network: string) {
  const params = new URLSearchParams({
    account: getAccountNumber(wallet),
    wallet: wallet.id,
    symbol: wallet.symbol,
    network,
    address: getReceiveAddress(wallet, network),
  });

  return `${WALLEX_ORIGIN}/pay?${params.toString()}`;
}

export function parseScannedWalletValue(value: string) {
  try {
    const url = new URL(value);
    const address = url.searchParams.get("address") || url.searchParams.get("account") || value;
    return { address, raw: value };
  } catch {
    return { address: value, raw: value };
  }
}
