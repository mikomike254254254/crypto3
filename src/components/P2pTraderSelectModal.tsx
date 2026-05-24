import { BadgeCheck, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import type { P2pTrader } from "../lib/p2pTrader";
import { KenyaFlag } from "./KenyaFlag";
import { SUPPORT_EMAIL } from "../constants/support";

interface P2pTraderSelectModalProps {
  traders: P2pTrader[];
  onSelect: (trader: P2pTrader) => void;
  onClose: () => void;
}

export function P2pTraderSelectModal({ traders, onSelect, onClose }: P2pTraderSelectModalProps) {
  const { isDark } = useTheme();
  const panel = isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-200 text-black";

  return (
    <div className="fixed inset-0 z-[74] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pb-24">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${panel}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
          <div>
            <h2 className="text-lg font-bold">Choose P2P trader</h2>
            <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
              Kenya merchants · orders via {SUPPORT_EMAIL}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"}`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
          {traders.map((trader) => (
            <button
              key={trader.id}
              type="button"
              onClick={() => onSelect(trader)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
                isDark ? "border-neutral-800 hover:bg-neutral-900" : "border-neutral-100 hover:bg-neutral-50"
              }`}
            >
              <div className="relative shrink-0">
                {trader.avatarUrl ? (
                  <img src={trader.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-emerald-600 flex items-center justify-center text-lg font-bold text-white">
                    {trader.name.charAt(0)}
                  </div>
                )}
                {trader.online ? (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm">{trader.name}</span>
                  {trader.verified ? <BadgeCheck className="w-4 h-4 text-sky-500 shrink-0" /> : null}
                  <KenyaFlag className="h-3.5 w-5 shrink-0" />
                </div>
                <p className={`text-[10px] mt-0.5 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                  {trader.completedTrades.toLocaleString()} trades · ~{trader.responseMins} min reply
                </p>
                <p className="text-xs font-semibold text-emerald-500 mt-0.5">KES {trader.kesPerUsdt.toFixed(2)} / USDT</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
