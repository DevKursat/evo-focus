-- Create reviews table with enhanced features
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES organizations(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_published BOOLEAN DEFAULT true,
    
    -- Restaurant Reply
    reply TEXT,
    reply_at TIMESTAMPTZ,
    
    -- Admin Complaint System
    complaint_reason TEXT,
    complaint_status TEXT CHECK (complaint_status IN ('pending', 'resolved', 'dismissed')),
    complaint_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public/Anonymous can insert reviews (linked to their order)
CREATE POLICY "Anyone can insert reviews" 
ON reviews FOR INSERT 
WITH CHECK (true);

-- 2. Public can view published reviews
CREATE POLICY "Public can view published reviews" 
ON reviews FOR SELECT 
USING (is_published = true);

-- 3. Restaurant owners can view all reviews for their restaurant
CREATE POLICY "Restaurants can view their own reviews" 
ON reviews FOR SELECT 
USING (auth.uid() IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id = reviews.restaurant_id
));

-- 4. Restaurant owners can update (reply/report) their own reviews
CREATE POLICY "Restaurants can update their own reviews" 
ON reviews FOR UPDATE 
USING (auth.uid() IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id = reviews.restaurant_id
));

-- 5. Platform Admins can do everything (view/update all)
-- Assuming a generic admin check or specific role. 
-- For now, we'll rely on the service_role for admin dashboard or specific admin user IDs if available.
-- If you have a specific admin table or role, add it here.
-- Example: USING (auth.jwt() ->> 'role' = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
