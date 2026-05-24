-- Wallex wallet ledger (used by /api routes)
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  wallet text not null unique,
  email text,
  full_name text,
  avatar_url text,
  kyc_status text not null default 'unverified',
  signup_bonus_awarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.balances (
  wallet text primary key,
  amount numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  from_wallet text not null,
  to_wallet text not null,
  amount numeric not null check (amount > 0),
  token text not null,
  type text not null,
  status text not null default 'completed',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  email text primary key
);

create index if not exists users_auth_user_id_idx on public.users(auth_user_id);
create index if not exists users_wallet_idx on public.users(wallet);
create index if not exists transactions_from_wallet_idx on public.transactions(from_wallet);
create index if not exists transactions_to_wallet_idx on public.transactions(to_wallet);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);

insert into public.admins (email)
values ('wallexsupport@proton.me')
on conflict (email) do nothing;

alter table public.users enable row level security;
alter table public.balances enable row level security;
alter table public.transactions enable row level security;
alter table public.admins enable row level security;
