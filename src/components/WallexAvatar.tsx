import type { WallexCharacter } from "../constants/characters";

interface WallexAvatarProps {
  character: WallexCharacter;
  size?: number;
  selected?: boolean;
  animate?: boolean;
}

export function WallexAvatar({ character, size = 80, selected = false, animate = false }: WallexAvatarProps) {
  const bounce = animate || selected;

  return (
    <div
      className={`relative flex items-center justify-center ${bounce ? "animate-bounce-slow" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="drop-shadow-md">
        <defs>
          <linearGradient id={`bg-${character.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={character.colors[0]} />
            <stop offset="100%" stopColor={character.colors[1]} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill={`url(#bg-${character.id})`} />
        <ellipse cx="50" cy="88" rx="28" ry="6" fill="rgba(0,0,0,0.12)" />
        {/* body */}
        <ellipse cx="50" cy="62" rx="22" ry="18" fill={character.outfit} />
        {/* head */}
        <circle cx="50" cy="38" r="20" fill={character.skin} />
        {/* hair / hat per character */}
        {character.id === "bitty" && <path d="M30 32 Q50 12 70 32 Q65 28 50 26 Q35 28 30 32" fill="#1f2937" />}
        {character.id === "ether" && <path d="M32 30 Q50 8 68 30 L65 36 Q50 22 35 36 Z" fill="#4f46e5" />}
        {character.id === "tether" && <ellipse cx="50" cy="28" rx="18" ry="8" fill="#059669" />}
        {character.id === "ripple" && (
          <>
            <path d="M28 34 Q50 18 72 34" stroke="#0284c7" strokeWidth="4" fill="none" />
            <circle cx="32" cy="32" r="4" fill="#38bdf8" />
            <circle cx="68" cy="32" r="4" fill="#38bdf8" />
          </>
        )}
        {character.id === "sol" && <circle cx="50" cy="22" r="10" fill="#fbbf24" opacity="0.9" />}
        {character.id === "doge" && (
          <>
            <ellipse cx="28" cy="38" rx="8" ry="12" fill="#ca8a04" />
            <ellipse cx="72" cy="38" rx="8" ry="12" fill="#ca8a04" />
          </>
        )}
        {/* eyes */}
        <circle cx="42" cy="38" r="3" fill="#1e293b" />
        <circle cx="58" cy="38" r="3" fill="#1e293b" />
        <circle cx="43" cy="37" r="1" fill="#fff" />
        <circle cx="59" cy="37" r="1" fill="#fff" />
        {/* smile */}
        <path d="M42 46 Q50 52 58 46" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* coin badge */}
        <circle cx="72" cy="68" r="12" fill={character.badge} stroke="#fff" strokeWidth="2" />
        <text x="72" y="72" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">
          {character.symbol}
        </text>
      </svg>
      {selected && (
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold">
          ✓
        </span>
      )}
    </div>
  );
}
