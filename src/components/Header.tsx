import { RefreshCw, Bell } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { ProfileAvatar } from "./ProfileAvatar";

interface HeaderProps {
  walletId?: string;
  avatarCharacterId?: string | null;
  avatarUrl?: string | null;
}

export function Header({ walletId = "Wallex account", avatarCharacterId, avatarUrl }: HeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { isDark } = useTheme();

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  return (
    <div className="sticky top-0 z-40 px-3 sm:px-4 pt-3 pb-2 max-w-5xl mx-auto w-full">
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl sm:rounded-3xl border px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? "bg-neutral-900/90 border-neutral-700/80 shadow-black/40"
            : "bg-white/92 border-neutral-200/90 shadow-neutral-300/50"
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <ProfileAvatar characterId={avatarCharacterId} avatarUrl={avatarUrl} size={44} />
          <div className="min-w-0 flex flex-col">
            <span className={`text-[10px] sm:text-xs font-medium truncate ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
              Wallet ID
            </span>
            <span className={`text-xs sm:text-sm font-semibold truncate -mt-0.5 ${isDark ? "text-white" : "text-black"}`}>
              {walletId}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSync}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
            }`}
            aria-label="Sync"
          >
            <RefreshCw
              className={`w-5 h-5 transition-transform ${isSyncing ? "animate-spin" : ""} ${isDark ? "text-white" : "text-black"}`}
            />
          </button>
          <button
            type="button"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-95 relative ${
              isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
            }`}
            aria-label="Notifications"
          >
            <Bell className={`w-5 h-5 ${isDark ? "text-white" : "text-black"}`} />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
          </button>
        </div>
      </div>
    </div>
  );
}
