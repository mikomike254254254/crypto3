/** P2P desk trader — rates controlled via Vercel env (admin), shown as live merchant */
export type P2pTrader = {
  id: string;
  name: string;
  online: boolean;
  verified: boolean;
  countryCode: string;
  countryName: string;
  rate: number;
  rateCurrency: string;
  rateDisplay: string;
  kesPerUsdt: number;
  completedTrades: number;
  responseMins: number;
};

export const DEFAULT_P2P_TRADER: P2pTrader = {
  id: "jeff",
  name: "Jeff",
  online: true,
  verified: true,
  countryCode: "KE",
  countryName: "Kenya",
  rate: 15.9,
  rateCurrency: "CAD",
  rateDisplay: "C$15.90",
  kesPerUsdt: 129.5,
  completedTrades: 1248,
  responseMins: 3,
};

export function parseP2pTrader(raw: unknown): P2pTrader {
  if (!raw || typeof raw !== "object") return DEFAULT_P2P_TRADER;
  const t = raw as Record<string, unknown>;
  return {
    id: String(t.id || "jeff"),
    name: String(t.name || "Jeff"),
    online: t.online !== false,
    verified: t.verified !== false,
    countryCode: String(t.countryCode || "KE"),
    countryName: String(t.countryName || "Kenya"),
    rate: Number(t.rate) || DEFAULT_P2P_TRADER.rate,
    rateCurrency: String(t.rateCurrency || "CAD"),
    rateDisplay: String(t.rateDisplay || "C$15.90"),
    kesPerUsdt: Number(t.kesPerUsdt) || DEFAULT_P2P_TRADER.kesPerUsdt,
    completedTrades: Number(t.completedTrades) || DEFAULT_P2P_TRADER.completedTrades,
    responseMins: Number(t.responseMins) || 3,
  };
}
