export const CUSTOM_AVATAR_ID = "custom";

export type WallexCharacter = {
  id: string;
  name: string;
  tagline: string;
  imageUrl: string;
  gradient: string;
};

/** Hosted profile pictures — also copied under /avatars/ in public for fast load */
export const WALLEX_CHARACTERS: WallexCharacter[] = [
  {
    id: "golden-ape",
    name: "Golden Ape",
    tagline: "Low-poly gold",
    imageUrl: "https://i.postimg.cc/1XVjtQ5T/0e59aafe5a8ba534f555d8cb719f4a11.jpg",
    gradient: "from-amber-500 to-yellow-600",
  },
  {
    id: "suit-ape",
    name: "Suit Ape",
    tagline: "Classic style",
    imageUrl: "https://i.postimg.cc/yx3bdHYt/2b982d6142cb8558d0a72f133d1c472a.jpg",
    gradient: "from-neutral-700 to-neutral-900",
  },
  {
    id: "bucket-ape",
    name: "Bucket Hat",
    tagline: "Street cash",
    imageUrl: "https://i.postimg.cc/2yLK6D8t/94bcfd87c8836072713b5636c0b74bb8.jpg",
    gradient: "from-emerald-600 to-red-900",
  },
  {
    id: "headphones-ape",
    name: "Headphones",
    tagline: "Chill vibes",
    imageUrl: "https://i.postimg.cc/0jKBQsy1/9bc04d5e3e74058aa0b5ad629a12db0c.jpg",
    gradient: "from-stone-400 to-stone-600",
  },
  {
    id: "halo-ape",
    name: "Halo Ape",
    tagline: "Blue suit",
    imageUrl: "https://i.postimg.cc/ZnvMRSKM/a4cb5e117b3ab28e09881110a18a8f58.jpg",
    gradient: "from-blue-600 to-blue-800",
  },
  {
    id: "mechanic-ape",
    name: "Mechanic Ape",
    tagline: "Auto shop",
    imageUrl: "https://i.postimg.cc/8cf05Sz8/b0c49e3c7aed8da6ac7779d51339aee4.jpg",
    gradient: "from-sky-400 to-sky-600",
  },
];

const LEGACY_CHARACTER_IDS: Record<string, string> = {
  bitty: "golden-ape",
  ether: "halo-ape",
  tether: "mechanic-ape",
  ripple: "bucket-ape",
  sol: "golden-ape",
  doge: "suit-ape",
  "bull-trader": "golden-ape",
  "crypto-queen": "halo-ape",
  "tech-hacker": "golden-ape",
  "moon-astronaut": "mechanic-ape",
  "bored-ape": "bucket-ape",
  "luxury-whale": "suit-ape",
};

export function getCharacter(id?: string | null) {
  if (!id || id === CUSTOM_AVATAR_ID) return WALLEX_CHARACTERS[0];
  const mapped = LEGACY_CHARACTER_IDS[id] || id;
  return WALLEX_CHARACTERS.find((item) => item.id === mapped) || WALLEX_CHARACTERS[0];
}

export function resolveAvatarImage(characterId?: string | null, avatarUrl?: string | null) {
  if (avatarUrl?.trim()) return avatarUrl.trim();
  if (characterId === CUSTOM_AVATAR_ID) return null;
  return getCharacter(characterId).imageUrl;
}
