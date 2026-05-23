import { useTheme } from "../context/ThemeContext";

export function StatusBar() {
  const { isDark } = useTheme();
  
  return (
    <div className={`px-6 py-2 flex items-center justify-between transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-neutral-50'}`}>
      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
        9:41
      </span>
      <div className="flex items-center gap-1">
        <svg width="18" height="12" viewBox="0 0 18 12" className={isDark ? 'text-white' : 'text-black'}>
          <rect x="0" y="8" width="3" height="4" rx="0.5" fill="currentColor" />
          <rect x="4" y="5" width="3" height="7" rx="0.5" fill="currentColor" />
          <rect x="8" y="3" width="3" height="9" rx="0.5" fill="currentColor" />
          <rect x="12" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" className={`ml-1 ${isDark ? 'text-white' : 'text-black'}`}>
          <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="currentColor" />
          <path d="M4.93 7.43a4.5 4.5 0 016.14 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M2.1 4.6a8.5 8.5 0 0111.8 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        <div className="flex items-center ml-1">
          <div className={`w-6 h-3 border rounded-sm relative ${isDark ? 'border-white' : 'border-black'}`}>
            <div className={`absolute inset-0.5 rounded-sm ${isDark ? 'bg-white' : 'bg-black'}`} style={{ width: '75%' }} />
          </div>
          <div className={`w-0.5 h-1.5 rounded-r-sm ml-0.5 ${isDark ? 'bg-white' : 'bg-black'}`} />
        </div>
      </div>
    </div>
  );
}