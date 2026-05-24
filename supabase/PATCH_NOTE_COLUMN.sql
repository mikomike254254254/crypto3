-- Add the note column to transactions table if it doesn't exist
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT;

-- Verify it was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'transactions' 
ORDER BY ordinal_position;