import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { CUSTOM_AVATAR_ID, WALLEX_CHARACTERS } from "../constants/characters";
import { ProfileAvatar } from "./ProfileAvatar";

interface ProfileAvatarPickerProps {
  selectedId: string;
  customUrl: string;
  onSelectId: (id: string) => void;
  onCustomUrlChange: (url: string) => void;
  avatarSize?: number;
}

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProfileAvatarPicker({
  selectedId,
  customUrl,
  onSelectId,
  onCustomUrlChange,
  avatarSize = 80,
}: ProfileAvatarPickerProps) {
  const [urlDraft, setUrlDraft] = useState(customUrl);
  const customSelected = selectedId === CUSTOM_AVATAR_ID;

  useEffect(() => {
    setUrlDraft(customUrl);
  }, [customUrl]);

  const applyCustom = () => {
    if (!isValidImageUrl(urlDraft)) return;
    onCustomUrlChange(urlDraft.trim());
    onSelectId(CUSTOM_AVATAR_ID);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {WALLEX_CHARACTERS.map((character) => (
          <button
            key={character.id}
            type="button"
            onClick={() => onSelectId(character.id)}
            className={`rounded-2xl p-2 flex flex-col items-center gap-2 border-2 transition-all bg-white ${
              selectedId === character.id && !customSelected
                ? "border-black shadow-lg scale-[1.02]"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <ProfileAvatar characterId={character.id} size={avatarSize} selected={selectedId === character.id && !customSelected} />
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-bold text-black flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Custom picture from URL
        </p>
        <input
          type="url"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="https://example.com/your-photo.jpg"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white text-black"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={applyCustom}
            disabled={!isValidImageUrl(urlDraft)}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Use this image
          </button>
          {customSelected && isValidImageUrl(customUrl) && (
            <ProfileAvatar characterId={CUSTOM_AVATAR_ID} avatarUrl={customUrl} size={48} selected />
          )}
        </div>
      </div>
    </div>
  );
}
