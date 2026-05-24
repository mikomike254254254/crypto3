/** Shared SEO copy — keep in sync with index.html meta tags */
export const SITE_URL = "https://wallex.online";
export const SITE_NAME = "Wallex";

export const SEO_TITLE =
  "Wallex — Crypto Wallet | M-Pesa, Bitcoin, ETH, USDT & Swap";

export const SEO_DESCRIPTION =
  "Buy, swap and send crypto with M-Pesa and card top-up. Bitcoin, Ethereum, XRP and USDT wallet with live prices, P2P desk and secure transfers — free on wallex.online.";

export const SEO_TAGLINE = "Crypto wallet · M-Pesa · Card top-up · Live markets";

export const SEO_KEYWORDS = [
  "Wallex",
  "crypto wallet",
  "bitcoin wallet",
  "crypto M-Pesa",
  "M-Pesa crypto",
  "buy crypto Kenya",
  "USDT wallet",
  "BTC wallet",
  "ETH wallet",
  "XRP wallet",
  "swap crypto",
  "P2P crypto",
  "card top up crypto",
  "wallex.online",
].join(", ");

export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOGO_IMAGE = `${SITE_URL}/logo.png`;

/** Rich result + Google snippet copy (title ≈60 chars, description ≈155) */
export const SEO_SUBTITLE =
  "Crypto · M-Pesa · Bitcoin · ETH · USDT · Swap · P2P · Live prices";

export const SEO_FAQ = [
  {
    q: "What is Wallex?",
    a: "Wallex is a secure crypto wallet on wallex.online. Buy, receive, swap, and send Bitcoin, Ethereum, XRP, USDT and more with card top-up, M-Pesa rails, and wallet-to-wallet transfers.",
  },
  {
    q: "Can I use M-Pesa with Wallex?",
    a: "Yes. Wallex supports M-Pesa-friendly top-up and P2P flows alongside card and bank deposit for funding your crypto wallet in Kenya and internationally.",
  },
  {
    q: "Do I need KYC to buy crypto on Wallex?",
    a: "No. Card and bank top-ups and receiving transfers work without KYC. Verification is required before you send or withdraw to external addresses.",
  },
  {
    q: "Which cryptocurrencies does Wallex support?",
    a: "Wallex supports Bitcoin (BTC), Ethereum (ETH), XRP, USDT, and additional assets with live USD prices and in-app swap.",
  },
  {
    q: "Is Wallex free?",
    a: "Creating a Wallex wallet is free. New accounts may receive welcome bonus credits. Standard network and payment fees apply to top-ups and transfers.",
  },
  {
    q: "How do I contact Wallex support?",
    a: "Email wallexsupport@proton.me from the app or landing page for help with deposits, KYC, and transfers.",
  },
] as const;

export function buildWallexJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: LOGO_IMAGE,
          width: 512,
          height: 512,
        },
        image: OG_IMAGE,
        email: "wallexsupport@proton.me",
        description: SEO_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: SEO_TAGLINE,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        name: "Wallex Crypto Wallet",
        url: `${SITE_URL}/`,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description: SEO_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: SEO_FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
}
