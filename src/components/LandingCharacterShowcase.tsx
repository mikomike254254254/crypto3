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
            className="rounded-2xl bg-white/90 border border-sky-200/80 p-2 shadow-sm"
          >
            <ProfileAvatar characterId={character.id} size={56} />
          </div>
        ))}
      </div>
    </div>
  );
}
