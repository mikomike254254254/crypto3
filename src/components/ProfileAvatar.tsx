import { useState } from "react";
import { CUSTOM_AVATAR_ID, resolveAvatarImage } from "../constants/characters";

interface ProfileAvatarProps {
  characterId?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  selected?: boolean;
}

export function ProfileAvatar({
  characterId,
  avatarUrl,
  size = 64,
  className = "",
  selected = false,
}: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false);
  const src = broken ? "/logo.png" : resolveAvatarImage(characterId, avatarUrl) || "/logo.png";

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img
        src={src}
        alt=""
        className="w-full h-full rounded-full object-cover border-2 border-white shadow-md bg-slate-100"
        onError={() => setBroken(true)}
      />
      {selected && (
        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">
          ✓
        </span>
      )}
    </div>
  );
}

export function isCustomAvatar(characterId?: string | null) {
  return characterId === CUSTOM_AVATAR_ID;
}
