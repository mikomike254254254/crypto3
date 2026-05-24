import { useEffect, useState } from "react";
import { Link2, Mail } from "lucide-react";
import { CUSTOM_AVATAR_ID, WALLEX_CHARACTERS } from "../constants/characters";
import { ProfileAvatar } from "./ProfileAvatar";
import { useAuth } from "../context/AuthContext";

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

const GMAIL_AVATAR_ID = "gmail-picture";

export function ProfileAvatarPicker({
  selectedId,
  customUrl,
  onSelectId,
  onCustomUrlChange,
  avatarSize = 80,
}: ProfileAvatarPickerProps) {
  const { user } = useAuth();
  const [urlDraft, setUrlDraft] = useState(customUrl);
  const customSelected = selectedId === CUSTOM_AVATAR_ID;
  const gmailSelected = selectedId === GMAIL_AVATAR_ID;

  const gmailAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

  useEffect(() => {
    setUrlDraft(customUrl);
  }, [customUrl]);

  const applyCustom = () => {
    if (!isValidImageUrl(urlDraft)) return;
    onCustomUrlChange(urlDraft.trim());
    onSelectId(CUSTOM_AVATAR_ID);
  };

  const selectGmailAvatar = () => {
    if (gmailAvatarUrl) {
      onCustomUrlChange(gmailAvatarUrl);
      onSelectId(GMAIL_AVATAR_ID);
    }
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
              selectedId === character.id && !customSelected && !gmailSelected
                ? "border-black shadow-lg scale-[1.02]"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <ProfileAvatar characterId={character.id} size={avatarSize} selected={selectedId === character.id && !customSelected && !gmailSelected} />
          </button>
        ))}
      </div>

      {/* Gmail/Google profile picture option */}
      {gmailAvatarUrl && (
        <button
          type="button"
          onClick={selectGmailAvatar}
          className={`w-full rounded-2xl p-3 flex items-center gap-3 border-2 transition-all bg-white ${
            gmailSelected ? "border-black shadow-lg" : "border-slate-200 hover:border-slate-400"
          }`}
        >
          <img src={gmailAvatarUrl} alt="Gmail" className="w-12 h-12 rounded-full object-cover" />
          <div className="text-left">
            <p className="text-sm font-bold text-black">Use my Google profile picture</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <Mail className="w-5 h-5 ml-auto text-slate-400" />
        </button>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-bold text-black flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Custom picture from any URL
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