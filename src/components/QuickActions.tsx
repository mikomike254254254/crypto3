import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Users, X, ShieldAlert } from "lucide-react";

type QuickActionId = "buy" | "sell" | "swap" | "p2p";

interface QuickActionsProps {
  onAction?: (action: QuickActionId) => void;
  kycVerified?: boolean;
}

export function QuickActions({ onAction, kycVerified }: QuickActionsProps) {
  const { isDark } = useTheme();
  const [showKycWarning, setShowKycWarning] = useState(false);

  const handleAction = (id: QuickActionId) => {
    if (id === "swap" && !kycVerified) {
      setShowKycWarning(true);
      return;
    }
    onAction?.(id);
  };

  const actions: { id: QuickActionId; label: string; icon: typeof ArrowDownCircle }[] = [
    { id: "buy", label: "Buy", icon: ArrowDownCircle },
    { id: "sell", label: "Sell", icon: ArrowUpCircle },
    { id: "swap", label: "Swap", icon: ArrowLeftRight },
    { id: "p2p", label: "P2P", icon: Users },
  ];

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Quick Actions</h3>
          <button className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>More</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const isSwap = action.id === "swap";
            const locked = isSwap && !kycVerified;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleAction(action.id)}
                className={`group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 border relative overflow-hidden
                  ${locked 
                    ? isDark 
                      ? 'bg-neutral-900/50 border-neutral-800 cursor-not-allowed opacity-60' 
                      : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                    : isDark 
                      ? 'bg-neutral-900 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800' 
                      : 'bg-white shadow-sm border-neutral-100 hover:shadow-md hover:border-neutral-200'
                  }`}
              >
                {locked && (
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/20 to-neutral-900/40 z-10" />
                )}
                <div className={`mb-1.5 transition-transform duration-300 group-hover:scale-110 relative z-20 ${locked ? 'text-neutral-500' : isDark ? 'text-white' : 'text-black'}`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className={`text-[10px] font-semibold transition-colors relative z-20 ${locked ? 'text-neutral-500' : isDark ? 'text-neutral-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'}`}>{action.label}</span>
                {locked && (
                  <span className="text-[8px] text-amber-500 mt-0.5 relative z-20 font-medium">Locked</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KYC Warning Overlay - Black & 3D */}
      {showKycWarning && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ 
            background: "linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(10,10,10,0.88) 100%)",
            backdropFilter: "blur(12px)"
          }}
          onClick={() => setShowKycWarning(false)}
        >
          <div 
            className="relative w-full max-w-sm mx-auto rounded-3xl border border-neutral-700/60 p-8 text-center"
            style={{
              background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
              transform: "perspective(1000px) rotateX(2deg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow accent */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Close button */}
            <button
              onClick={() => setShowKycWarning(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-all border border-neutral-700"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Icon */}
            <div className="mb-5 inline-flex">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(145deg, #262626 0%, #1a1a1a 100%)",
                  boxShadow: "8px 8px 16px rgba(0,0,0,0.5), -4px -4px 10px rgba(255,255,255,0.03)",
                }}
              >
                <ShieldAlert className="w-7 h-7 text-amber-400" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Swap Locked</h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Swaps are only available after completing identity verification. 
              Please verify your KYC to unlock this feature.
            </p>

            <button
              onClick={() => {
                setShowKycWarning(false);
                onAction?.("buy"); // triggers KYC modal via buy flow
              }}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-black bg-white hover:bg-neutral-200 transition-all"
              style={{
                boxShadow: "0 4px 20px rgba(255,255,255,0.1)",
              }}
            >
              Verify Identity
            </button>

            <button
              onClick={() => setShowKycWarning(false)}
              className="w-full mt-2 py-3 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Maybe later
            </button>

            {/* 3D bottom shadow */}
            <div className="absolute -bottom-6 left-8 right-8 h-8 bg-black/60 blur-2xl rounded-full pointer-events-none" />
          </div>
        </div>
      )}
    </>
  );
}