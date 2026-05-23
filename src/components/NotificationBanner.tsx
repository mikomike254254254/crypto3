import { Bell, X } from "lucide-react";
import type { WalletNotification } from "../services/walletBackend";

interface NotificationBannerProps {
  notifications: WalletNotification[];
  onDismiss: (id: string) => void;
}

export function NotificationBanner({ notifications, onDismiss }: NotificationBannerProps) {
  const unread = notifications.filter((item) => !item.readAt).slice(0, 3);
  if (!unread.length) return null;

  return (
    <div className="px-4 pt-2 space-y-2">
      {unread.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2 duration-300"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-950">{item.title}</p>
            <p className="text-xs text-emerald-800 mt-0.5">{item.body}</p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="p-1 rounded-full hover:bg-white/70"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      ))}
    </div>
  );
}
