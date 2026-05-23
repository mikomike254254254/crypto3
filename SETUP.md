# Wallex setup

## 1. Supabase database

```bash
cd wallex2
supabase login
supabase link --project-ref nzzstvvbrcdhuiqppdpv
supabase db push
```

## 2. Google sign-in (Supabase Dashboard)

1. Open [Supabase → Authentication → Providers → Google](https://supabase.com/dashboard/project/nzzstvvbrcdhuiqppdpv/auth/providers).
2. Enable Google and paste your **Client ID** and **Client Secret** from Google Cloud Console.
3. Under **Authentication → URL Configuration**, set **Site URL** to `https://wallex.online` (or your Vercel URL).
4. Add **Redirect URLs**:
   - `https://wallex.online`
   - `https://wallex.online/mikeadmin`
   - `https://<your-vercel-app>.vercel.app`
   - `http://localhost:5173`

In Google Cloud Console → OAuth client → **Authorized redirect URIs**, add:

`https://nzzstvvbrcdhuiqppdpv.supabase.co/auth/v1/callback`

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in keys. For production, set the same names in **Vercel → Project → Settings → Environment Variables**:

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL` | Build + browser |
| `VITE_SUPABASE_ANON_KEY` | Build + browser |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build + browser (optional if anon key set) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Build + browser |
| `VITE_APP_URL` | Build + browser |
| `VITE_ADMIN_EMAILS` | Build + browser |
| `SUPABASE_URL` | API routes only |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes only |
| `PAYSTACK_SECRET_KEY` | API routes only |
| `ADMIN_EMAILS` | API routes only |

## 4. Local development

```bash
npm install
npm run dev          # frontend only
npx vercel dev       # frontend + /api routes (Paystack verify, admin, wallets)
```

## 5. Deploy to Vercel

```bash
npx vercel --prod
```

Admin console: `/mikeadmin` (sign in with `mikomike420@gmail.com` via Google).

Buy / top-up: wallet **Receive** → **Top up with Paystack** (card, bank, transfer).
