-- COMPLETE FIX FOR WAITER_CALLS TABLE
-- Run this in Supabase SQL Editor

-- Add missing columns if they don't exist
ALTER TABLE waiter_calls 
ADD COLUMN IF NOT EXISTS qr_code_id UUID REFERENCES qr_codes(id),
ADD COLUMN IF NOT EXISTS call_type VARCHAR(50) DEFAULT 'service',
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'waiter_calls'
  AND table_schema = 'public'
ORDER BY ordinal_position;
