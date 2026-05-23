import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

interface SwipeToConfirmProps {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function SwipeToConfirm({
  label = "Swipe to send",
  disabled = false,
  loading = false,
  onConfirm,
}: SwipeToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const maxDrag = () => {
    const track = trackRef.current;
    if (!track) return 200;
    return track.clientWidth - 56;
  };

  const reset = () => {
    setDragX(0);
    setConfirmed(false);
  };

  const finish = async () => {
    if (disabled || loading || confirmed) return;
    setConfirmed(true);
    setDragX(maxDrag());
    try {
      await onConfirm();
    } catch {
      reset();
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (disabled || loading) return;
    const startX = event.clientX;
    const startDrag = dragX;
    let latest = startDrag;

    const onMove = (moveEvent: PointerEvent) => {
      latest = Math.max(0, Math.min(maxDrag(), startDrag + moveEvent.clientX - startX));
      setDragX(latest);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (latest >= maxDrag() * 0.85) {
        void finish();
      } else {
        setDragX(0);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={trackRef}
      className={`relative h-14 rounded-2xl bg-slate-950 overflow-hidden select-none touch-none ${disabled ? "opacity-50" : ""}`}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm font-semibold text-white/90">
          {loading ? "Processing..." : confirmed ? "Sent!" : label}
        </span>
      </div>
      <button
        type="button"
        onPointerDown={onPointerDown}
        disabled={disabled || loading}
        style={{ transform: `translateX(${dragX}px)` }}
        className="absolute left-1 top-1 bottom-1 w-12 rounded-xl bg-white text-slate-950 flex items-center justify-center shadow-lg transition-transform"
        aria-label={label}
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
