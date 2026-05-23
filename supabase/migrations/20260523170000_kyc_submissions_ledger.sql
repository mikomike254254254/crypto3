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

create index if not exists kyc_submissions_auth_user_id_idx on public.kyc_submissions(auth_user_id);
create index if not exists kyc_submissions_status_idx on public.kyc_submissions(status);

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;
