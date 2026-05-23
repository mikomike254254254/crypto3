import { useState } from "react";
import { Search, TrendingUp, TrendingDown, Star, Filter, ArrowRight } from "lucide-react";
import { Crypto } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";

interface ExplorePageProps {
  cryptoData: Crypto[];
}

export function ExplorePage({ cryptoData }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [watchlist, setWatchlist] = useState<string[]>(["btc", "eth"]);
  const { isDark } = useTheme();

  const categories = [
    { id: "all", label: "All" },
    { id: "trending", label: "Trending" },
    { id: "gainers", label: "Top Gainers" },
    { id: "losers", label: "Top Losers" },
    { id: "new", label: "New" },
  ];

  const filteredCrypto = cryptoData.filter(crypto => 
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const getCoinIcon = (symbol: string) => {
    const colors: Record<string, string> = {
      BTC: 'bg-gradient-to-br from-orange-400 to-orange-600',
      ETH: 'bg-gradient-to-br from-blue-400 to-indigo-600',
      BNB: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
      SOL: 'bg-gradient-to-br from-blue-400 to-cyan-500',
      XRP: 'bg-gradient-to-br from-gray-600 to-gray-800',
      ADA: 'bg-gradient-to-br from-blue-500 to-blue-700',
      DOGE: 'bg-gradient-to-br from-yellow-200 to-yellow-400',
      AVAX: 'bg-gradient-to-br from-red-400 to-red-600',
    };
    return colors[symbol] || 'bg-gradient-to-br from-gray-400 to-gray-600';
  };

  return (
    <div className="px-4 pt-2 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>Explore</h1>
        <button className={`p-2 rounded-full shadow-sm ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}>
          <Filter className={`w-5 h-5 ${isDark ? "text-white" : "text-black"}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search coins, tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-xl py-3.5 pl-12 pr-4 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-black ${isDark ? "bg-neutral-900 border border-neutral-800 text-white" : "bg-white text-black"}`}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-black text-white'
                : isDark ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 border border-neutral-800' : 'bg-white text-gray-600 hover:bg-neutral-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Featured Banner - Blue gradient instead of purple */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-4 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-xs text-white/80 font-medium mb-1">Featured</p>
        <h3 className="text-lg font-bold text-white mb-1">Earn up to 12% APY</h3>
        <p className="text-xs text-white/80 mb-3">Stake your crypto and earn rewards</p>
        <button className="flex items-center gap-1 bg-white text-black text-xs font-semibold px-4 py-2 rounded-full">
          Learn More <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Crypto List */}
      <div className="space-y-3">
        {filteredCrypto.map((crypto) => (
          <div 
            key={crypto.id}
            className={`rounded-2xl p-4 shadow-sm flex items-center gap-3 ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}
          >
            {/* Coin Icon */}
            <div className={`w-11 h-11 rounded-full ${getCoinIcon(crypto.symbol)} flex items-center justify-center text-white text-[9px] font-bold shadow-md flex-shrink-0`}>
              {crypto.symbol}
            </div>

            {/* Coin Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-black"}`}>{crypto.name}</span>
                <span className={`text-xs font-medium ${isDark ? "text-neutral-500" : "text-gray-400"}`}>{crypto.symbol}</span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>MCap: {crypto.marketCap}</p>
            </div>

            {/* Price & Change */}
            <div className="text-right flex-shrink-0">
              <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-black"}`}>{formatPrice(crypto.price)}</p>
              <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${
                crypto.isUp ? 'text-green-500' : 'text-red-500'
              }`}>
                {crypto.isUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-xs font-medium">
                  {crypto.isUp ? '+' : ''}{(crypto.change ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Star Button */}
            <button
              onClick={() => toggleWatchlist(crypto.id)}
              className="p-1 flex-shrink-0"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  watchlist.includes(crypto.id)
                    ? 'fill-yellow-400 text-yellow-400'
                    : isDark ? 'text-neutral-600' : 'text-gray-300'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
