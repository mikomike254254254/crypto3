-- Run in Supabase SQL Editor if /api/notifications returns 500
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

alter table public.notifications add column if not exists amount numeric;
alter table public.notifications add column if not exists token text;
alter table public.notifications add column if not exists from_wallet text;

create index if not exists notifications_auth_user_id_idx on public.notifications(auth_user_id);
