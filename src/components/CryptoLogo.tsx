const ICON_BASE = "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color";

const slugMap: Record<string, string> = {
  BTC: "btc",
  ETH: "eth",
  USDT: "usdt",
  SOL: "sol",
  XRP: "xrp",
  ADA: "ada",
  DOGE: "doge",
  BNB: "bnb",
  AVAX: "avax",
  MATIC: "matic",
  POL: "matic",
  LTC: "ltc",
  TRX: "trx",
  LINK: "link",
  DOT: "dot",
  SHIB: "shib",
  ATOM: "atom",
  UNI: "uni",
  XLM: "xlm",
  BCH: "bch",
  NEAR: "near",
};

export function cryptoIconUrl(symbol: string) {
  const slug = slugMap[symbol.toUpperCase()] || symbol.toLowerCase();
  return `${ICON_BASE}/${slug}.svg`;
}

interface CryptoLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CryptoLogo({ symbol, size = 40, className = "" }: CryptoLogoProps) {
  const initials = symbol.slice(0, 3).toUpperCase();

  return (
    <div
      className={`rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={cryptoIconUrl(symbol)}
        alt={`${symbol} logo`}
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        className="object-contain"
        loading="lazy"
        onError={(event) => {
          const target = event.currentTarget;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent && !parent.querySelector("[data-fallback]")) {
            const fallback = document.createElement("span");
            fallback.dataset.fallback = "true";
            fallback.className = "text-[10px] font-bold text-slate-600";
            fallback.textContent = initials;
            parent.appendChild(fallback);
          }
        }}
      />
    </div>
  );
}
