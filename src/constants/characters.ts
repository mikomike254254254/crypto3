export type CharacterArchetype =
  | "bull-trader"
  | "crypto-queen"
  | "tech-hacker"
  | "moon-astronaut"
  | "bored-ape"
  | "luxury-whale";

export type WallexCharacter = {
  id: CharacterArchetype;
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
    id: "bull-trader",
    name: "Crypto Bull",
    tagline: "Bitcoin bull trader",
    symbol: "BTC",
    gradient: "from-lime-400 to-emerald-600",
    accent: "#22c55e",
    skin: "#f5d0b5",
    outfit: "#111827",
    badge: "#f59e0b",
    colors: ["#4ade80", "#15803d"],
  },
  {
    id: "crypto-queen",
    name: "Crypto Queen",
    tagline: "Ethereum royalty",
    symbol: "ETH",
    gradient: "from-fuchsia-400 to-cyan-500",
    accent: "#ec4899",
    skin: "#f0d0c8",
    outfit: "#7c3aed",
    badge: "#22d3ee",
    colors: ["#f472b6", "#06b6d4"],
  },
  {
    id: "tech-hacker",
    name: "Tech Hacker",
    tagline: "Cyberpunk coder",
    symbol: "BTC",
    gradient: "from-emerald-500 to-slate-900",
    accent: "#22c55e",
    skin: "#e8c4a8",
    outfit: "#0f172a",
    badge: "#4ade80",
    colors: ["#22c55e", "#020617"],
  },
  {
    id: "moon-astronaut",
    name: "Moon Astronaut",
    tagline: "To the moon",
    symbol: "BTC",
    gradient: "from-orange-300 to-sky-500",
    accent: "#f97316",
    skin: "#f5d0b5",
    outfit: "#ea580c",
    badge: "#fbbf24",
    colors: ["#fb923c", "#38bdf8"],
  },
  {
    id: "bored-ape",
    name: "Street Ape",
    tagline: "Laser eyes energy",
    symbol: "APE",
    gradient: "from-violet-500 to-yellow-400",
    accent: "#a855f7",
    skin: "#9ca3af",
    outfit: "#dc2626",
    badge: "#eab308",
    colors: ["#a855f7", "#eab308"],
  },
  {
    id: "luxury-whale",
    name: "Luxury Whale",
    tagline: "ETH champagne life",
    symbol: "ETH",
    gradient: "from-violet-600 to-amber-500",
    accent: "#7c3aed",
    skin: "#f0d0c8",
    outfit: "#5b21b6",
    badge: "#fbbf24",
    colors: ["#7c3aed", "#f59e0b"],
  },
];

const LEGACY_CHARACTER_IDS: Record<string, CharacterArchetype> = {
  bitty: "bull-trader",
  ether: "crypto-queen",
  tether: "luxury-whale",
  ripple: "crypto-queen",
  sol: "moon-astronaut",
  doge: "bored-ape",
};

export function getCharacter(id?: string | null) {
  if (!id) return WALLEX_CHARACTERS[0];
  const mapped = LEGACY_CHARACTER_IDS[id] || id;
  return WALLEX_CHARACTERS.find((item) => item.id === mapped) || WALLEX_CHARACTERS[0];
}
