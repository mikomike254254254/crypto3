/** Display currency conversion from USD portfolio value */
export const FIAT_RATES_FROM_USD: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1 },
  KSH: { symbol: "KSh", rate: 130 },
  EUR: { symbol: "€", rate: 0.92 },
  GBP: { symbol: "£", rate: 0.79 },
  CAD: { symbol: "C$", rate: 1.36 },
  JPY: { symbol: "¥", rate: 150 },
  AUD: { symbol: "A$", rate: 1.52 },
  CHF: { symbol: "Fr", rate: 0.88 },
  CNY: { symbol: "¥", rate: 7.2 },
  INR: { symbol: "₹", rate: 83 },
  SGD: { symbol: "S$", rate: 1.34 },
  AED: { symbol: "AED", rate: 3.67 },
};

export function convertFromUsd(usd: number, currencyCode: string) {
  const row = FIAT_RATES_FROM_USD[currencyCode] || FIAT_RATES_FROM_USD.USD;
  return usd * row.rate;
}

export function formatFiat(usd: number, currencyCode: string) {
  const row = FIAT_RATES_FROM_USD[currencyCode] || FIAT_RATES_FROM_USD.USD;
  const value = convertFromUsd(usd, currencyCode);
  const digits = currencyCode === "JPY" || currencyCode === "KSH" ? 0 : 2;
  return `${row.symbol}${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
