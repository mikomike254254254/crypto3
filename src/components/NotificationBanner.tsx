import { useState, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import type { WalletNotification } from "../services/walletBackend";

interface NotificationBannerProps {
  notifications: WalletNotification[];
  onDismiss: (id: string) => void;
}

export function NotificationBanner({ notifications, onDismiss }: NotificationBannerProps) {
  const { isDark } = useTheme();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    onDismiss(id);
  }, [onDismiss]);

  // Only show unread notifications that haven't been locally dismissed
  const unread = notifications
    .filter((item) => !item.readAt && !dismissedIds.has(item.id))
    .slice(0, 3);

  if (!unread.length) return null;

  return (
    <div className="px-4 pt-2 space-y-2">
      {unread.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
            isDark ? "bg-neutral-900 border-neutral-700" : "bg-neutral-50 border-neutral-200"
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-neutral-800 text-white" : "bg-black text-white"}`}>
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>{item.title}</p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-600"}`}>{item.body}</p>
          </div>
          <button
            type="button"
            onClick={() => handleDismiss(item.id)}
            className={`p-1 rounded-md ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-200"}`}
            aria-label="Dismiss notification"
          >
            <X className={`w-4 h-4 ${isDark ? "text-neutral-400" : "text-gray-500"}`} />
          </button>
        </div>
      ))}
    </div>
  );
}