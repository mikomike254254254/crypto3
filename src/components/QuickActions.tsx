import { useTheme } from "../context/ThemeContext";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Users, TrendingUp, DollarSign, Repeat, Handshake } from "lucide-react";
import { CryptoLogo } from "./CryptoLogo";

type QuickActionId = "buy" | "sell" | "swap" | "p2p";

interface QuickActionsProps {
  onAction?: (action: QuickActionId) => void;
}

const actionCrypto: Record<QuickActionId, string> = {
  buy: "usdt",
  sell: "btc",
  swap: "eth",
  p2p: "xrp",
};

export function QuickActions({ onAction }: QuickActionsProps) {
  const { isDark } = useTheme();

  const actions: { id: QuickActionId; label: string; bgClass: string }[] = [
    { id: "buy", label: "Buy", bgClass: "bg-emerald-500" },
    { id: "sell", label: "Sell", bgClass: "bg-rose-500" },
    { id: "swap", label: "Swap", bgClass: "bg-blue-500" },
    { id: "p2p", label: "P2P", bgClass: "bg-violet-500" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Quick Actions</h3>
        <button className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>More</button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => {
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction?.(action.id)}
              className={`group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 border ${isDark ? 'bg-neutral-900 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800' : 'bg-white shadow-sm border-neutral-100 hover:shadow-md hover:border-neutral-200'}`}
            >
              <div className={`mb-1.5 transition-transform duration-300 group-hover:scale-110 ${action.bgClass} rounded-full p-1.5`}>
                <CryptoLogo symbol={actionCrypto[action.id]} size={20} className="!rounded-none" />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-neutral-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'}`}>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
