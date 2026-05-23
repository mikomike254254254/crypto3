-- Wallex setup: run in Supabase → SQL Editor (in order)
-- 1) supabase/fix_notifications.sql
-- 2) supabase/migrations/*.sql (oldest first)
-- 3) Then run the block below:

create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.admins (email)
values ('wallexsupport@proton.me')
on conflict (email) do nothing;
