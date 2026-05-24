-- ============================================================
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create kyc_submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet TEXT NOT NULL,
  document_type TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  date_of_birth TEXT,
  country TEXT,
  address TEXT,
  front_path TEXT,
  back_path TEXT,
  selfie_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all KYC submissions"
  ON public.kyc_submissions
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))));

CREATE POLICY "Users can read their own KYC submissions"
  ON public.kyc_submissions
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert their own KYC submissions"
  ON public.kyc_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- 2. Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_character TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_gradient TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_bonus_awarded BOOLEAN DEFAULT false;

-- 3. Add missing columns to transactions table (including note for swap)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS from_wallet TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS to_wallet TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT;

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  message TEXT,
  amount NUMERIC,
  token TEXT,
  from_wallet TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid());

-- 5. Create kv_store table for admin settings
CREATE TABLE IF NOT EXISTS public.kv_store (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create admin_actions log table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create balances table
CREATE TABLE IF NOT EXISTS public.balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create user_gradients table for avatar storage
CREATE TABLE IF NOT EXISTS public.user_gradients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gradient_data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(auth_user_id)
);

-- 9. Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;