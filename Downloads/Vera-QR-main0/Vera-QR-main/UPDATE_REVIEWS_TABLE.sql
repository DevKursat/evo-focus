-- UPDATE REVIEWS TABLE AND POLICIES
-- Run this to fix "policy already exists" error and add missing columns

-- 1. Add missing columns if they don't exist
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS reply TEXT,
ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS complaint_reason TEXT,
ADD COLUMN IF NOT EXISTS complaint_status TEXT CHECK (complaint_status IN ('pending', 'resolved', 'dismissed')),
ADD COLUMN IF NOT EXISTS complaint_at TIMESTAMPTZ;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Public can view published reviews" ON reviews;
DROP POLICY IF EXISTS "Restaurants can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Restaurants can update their own reviews" ON reviews;

-- 3. Re-create policies
-- Public/Anonymous can insert reviews
CREATE POLICY "Anyone can insert reviews" 
ON reviews FOR INSERT 
WITH CHECK (true);

-- Public can view published reviews
CREATE POLICY "Public can view published reviews" 
ON reviews FOR SELECT 
USING (is_published = true);

-- Restaurant owners can view all reviews for their restaurant
CREATE POLICY "Restaurants can view their own reviews" 
ON reviews FOR SELECT 
USING (auth.uid() IN (
    SELECT profile_id FROM restaurant_admins 
    WHERE restaurant_id = reviews.restaurant_id
));

-- Restaurant owners can update (reply/report) their own reviews
CREATE POLICY "Restaurants can update their own reviews" 
ON reviews FOR UPDATE 
USING (auth.uid() IN (
    SELECT profile_id FROM restaurant_admins 
    WHERE restaurant_id = reviews.restaurant_id
));

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public';
