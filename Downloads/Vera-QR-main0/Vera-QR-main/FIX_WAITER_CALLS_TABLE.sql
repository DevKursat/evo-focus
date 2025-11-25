-- Add missing columns to waiter_calls table
ALTER TABLE waiter_calls 
ADD COLUMN IF NOT EXISTS qr_code_id UUID REFERENCES qr_codes(id),
ADD COLUMN IF NOT EXISTS call_type VARCHAR(50) DEFAULT 'service';

-- Update existing records to have default call_type
UPDATE waiter_calls 
SET call_type = 'service' 
WHERE call_type IS NULL;
