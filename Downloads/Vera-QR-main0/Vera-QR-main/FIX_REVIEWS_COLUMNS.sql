-- ADD ALL MISSING COLUMNS TO REVIEWS TABLE
-- Run this to fix "order_id column does not exist" error

-- Add all base columns if they don't exist
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id),
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS comment TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reply TEXT,
ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS complaint_reason TEXT,
ADD COLUMN IF NOT EXISTS complaint_status TEXT CHECK (complaint_status IN ('pending', 'resolved', 'dismissed')),
ADD COLUMN IF NOT EXISTS complaint_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verify all columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public'
ORDER BY ordinal_position;
