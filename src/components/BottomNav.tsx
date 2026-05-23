import { Home, Search, User, Settings, Wallet } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { isDark } = useTheme();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'markets', label: 'Markets', icon: Search },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`absolute bottom-0 left-0 right-0 border-t px-2 py-2 ${
      isDark 
        ? 'bg-black border-neutral-800' 
        : 'bg-white border-neutral-200'
    }`}>
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive 
                  ? isDark 
                    ? 'bg-neutral-800' 
                    : 'bg-neutral-100'
                  : ''
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${
                  isActive 
                    ? 'text-black' 
                    : isDark 
                      ? 'text-neutral-500' 
                      : 'text-gray-400'
                }`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span 
                className={`text-[10px] mt-0.5 font-medium transition-colors ${
                  isActive 
                    ? 'text-black' 
                    : isDark 
                      ? 'text-neutral-500' 
                      : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}