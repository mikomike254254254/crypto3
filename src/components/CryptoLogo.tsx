import { useState } from "react";

/** npm package has broader coverage than the old spothq master path */
const ICON_BASE = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color";

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
  ATOM: "atom",
  UNI: "uni",
  XLM: "xlm",
  BCH: "bch",
};

/** Icons missing from cryptocurrency-icons — use CoinGecko CDN */
const iconOverrides: Record<string, string> = {
  SHIB: "https://coin-images.coingecko.com/coins/images/11939/small/shiba.png",
  NEAR: "https://coin-images.coingecko.com/coins/images/10365/small/near.jpg",
};

export function cryptoIconUrl(symbol: string) {
  const upper = symbol.toUpperCase();
  if (iconOverrides[upper]) return iconOverrides[upper];
  const slug = slugMap[upper] || symbol.toLowerCase();
  return `${ICON_BASE}/${slug}.svg`;
}

interface CryptoLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CryptoLogo({ symbol, size = 40, className = "" }: CryptoLogoProps) {
  const initials = symbol.slice(0, 3).toUpperCase();
  const [failed, setFailed] = useState(false);
  const src = cryptoIconUrl(symbol);

  return (
    <div
      className={`rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {!failed ? (
        <img
          src={src}
          alt={`${symbol} logo`}
          width={Math.round(size * 0.72)}
          height={Math.round(size * 0.72)}
          className="object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[10px] font-bold text-slate-600">{initials}</span>
      )}
    </div>
  );
}
