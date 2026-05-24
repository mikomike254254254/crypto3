-- Optional upgrade for project nzzstvvbrcdhuiqppdpv (run in Supabase SQL Editor)
-- App works WITHOUT this — code adapts to user_id + message schema.

alter table public.users add column if not exists avatar_character text;
alter table public.users add column if not exists avatar_gradient text;
alter table public.users add column if not exists onboarding_complete boolean not null default false;

alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists body text;
alter table public.notifications add column if not exists read_at timestamptz;

-- If you want auth_user_id instead of user_id:
-- alter table public.notifications rename column user_id to auth_user_id;
