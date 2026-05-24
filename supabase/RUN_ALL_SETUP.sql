-- Wallex full database setup — run once in Supabase SQL Editor
-- Project: nzzstvvbrcdhuiqppdpv

create extension if not exists "pgcrypto";

-- Core ledger
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  wallet text not null unique,
  email text,
  full_name text,
  avatar_url text,
  avatar_character text,
  avatar_gradient text,
  onboarding_complete boolean not null default false,
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
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists avatar_character text;
alter table public.users add column if not exists avatar_gradient text;
alter table public.users add column if not exists onboarding_complete boolean not null default false;

-- Notifications (fix auth_user_id)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'auth_user_id'
  ) then
    alter table public.notifications rename column user_id to auth_user_id;
  end if;
end $$;

create table if not exists public.notifications (
   id uuid primary key default gen_random_uuid(),
   auth_user_id uuid not null references auth.users(id) on delete cascade,
   type text not null default 'receive',
   title text,
   body text,
   amount numeric,
   token text,
   from_wallet text,
   read_at timestamptz,
   created_at timestamptz not null default now()
 );

alter table public.notifications add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;
alter table public.notifications add column if not exists type text not null default 'receive';
alter table public.notifications add column if not exists title text not null default 'Wallex';
alter table public.notifications add column if not exists body text not null default '';
alter table public.notifications add column if not exists amount numeric;
alter table public.notifications add column if not exists token text;
alter table public.notifications add column if not exists from_wallet text;
alter table public.notifications add column if not exists read_at timestamptz;
alter table public.notifications add column if not exists created_at timestamptz not null default now();

-- KYC
create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  wallet text,
  document_type text,
  legal_name text,
  date_of_birth text,
  country text,
  address text,
  front_path text,
  back_path text,
  selfie_path text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists users_auth_user_id_idx on public.users(auth_user_id);
create index if not exists users_wallet_idx on public.users(wallet);
create index if not exists transactions_from_wallet_idx on public.transactions(from_wallet);
create index if not exists transactions_to_wallet_idx on public.transactions(to_wallet);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);
create index if not exists notifications_auth_user_id_idx on public.notifications(auth_user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
create index if not exists kyc_submissions_auth_user_id_idx on public.kyc_submissions(auth_user_id);
create index if not exists kyc_submissions_status_idx on public.kyc_submissions(status);

-- Admin + storage
insert into public.admins (email) values ('wallexsupport@proton.me') on conflict (email) do nothing;

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

alter table public.users enable row level security;
alter table public.balances enable row level security;
alter table public.transactions enable row level security;
alter table public.admins enable row level security;
alter table public.notifications enable row level security;
