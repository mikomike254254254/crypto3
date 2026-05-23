import { RefreshCw, Bell } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { ProfileAvatar } from "./ProfileAvatar";
import { NotificationsPanel } from "./NotificationsPanel";
import type { WalletNotification } from "../services/walletBackend";

interface HeaderProps {
  walletId?: string;
  avatarCharacterId?: string | null;
  avatarUrl?: string | null;
  notifications?: WalletNotification[];
  onDismissNotification?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onSync?: () => void | Promise<void>;
}

export function Header({
  walletId = "Wallex account",
  avatarCharacterId,
  avatarUrl,
  notifications = [],
  onDismissNotification,
  onMarkAllNotificationsRead,
  onSync,
}: HeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const { isDark } = useTheme();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync?.();
    } finally {
      window.setTimeout(() => setIsSyncing(false), 800);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 px-3 sm:px-4 pt-3 pb-2 max-w-5xl mx-auto w-full">
        <div
          className={`flex items-center justify-between gap-3 rounded-xl sm:rounded-lg border px-3 sm:px-4 py-2.5 sm:py-3 shadow-md backdrop-blur-xl transition-colors duration-300 ${
            isDark ? "bg-neutral-950/95 border-neutral-800 shadow-black/50" : "bg-white/95 border-neutral-200 shadow-neutral-300/40"
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <ProfileAvatar characterId={avatarCharacterId} avatarUrl={avatarUrl} size={44} />
            <div className="min-w-0 flex flex-col">
              <span className={`text-[10px] sm:text-xs font-medium truncate ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Wallet ID</span>
              <span className={`text-xs sm:text-sm font-semibold truncate -mt-0.5 ${isDark ? "text-white" : "text-black"}`}>{walletId}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSync}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                isDark ? "hover:bg-neutral-900 border border-neutral-800" : "hover:bg-neutral-100 border border-neutral-200"
              }`}
              aria-label="Sync"
            >
              <RefreshCw className={`w-5 h-5 transition-transform ${isSyncing ? "animate-spin" : ""} ${isDark ? "text-white" : "text-black"}`} />
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 relative ${
                isDark ? "hover:bg-neutral-900 border border-neutral-800" : "hover:bg-neutral-100 border border-neutral-200"
              }`}
              aria-label="Notifications"
            >
              <Bell className={`w-5 h-5 ${isDark ? "text-white" : "text-black"}`} />
              {unreadCount > 0 ? (
                <div className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-950">
                  <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </div>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      <NotificationsPanel
        open={panelOpen}
        notifications={notifications}
        onClose={() => setPanelOpen(false)}
        onDismiss={(id) => onDismissNotification?.(id)}
        onMarkAllRead={() => {
          onMarkAllNotificationsRead?.();
        }}
      />
    </>
  );
}
