/** P2P desk traders — Kenya merchants, contact via wallexsupport@proton.me */
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
  avatarUrl?: string;
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
  avatarUrl: "https://i.postimg.cc/yx3bdHYt/2b982d6142cb8558d0a72f133d1c472a.jpg",
};

/** Kenyan P2P merchants — all orders confirmed via wallexsupport@proton.me */
export const KENYA_P2P_TRADERS: P2pTrader[] = [
  DEFAULT_P2P_TRADER,
  {
    id: "wanjiku",
    name: "Wanjiku",
    online: true,
    verified: true,
    countryCode: "KE",
    countryName: "Kenya",
    rate: 15.85,
    rateCurrency: "CAD",
    rateDisplay: "C$15.85",
    kesPerUsdt: 128.0,
    completedTrades: 892,
    responseMins: 4,
    avatarUrl: "https://i.postimg.cc/0jKBQsy1/9bc04d5e3e74058aa0b5ad629a12db0c.jpg",
  },
  {
    id: "kamau",
    name: "Kamau",
    online: true,
    verified: true,
    countryCode: "KE",
    countryName: "Kenya",
    rate: 16.1,
    rateCurrency: "CAD",
    rateDisplay: "C$16.10",
    kesPerUsdt: 131.0,
    completedTrades: 654,
    responseMins: 5,
    avatarUrl: "https://i.postimg.cc/ZnvMRSKM/a4cb5e117b3ab28e09881110a18a8f58.jpg",
  },
  {
    id: "amina",
    name: "Amina",
    online: true,
    verified: true,
    countryCode: "KE",
    countryName: "Kenya",
    rate: 15.75,
    rateCurrency: "CAD",
    rateDisplay: "C$15.75",
    kesPerUsdt: 127.5,
    completedTrades: 1103,
    responseMins: 3,
    avatarUrl: "https://i.postimg.cc/2yLK6D8t/94bcfd87c8836072713b5636c0b74bb8.jpg",
  },
];

export function parseP2pTrader(raw: unknown): P2pTrader {
  if (!raw || typeof raw !== "object") return DEFAULT_P2P_TRADER;
  const t = raw as Record<string, unknown>;
  const parsed: P2pTrader = {
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
    avatarUrl: t.avatarUrl ? String(t.avatarUrl) : DEFAULT_P2P_TRADER.avatarUrl,
  };
  return mergePrimaryTrader(parsed);
}

export function mergePrimaryTrader(primary: P2pTrader): P2pTrader {
  const idx = KENYA_P2P_TRADERS.findIndex((t) => t.id === primary.id);
  if (idx >= 0) {
    return { ...KENYA_P2P_TRADERS[idx], ...primary, avatarUrl: primary.avatarUrl || KENYA_P2P_TRADERS[idx].avatarUrl };
  }
  return primary;
}

export function getKenyaP2pTraders(primary?: P2pTrader): P2pTrader[] {
  const merged = primary ? mergePrimaryTrader(primary) : DEFAULT_P2P_TRADER;
  const others = KENYA_P2P_TRADERS.filter((t) => t.id !== merged.id);
  return [merged, ...others];
}
