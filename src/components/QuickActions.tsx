import { useTheme } from "../context/ThemeContext";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Users } from "lucide-react";

type QuickActionId = "buy" | "sell" | "swap" | "p2p";

interface QuickActionsProps {
  onAction?: (action: QuickActionId) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const { isDark } = useTheme();

  const actions: { id: QuickActionId; label: string; icon: typeof ArrowDownCircle }[] = [
    { id: "buy", label: "Buy", icon: ArrowDownCircle },
    { id: "sell", label: "Sell", icon: ArrowUpCircle },
    { id: "swap", label: "Swap", icon: ArrowLeftRight },
    { id: "p2p", label: "P2P", icon: Users },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Quick Actions</h3>
        <button className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>More</button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction?.(action.id)}
              className={`group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 border ${isDark ? 'bg-neutral-900 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800' : 'bg-white shadow-sm border-neutral-100 hover:shadow-md hover:border-neutral-200'}`}
            >
              <div className={`mb-1.5 transition-transform duration-300 group-hover:scale-110 ${isDark ? 'text-white' : 'text-black'}`}>
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-neutral-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'}`}>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}