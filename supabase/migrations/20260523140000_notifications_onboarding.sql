alter table public.users add column if not exists avatar_character text;
alter table public.users add column if not exists avatar_gradient text;
alter table public.users add column if not exists onboarding_complete boolean not null default false;
update public.users set onboarding_complete = true where onboarding_complete = false;

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

create index if not exists notifications_auth_user_id_idx on public.notifications(auth_user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

alter table public.notifications enable row level security;
