# Wallex QA Audit Report

**Date:** 2026-05-23  
**Scope:** Logged-in wallet flows, landing, explore, API resilience  
**Method:** Code review + build verification (manual live test recommended after deploy)

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Balances on login | Fixed | App waits for `/api/wallets` before showing home |
| Send vs Withdraw | Fixed | Send opens transfer modal; withdraw is separate (Quick Actions → Sell) |
| Wallet picker balances | Fixed | Shows crypto + USD per wallet |
| Explore search | OK | Filters by name/symbol; empty state added |
| Coin profile | Added | Tap coin → live chart + volume estimate |
| M-PESA landing | Added | Black banner with logo + pop animation |
| SEO (Google snippet) | Improved | Title/description aligned with Guarda-style listing |
| Notifications 401 | Mitigated | Silent empty response when session expired |
| P2P Jeff | OK | Pending orders in admin ledger |

## Findings (by severity)

### High — action required outside code

1. **Paystack keys** — Set only in Vercel Environment Variables (`VITE_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`). Never commit live keys to GitHub.
2. **Supabase SQL** — Run `supabase/fix_notifications.sql` and migrations in Supabase SQL Editor if notifications return 500.
3. **Rotate keys** — User posted live Paystack keys in chat; rotate in Paystack dashboard after testing.

### Medium

4. **Network errors** (`ERR_CONNECTION_RESET`, `ERR_QUIC_PROTOCOL_ERROR`) — Usually client network, VPN, or Supabase edge; reduced by 60s polling and session refresh retry.
5. **M-PESA** — Marketing banner only; actual M-PESA settlement requires payment provider integration (not automated in this release).
6. **Coin chart** — Uses CoinGecko `market_chart`; may rate-limit on heavy traffic (falls back to sparkline).

### Low

7. **Vercel Hobby** — Max 12 serverless functions; no new API files added (chart merged into `/api/prices`).
8. **P2P sell** — Creates pending withdraw; admin must complete in `/mikeadmin`.

## Recommended manual test checklist

- [ ] Sign up / log in → see USDT/XRP/BTC/ETH balances
- [ ] Home → Send → send form (not withdraw)
- [ ] Home → Receive → deposit / Paystack
- [ ] Explore → search "btc" → open profile → chart loads
- [ ] Quick Actions → P2P → order with Jeff
- [ ] Settings → currency change reflects on balance card
- [ ] Admin → approve pending P2P / KYC

## Test account

Create a fresh account via wallex.online signup (email + password or Google). Do not use shared passwords in this document.
