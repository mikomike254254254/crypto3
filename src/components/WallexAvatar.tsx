import type { WallexCharacter } from "../constants/characters";

interface WallexAvatarProps {
  character: WallexCharacter;
  size?: number;
  selected?: boolean;
  animate?: boolean;
}

function ChibiEyes({ cy = 38 }: { cy?: number }) {
  return (
    <>
      <ellipse cx="42" cy={cy} rx="5" ry="6" fill="#fff" />
      <ellipse cx="58" cy={cy} rx="5" ry="6" fill="#fff" />
      <circle cx="42" cy={cy + 1} r="3.5" fill="#0f172a" />
      <circle cx="58" cy={cy + 1} r="3.5" fill="#0f172a" />
      <circle cx="43" cy={cy} r="1.2" fill="#fff" />
      <circle cx="59" cy={cy} r="1.2" fill="#fff" />
    </>
  );
}

function BullTraderArt({ skin, outfit, badge }: WallexCharacter) {
  return (
    <>
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="rgba(0,0,0,0.1)" />
      <ellipse cx="50" cy="64" rx="24" ry="20" fill={outfit} />
      <rect x="34" y="52" width="32" height="18" rx="6" fill="#fbbf24" opacity="0.9" />
      <text x="50" y="64" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78350f">
        ₿
      </text>
      <circle cx="50" cy="36" r="22" fill={skin} />
      <path d="M28 30 Q50 10 72 30 L70 36 Q50 20 30 36 Z" fill="#1f2937" />
      <rect x="30" y="32" width="40" height="8" rx="3" fill="#111827" opacity="0.85" />
      <rect x="34" y="34" width="14" height="4" rx="1" fill="#22c55e" opacity="0.8" />
      <rect x="52" y="34" width="14" height="4" rx="1" fill="#22c55e" opacity="0.8" />
      <ChibiEyes cy={37} />
      <path d="M40 48 Q50 54 60 48" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="50" rx="8" ry="3" fill="none" stroke="#0f172a" strokeWidth="1.5" />
      <circle cx="72" cy="66" r="11" fill={badge} stroke="#fff" strokeWidth="2" />
      <text x="72" y="69" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">
        ₿
      </text>
    </>
  );
}

function CryptoQueenArt({ skin, outfit, badge }: WallexCharacter) {
  return (
    <>
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="rgba(0,0,0,0.1)" />
      <ellipse cx="50" cy="64" rx="24" ry="20" fill={outfit} />
      <path d="M32 58 L68 58 L64 72 L36 72 Z" fill="#22d3ee" opacity="0.5" />
      <text x="50" y="67" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">
        Ξ
      </text>
      <circle cx="50" cy="36" r="22" fill={skin} />
      <path d="M26 38 C28 18 42 8 50 8 C58 8 72 18 74 38 C70 28 58 22 50 22 C42 22 30 28 26 38 Z" fill="#a855f7" />
      <path d="M28 36 C32 24 42 18 50 18 C58 18 68 24 72 36" stroke="#ec4899" strokeWidth="3" fill="none" />
      <rect x="32" y="34" width="36" height="10" rx="4" fill="#22d3ee" opacity="0.35" />
      <rect x="36" y="36" width="12" height="3" rx="1" fill="#f472b6" />
      <rect x="52" y="36" width="12" height="3" rx="1" fill="#f472b6" />
      <ChibiEyes cy={37} />
      <path d="M42 48 Q50 53 58 48" stroke="#be185d" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="72" cy="66" r="11" fill={badge} stroke="#fff" strokeWidth="2" />
      <text x="72" y="69" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">
        Ξ
      </text>
    </>
  );
}

function TechHackerArt({ skin, outfit, badge }: WallexCharacter) {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" rx="48" fill="#020617" />
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="rgba(34,197,94,0.2)" />
      <ellipse cx="50" cy="64" rx="24" ry="20" fill={outfit} />
      <circle cx="50" cy="36" r="22" fill={skin} />
      <path d="M28 32 Q50 14 72 32" fill="#0f172a" />
      <rect x="30" y="34" width="40" height="12" rx="4" fill="#052e16" stroke="#22c55e" strokeWidth="1" />
      <text x="36" y="42" fontSize="4" fill="#4ade80" fontFamily="monospace">
        1010
      </text>
      <text x="52" y="42" fontSize="4" fill="#4ade80" fontFamily="monospace">
        ₿
      </text>
      <ellipse cx="42" cy="38" rx="4" ry="5" fill="#4ade80" opacity="0.7" />
      <ellipse cx="58" cy="38" rx="4" ry="5" fill="#4ade80" opacity="0.7" />
      <path d="M44 48 L48 46 L52 48 L56 46" stroke="#4ade80" strokeWidth="1.5" fill="none" />
      <circle cx="18" cy="24" r="6" fill={badge} opacity="0.8" />
      <text x="18" y="26" textAnchor="middle" fontSize="6" fill="#052e16" fontWeight="bold">
        ₿
      </text>
      <circle cx="82" cy="20" r="5" fill={badge} opacity="0.6" />
    </>
  );
}

function MoonAstronautArt({ outfit }: WallexCharacter) {
  return (
    <>
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="rgba(0,0,0,0.1)" />
      <ellipse cx="50" cy="66" rx="26" ry="22" fill="#f8fafc" stroke="#ea580c" strokeWidth="3" />
      <ellipse cx="50" cy="66" rx="18" ry="14" fill={outfit} opacity="0.3" />
      <circle cx="50" cy="34" r="24" fill="#f8fafc" stroke="#ea580c" strokeWidth="3" />
      <ellipse cx="50" cy="36" rx="18" ry="16" fill="#1e293b" opacity="0.15" />
      <circle cx="50" cy="34" r="14" fill="#f5d0b5" />
      <ChibiEyes cy={35} />
      <path d="M42 44 Q50 49 58 44" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="28" r="8" fill="#fbbf24" stroke="#ea580c" strokeWidth="2" />
      <text x="50" y="31" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#78350f">
        ₿
      </text>
      <circle cx="22" cy="22" r="5" fill="#fbbf24" />
      <circle cx="78" cy="26" r="4" fill="#fbbf24" />
      <circle cx="72" cy="72" r="4" fill="#fbbf24" />
    </>
  );
}

function BoredApeArt({ outfit, badge }: WallexCharacter) {
  return (
    <>
      <ellipse cx="50" cy="88" rx="28" ry="5" fill="rgba(0,0,0,0.12)" />
      <ellipse cx="50" cy="66" rx="26" ry="20" fill={outfit} />
      <text x="50" y="70" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#fff">
        SUP
      </text>
      <ellipse cx="50" cy="40" rx="26" ry="24" fill="#9ca3af" />
      <ellipse cx="28" cy="44" rx="10" ry="14" fill="#6b7280" />
      <ellipse cx="72" cy="44" rx="10" ry="14" fill="#6b7280" />
      <circle cx="42" cy="38" r="5" fill="#fef08a" />
      <circle cx="58" cy="38" r="5" fill="#fef08a" />
      <circle cx="42" cy="38" r="2" fill="#a855f7" />
      <circle cx="58" cy="38" r="2" fill="#a855f7" />
      <ellipse cx="50" cy="48" rx="10" ry="6" fill="#4b5563" />
      <path d="M44 46 L56 46" stroke="#1f2937" strokeWidth="2" />
      <circle cx="50" cy="56" r="8" fill={badge} stroke="#fff" strokeWidth="2" />
      <circle cx="50" cy="62" r="14" fill="none" stroke={badge} strokeWidth="3" />
    </>
  );
}

function LuxuryWhaleArt({ skin, outfit, badge }: WallexCharacter) {
  return (
    <>
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="rgba(0,0,0,0.1)" />
      <path d="M30 58 L70 58 L66 78 L34 78 Z" fill={outfit} />
      <path d="M38 58 L62 58 L58 68 L42 68 Z" fill="#7c3aed" opacity="0.5" />
      <rect x="44" y="60" width="12" height="14" rx="2" fill="#fff" opacity="0.9" />
      <text x="50" y="70" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#5b21b6">
        Ξ
      </text>
      <circle cx="50" cy="36" r="22" fill={skin} />
      <path d="M32 28 Q50 16 68 28 Q64 24 50 22 Q36 24 32 28" fill="#4c1d95" />
      <ChibiEyes cy={37} />
      <path d="M42 48 Q50 52 58 46" stroke="#0f172a" strokeWidth="2" fill="none" />
      <circle cx="72" cy="66" r="10" fill={badge} stroke="#fff" strokeWidth="2" />
      <rect x="66" y="58" width="12" height="16" rx="3" fill="#fef3c7" stroke={badge} strokeWidth="1" />
      <ellipse cx="72" cy="60" rx="4" ry="2" fill="#fde68a" />
    </>
  );
}

function CharacterArt({ character }: { character: WallexCharacter }) {
  switch (character.id) {
    case "bull-trader":
      return <BullTraderArt {...character} />;
    case "crypto-queen":
      return <CryptoQueenArt {...character} />;
    case "tech-hacker":
      return <TechHackerArt {...character} />;
    case "moon-astronaut":
      return <MoonAstronautArt {...character} />;
    case "bored-ape":
      return <BoredApeArt {...character} />;
    case "luxury-whale":
      return <LuxuryWhaleArt {...character} />;
    default:
      return <BullTraderArt {...character} />;
  }
}

export function WallexAvatar({ character, size = 80, selected = false, animate = false }: WallexAvatarProps) {
  const bounce = animate || selected;
  const isHacker = character.id === "tech-hacker";

  return (
    <div
      className={`relative flex items-center justify-center ${bounce ? "animate-bounce-slow" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="drop-shadow-lg">
        {!isHacker && (
          <defs>
            <linearGradient id={`bg-${character.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={character.colors[0]} />
              <stop offset="100%" stopColor={character.colors[1]} />
            </linearGradient>
          </defs>
        )}
        {!isHacker && <circle cx="50" cy="50" r="48" fill={`url(#bg-${character.id})`} />}
        <CharacterArt character={character} />
      </svg>
      {selected && (
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold shadow-md">
          ✓
        </span>
      )}
    </div>
  );
}
