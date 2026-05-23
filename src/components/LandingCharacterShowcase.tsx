import { WALLEX_CHARACTERS } from "../constants/characters";
import { ProfileAvatar } from "./ProfileAvatar";

export function LandingCharacterShowcase() {
  return (
    <div className="mt-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-black/60 text-center mb-4">
        Profile pictures
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {WALLEX_CHARACTERS.map((character) => (
          <div
            key={character.id}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/90 border border-sky-200/80 px-3 py-2 shadow-sm"
            title={character.name}
          >
            <ProfileAvatar characterId={character.id} size={56} />
            <span className="text-[10px] font-semibold text-black max-w-[72px] text-center leading-tight">
              {character.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
