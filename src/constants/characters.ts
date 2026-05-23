export type WallexCharacter = {
  id: string;
  name: string;
  tagline: string;
  symbol: string;
  gradient: string;
  accent: string;
  skin: string;
  outfit: string;
  badge: string;
  colors: [string, string];
};

export const WALLEX_CHARACTERS: WallexCharacter[] = [
  {
    id: "bitty",
    name: "Bitty",
    tagline: "Bitcoin bull",
    symbol: "BTC",
    gradient: "from-orange-400 to-amber-600",
    accent: "#f97316",
    skin: "#fcd9b6",
    outfit: "#ea580c",
    badge: "#f59e0b",
    colors: ["#fb923c", "#d97706"],
  },
  {
    id: "ether",
    name: "Ether",
    tagline: "Ethereum wizard",
    symbol: "ETH",
    gradient: "from-indigo-400 to-violet-600",
    accent: "#6366f1",
    skin: "#f5d0c5",
    outfit: "#4338ca",
    badge: "#818cf8",
    colors: ["#818cf8", "#4f46e5"],
  },
  {
    id: "tether",
    name: "Tether",
    tagline: "Stable guardian",
    symbol: "USDT",
    gradient: "from-emerald-400 to-teal-600",
    accent: "#10b981",
    skin: "#f8e0d0",
    outfit: "#059669",
    badge: "#34d399",
    colors: ["#34d399", "#0d9488"],
  },
  {
    id: "ripple",
    name: "Ripple",
    tagline: "Fast transfers",
    symbol: "XRP",
    gradient: "from-sky-400 to-blue-600",
    accent: "#0ea5e9",
    skin: "#f0d5c8",
    outfit: "#0284c7",
    badge: "#38bdf8",
    colors: ["#38bdf8", "#2563eb"],
  },
  {
    id: "sol",
    name: "Sol",
    tagline: "Speed runner",
    symbol: "SOL",
    gradient: "from-fuchsia-400 to-purple-600",
    accent: "#d946ef",
    skin: "#f5d0c5",
    outfit: "#a21caf",
    badge: "#e879f9",
    colors: ["#e879f9", "#9333ea"],
  },
  {
    id: "doge",
    name: "Doge",
    tagline: "Meme hero",
    symbol: "DOGE",
    gradient: "from-yellow-300 to-orange-500",
    accent: "#eab308",
    skin: "#f5d0c5",
    outfit: "#ca8a04",
    badge: "#facc15",
    colors: ["#fde047", "#f59e0b"],
  },
];

export function getCharacter(id?: string | null) {
  return WALLEX_CHARACTERS.find((item) => item.id === id) || WALLEX_CHARACTERS[0];
}
