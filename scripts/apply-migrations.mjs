import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const statements = [
  `create extension if not exists "pgcrypto";`,
  `create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid unique references auth.users(id) on delete cascade,
    wallet text not null unique,
    email text,
    full_name text,
    avatar_url text,
    kyc_status text not null default 'unverified',
    signup_bonus_awarded boolean not null default false,
    created_at timestamptz not null default now()
  );`,
  `create table if not exists public.balances (
    wallet text primary key,
    amount numeric not null default 0,
    updated_at timestamptz not null default now()
  );`,
  `create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    from_wallet text not null,
    to_wallet text not null,
    amount numeric not null check (amount > 0),
    token text not null,
    type text not null,
    status text not null default 'completed',
    note text,
    created_at timestamptz not null default now()
  );`,
  `create table if not exists public.admins (
    email text primary key
  );`,
  `insert into public.admins (email) values ('wallexsupport@proton.me') on conflict (email) do nothing;`,
  `alter table public.users add column if not exists avatar_character text;`,
  `alter table public.users add column if not exists avatar_gradient text;`,
  `alter table public.users add column if not exists onboarding_complete boolean not null default false;`,
  `create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid not null references auth.users(id) on delete cascade,
    type text not null default 'receive',
    title text not null,
    body text not null,
    amount numeric,
    token text,
    from_wallet text,
    read_at timestamptz,
    created_at timestamptz not null default now()
  );`,
];

async function runStatement(sql) {
  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (!error) return true;
  return false;
}

async function tableExists(name) {
  const { error } = await supabase.from(name).select("*").limit(1);
  return !error;
}

async function main() {
  console.log("Checking Supabase tables...");

  const usersOk = await tableExists("users");
  const notificationsOk = await tableExists("notifications");

  if (!usersOk) {
    console.log("\nusers table: MISSING — run supabase/migrations/20260523120000_wallet_ledger.sql");
    process.exit(1);
  }

  console.log("users table: OK");
  console.log(notificationsOk ? "notifications table: OK" : "notifications table: optional (missing)");

  console.log("\nRun this in Supabase SQL Editor if features fail:");
  console.log("https://supabase.com/dashboard/project/_/sql/new");
  for (const sql of [
    `alter table public.users add column if not exists avatar_character text;`,
    `alter table public.users add column if not exists avatar_gradient text;`,
    `alter table public.users add column if not exists onboarding_complete boolean not null default false;`,
    `alter table public.notifications add column if not exists amount numeric;`,
    `alter table public.notifications add column if not exists token text;`,
    `alter table public.notifications add column if not exists from_wallet text;`,
    `-- also run: supabase/migrations/20260523170000_kyc_submissions_ledger.sql`,
  ]) {
    console.log(`\n${sql}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
