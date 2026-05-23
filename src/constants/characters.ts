export type WallexCharacter = {
  id: string;
  name: string;
  tagline: string;
  gradient: string;
  emoji: string;
  accent: string;
};

export const WALLEX_CHARACTERS: WallexCharacter[] = [
  { id: "bitty", name: "Bitty", tagline: "Bitcoin bull", gradient: "from-orange-400 to-amber-600", emoji: "🪙", accent: "#f97316" },
  { id: "ether", name: "Ether", tagline: "Ethereum wizard", gradient: "from-indigo-400 to-violet-600", emoji: "💎", accent: "#6366f1" },
  { id: "tether", name: "Tether", tagline: "Stablecoin guardian", gradient: "from-emerald-400 to-teal-600", emoji: "💵", accent: "#10b981" },
  { id: "ripple", name: "Ripple", tagline: "Fast transfers", gradient: "from-sky-400 to-blue-600", emoji: "🌊", accent: "#0ea5e9" },
  { id: "sol", name: "Sol", tagline: "Speed runner", gradient: "from-fuchsia-400 to-purple-600", emoji: "☀️", accent: "#d946ef" },
  { id: "doge", name: "Doge", tagline: "Meme coin hero", gradient: "from-yellow-300 to-orange-500", emoji: "🐕", accent: "#eab308" },
];

export function getCharacter(id?: string | null) {
  return WALLEX_CHARACTERS.find((item) => item.id === id) || WALLEX_CHARACTERS[0];
}
