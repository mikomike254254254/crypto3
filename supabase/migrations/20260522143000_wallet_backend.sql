create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_gradient text,
  kyc_status text not null default 'not_started' check (kyc_status in ('not_started', 'pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_key text not null,
  name text not null,
  symbol text not null,
  balance numeric not null default 0,
  change numeric not null default 0,
  color text not null default 'green',
  account_number text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, wallet_key)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdraw', 'send', 'receive', 'swap', 'buy', 'sell')),
  amount numeric not null check (amount > 0),
  currency text not null,
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed')),
  reference text,
  address text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  legal_name text,
  date_of_birth date,
  country text,
  address text,
  front_path text,
  back_path text,
  selfie_path text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.wallets add column if not exists account_number text;
alter table public.wallets add column if not exists address text;
alter table public.transactions add column if not exists reference text;
alter table public.transactions add column if not exists metadata jsonb not null default '{}'::jsonb;

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.kyc_submissions enable row level security;

drop policy if exists "Users can read own profiles" on public.profiles;
create policy "Users can read own profiles"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own profiles" on public.profiles;
create policy "Users can update own profiles"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own wallets" on public.wallets;
create policy "Users can read own wallets"
  on public.wallets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read own kyc submissions" on public.kyc_submissions;
create policy "Users can read own kyc submissions"
  on public.kyc_submissions for select
  using (auth.uid() = user_id);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists wallets_user_id_idx on public.wallets(user_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_wallet_id_idx on public.transactions(wallet_id);
create index if not exists kyc_submissions_user_id_idx on public.kyc_submissions(user_id);
