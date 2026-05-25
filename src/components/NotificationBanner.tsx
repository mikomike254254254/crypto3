import { useState, useCallback, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import type { WalletNotification } from "../services/walletBackend";

interface NotificationBannerProps {
  notifications: WalletNotification[];
  onDismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 4000;

export function NotificationBanner({ notifications, onDismiss }: NotificationBannerProps) {
  const { isDark } = useTheme();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleDismiss = useCallback((id: string) => {
    // Clear auto-dismiss timer if exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setDismissedIds(prev => new Set(prev).add(id));
    onDismiss(id);
  }, [onDismiss]);

  // Find new notifications that just appeared and auto-dismiss them
  const seenIdsRef = useRef<Set<string>>(new Set());
  
  const unread = notifications
    .filter((item) => !item.readAt && !dismissedIds.has(item.id))
    .slice(0, 1); // Show only most recent

  // Auto-dismiss new notifications
  useEffect(() => {
    for (const item of unread) {
      if (!seenIdsRef.current.has(item.id)) {
        seenIdsRef.current.add(item.id);
        // Auto-dismiss after delay
        const timer = setTimeout(() => {
          handleDismiss(item.id);
          timersRef.current.delete(item.id);
        }, AUTO_DISMISS_MS);
        timersRef.current.set(item.id, timer);
      }
    }
  }, [unread, handleDismiss]);

  if (!unread.length) return null;

  return (
    <div className="px-4 pt-3">
      {unread.map((item) => (
        <div
          key={item.id}
          className="relative overflow-hidden rounded-2xl border border-neutral-700/60 p-4 flex items-start gap-3 animate-slideDown"
          style={{
            background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
            transform: "perspective(800px) rotateX(1deg)",
          }}
        >
          {/* Glow accent */}
          <div className="absolute -top-16 -left-8 w-32 h-32 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
          
          {/* Auto-dismiss progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800">
            <div 
              className="h-full bg-white/20 rounded-full animate-shrink" 
              style={{ animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards` }}
            />
          </div>

          {/* Icon */}
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(145deg, #262626 0%, #1a1a1a 100%)",
              boxShadow: "4px 4px 8px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.03)",
            }}
          >
            <Bell className="w-5 h-5 text-amber-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{item.title}</p>
            <p className="text-xs mt-0.5 text-neutral-400 leading-relaxed">{item.body}</p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss(item.id);
            }}
            className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-all border border-neutral-700 shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {/* 3D bottom shadow */}
          <div className="absolute -bottom-4 left-4 right-4 h-6 bg-black/40 blur-xl rounded-full pointer-events-none" />
        </div>
      ))}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: perspective(800px) rotateX(5deg) translateY(-16px); }
          to { opacity: 1; transform: perspective(800px) rotateX(1deg) translateY(0); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-slideDown {
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}