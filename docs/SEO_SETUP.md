# Wallex SEO setup

After deploy, complete these steps so Google shows your **logo**, **title**, and **description** in search results.

## 1. Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://wallex.online`
3. Verify via DNS (recommended) or HTML tag
4. Submit sitemap: `https://wallex.online/sitemap.xml`
5. Use **URL Inspection** → **Request indexing** for `https://wallex.online/`

## 2. What we ship

| Asset | URL |
|-------|-----|
| Logo (favicon + schema) | `https://wallex.online/logo.png` |
| Social / OG image | `https://wallex.online/og-image.png` |
| Sitemap | `https://wallex.online/sitemap.xml` |
| Robots | `https://wallex.online/robots.txt` |

## 3. Search snippet copy

- **Title:** Wallex — Crypto Wallet | M-Pesa, Bitcoin, ETH, USDT & Swap
- **Description:** Buy, swap and send crypto with M-Pesa and card top-up…
- **Keywords:** crypto wallet, crypto M-Pesa, bitcoin wallet, USDT, swap, P2P

Structured data (JSON-LD) includes Organization logo, WebSite, WebApplication, and FAQ — this helps Google show rich results.

## 4. Timeline

Google usually re-crawls within **3–14 days** after sitemap submission. Ranking for competitive terms (e.g. “crypto wallet”) takes longer and depends on backlinks and traffic. Brand searches like **Wallex** or **wallex.online** should appear first once indexed.

## 5. Edit SEO copy

Update `src/constants/seo.ts` — meta tags and JSON-LD sync automatically at build time.
