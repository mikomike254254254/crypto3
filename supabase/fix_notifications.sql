-- Run in Supabase SQL Editor (fixes "auth_user_id column" errors)

create extension if not exists "pgcrypto";

-- If an old notifications table used user_id, rename to auth_user_id
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
  title text not null,
  body text not null,
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

create index if not exists notifications_auth_user_id_idx on public.notifications(auth_user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
