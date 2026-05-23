import { useMemo, useState } from "react";
import { Search, TrendingUp, TrendingDown, Star, Filter } from "lucide-react";
import { Crypto } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";
import { CryptoLogo } from "../components/CryptoLogo";
import { CoinProfileModal } from "../components/CoinProfileModal";

interface ExplorePageProps {
  cryptoData: Crypto[];
}

export function ExplorePage({ cryptoData }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [watchlist, setWatchlist] = useState<string[]>(["btc", "eth", "sol"]);
  const [selectedCoin, setSelectedCoin] = useState<Crypto | null>(null);
  const { isDark } = useTheme();

  const categories = [
    { id: "all", label: "All" },
    { id: "trending", label: "Trending" },
    { id: "gainers", label: "Top Gainers" },
    { id: "losers", label: "Top Losers" },
  ];

  const filteredCrypto = useMemo(() => {
    let list = cryptoData.filter(
      (crypto) =>
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (selectedCategory === "gainers") {
      list = [...list].sort((a, b) => (b.change ?? 0) - (a.change ?? 0));
    } else if (selectedCategory === "losers") {
      list = [...list].sort((a, b) => (a.change ?? 0) - (b.change ?? 0));
    } else if (selectedCategory === "trending") {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [cryptoData, searchQuery, selectedCategory]);

  const toggleWatchlist = (id: string) => {
    setWatchlist((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <div className="px-4 pt-2 pb-6 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>Explore</h1>
          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{cryptoData.length} cryptocurrencies</p>
        </div>
        <button type="button" className={`p-2 rounded-full shadow-sm ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`} aria-label="Filter">
          <Filter className={`w-5 h-5 ${isDark ? "text-white" : "text-black"}`} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          placeholder="Search coins, tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-xl py-3.5 pl-12 pr-4 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-black ${isDark ? "bg-neutral-900 border border-neutral-800 text-white" : "bg-white text-black"}`}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? "bg-black text-white"
                : isDark
                  ? "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 border border-neutral-800"
                  : "bg-white text-gray-600 hover:bg-neutral-200"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="flex justify-center mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
        {cryptoData.slice(0, 6).map((crypto) => (
          <button
            type="button"
            key={crypto.id}
            onClick={() => setSelectedCoin(crypto)}
            className={`rounded-2xl p-3 border text-left transition-transform hover:scale-[1.02] active:scale-[0.98] ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-100 shadow-sm"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <CryptoLogo symbol={crypto.symbol} size={36} />
              <span className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{crypto.symbol}</span>
            </div>
            <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>{formatPrice(crypto.price)}</p>
            <p className={`text-[10px] font-medium ${crypto.isUp ? "text-green-500" : "text-red-500"}`}>
              {(crypto.change ?? 0) >= 0 ? "+" : ""}
              {(crypto.change ?? 0).toFixed(2)}%
            </p>
          </button>
        ))}
        </div>
      </div>

      {filteredCrypto.length === 0 ? (
        <div className={`rounded-2xl p-8 text-center mb-4 ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-slate-100"}`}>
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>No coins match &quot;{searchQuery}&quot;</p>
        </div>
      ) : null}

      <div className="space-y-2">
        {filteredCrypto.map((crypto) => (
          <button
            type="button"
            key={crypto.id}
            onClick={() => setSelectedCoin(crypto)}
            className={`w-full rounded-2xl p-3.5 shadow-sm flex items-center gap-3 text-left transition-colors ${isDark ? "bg-neutral-900 border border-neutral-800 hover:bg-neutral-800" : "bg-white border border-slate-100 hover:bg-neutral-50"}`}
          >
            <CryptoLogo symbol={crypto.symbol} size={44} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-black"}`}>{crypto.name}</span>
                <span className={`text-xs font-medium ${isDark ? "text-neutral-500" : "text-gray-400"}`}>{crypto.symbol}</span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>24h vol · live</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-black"}`}>{formatPrice(crypto.price)}</p>
              <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${crypto.isUp ? "text-green-500" : "text-red-500"}`}>
                {crypto.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="text-xs font-medium">
                  {crypto.isUp ? "+" : ""}
                  {(crypto.change ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist(crypto.id);
              }}
              className="p-1 flex-shrink-0"
              aria-label="Watchlist"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  watchlist.includes(crypto.id) ? "fill-yellow-400 text-yellow-400" : isDark ? "text-neutral-600" : "text-gray-300"
                }`}
              />
            </button>
          </button>
        ))}
      </div>

      {selectedCoin ? <CoinProfileModal crypto={selectedCoin} onClose={() => setSelectedCoin(null)} /> : null}
    </div>
  );
}
