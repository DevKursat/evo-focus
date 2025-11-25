-- ADD COMPLETED_AT COLUMN TO WAITER_CALLS TABLE
-- Fixes the issue where 'Complete' action fails because the code expects 'completed_at' but DB has 'resolved_at'

ALTER TABLE waiter_calls 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'waiter_calls' AND column_name = 'completed_at';
