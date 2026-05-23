import { Home, Search, Wallet, User, Settings } from "lucide-react";

interface FooterProps {
  activeTab: number;
  onTabChange: (index: number) => void;
}

const navItems = [
  { icon: Home, label: "Home" },
  { icon: Search, label: "Explore" },
  { icon: Wallet, label: "Wallet" },
  { icon: User, label: "Profile" },
  { icon: Settings, label: "Settings" },
];

export function Footer({ activeTab, onTabChange }: FooterProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-1/2 sm:right-auto sm:w-[460px] sm:-translate-x-1/2">
      <div className="bg-black rounded-full px-2 py-3 shadow-xl shadow-black/30">
        <div className="flex items-center justify-around">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === index;
            
            return (
              <button
                key={index}
                onClick={() => onTabChange(index)}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1 transition-all duration-300 ease-out active:scale-90"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
                  isActive ? "bg-white scale-110 shadow-lg ring-2 ring-white/30" : "bg-transparent scale-100"
                }`}>
                  <Icon 
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-black" : "text-white"
                    }`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-white" : "text-gray-400"
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
