import { WALLEX_CHARACTERS } from "../constants/characters";
import { WallexAvatar } from "./WallexAvatar";

export function LandingCharacterShowcase() {
  return (
    <div className="mt-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-4">
        Pick your profile after sign-up
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {WALLEX_CHARACTERS.map((character) => (
          <div
            key={character.id}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/80 border border-slate-200/80 px-3 py-2 shadow-sm"
            title={character.name}
          >
            <WallexAvatar character={character} size={56} />
            <span className="text-[10px] font-semibold text-slate-700 max-w-[72px] text-center leading-tight">
              {character.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
