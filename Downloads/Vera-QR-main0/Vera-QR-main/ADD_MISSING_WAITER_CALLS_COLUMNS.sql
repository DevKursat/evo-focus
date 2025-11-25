-- ADD MISSING COLUMNS TO WAITER_CALLS TABLE
-- Run this in Supabase SQL Editor to fix "acknowledged_at column not found" error

-- Add acknowledged_at column for tracking when waiter call is acknowledged
ALTER TABLE waiter_calls 
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

-- Add other potentially missing columns for complete functionality
ALTER TABLE waiter_calls 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify all columns are now present
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'waiter_calls'
  AND table_schema = 'public'
ORDER BY ordinal_position;
