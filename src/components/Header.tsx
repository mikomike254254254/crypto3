import { RefreshCw, Bell } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  walletId?: string;
}

export function Header({ walletId = "Wallex account" }: HeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { isDark } = useTheme();

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  return (
    <div className={`px-4 py-3 flex items-center justify-between transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-neutral-100'}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-black">
          <img src="/logo.png" alt="Wallex" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Wallet ID:
          </span>
          <span className={`text-sm font-medium -mt-0.5 ${isDark ? 'text-white' : 'text-black'}`}>
            {walletId}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSync} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-200'}`}>
          <RefreshCw className={`w-5 h-5 transition-transform ${isSyncing ? 'animate-spin' : ''} ${isDark ? 'text-white' : 'text-black'}`} />
        </button>
        <button className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 relative ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-200'}`}>
          <Bell className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </div>
  );
}
