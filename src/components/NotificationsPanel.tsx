import { Bell, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import type { WalletNotification } from "../services/walletBackend";

interface NotificationsPanelProps {
  open: boolean;
  notifications: WalletNotification[];
  onClose: () => void;
  onDismiss: (id: string) => void;
  onMarkAllRead?: () => void;
}

export function NotificationsPanel({ open, notifications, onClose, onDismiss, onMarkAllRead }: NotificationsPanelProps) {
  const { isDark } = useTheme();

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close notifications" />
      <div
        className={`relative w-full max-w-sm h-full shadow-2xl border-l flex flex-col ${
          isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
        }`}
      >
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
          <div className="flex items-center gap-2">
            <Bell className={`w-5 h-5 ${isDark ? "text-white" : "text-black"}`} />
            <h2 className={`font-bold ${isDark ? "text-white" : "text-black"}`}>Notifications</h2>
            {unreadCount > 0 ? (
              <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className={`p-2 rounded-lg ${isDark ? "hover:bg-neutral-900" : "hover:bg-neutral-100"}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {unreadCount > 0 && onMarkAllRead ? (
          <div className={`px-4 py-2 border-b ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
            <button type="button" onClick={onMarkAllRead} className="text-xs font-semibold text-slate-600 hover:text-black">
              Mark all as read
            </button>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <p className={`text-sm text-center py-12 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>No notifications yet</p>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-3 ${
                  item.readAt
                    ? isDark
                      ? "bg-neutral-900/50 border-neutral-800 opacity-70"
                      : "bg-neutral-50 border-neutral-100"
                    : isDark
                      ? "bg-neutral-900 border-neutral-700"
                      : "bg-neutral-50 border-neutral-200"
                }`}
              >
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>{item.title}</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-neutral-400" : "text-gray-600"}`}>{item.body}</p>
                    {item.amount != null && item.token ? (
                      <p className={`text-xs font-medium mt-1 ${isDark ? "text-neutral-300" : "text-gray-800"}`}>
                        {item.amount} {item.token}
                      </p>
                    ) : null}
                  </div>
                  {!item.readAt ? (
                    <button
                      type="button"
                      onClick={() => onDismiss(item.id)}
                      className={`shrink-0 p-1 rounded ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-200"}`}
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
