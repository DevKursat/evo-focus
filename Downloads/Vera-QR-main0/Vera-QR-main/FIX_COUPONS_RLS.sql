-- Fix coupons RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert coupons" ON coupons;
DROP POLICY IF EXISTS "Restaurants can manage their coupons" ON coupons;
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;

-- Allow restaurant admins to insert coupons
CREATE POLICY "Restaurants can insert their coupons"
ON coupons FOR INSERT
TO authenticated
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()
    )
);

-- Allow restaurant admins to view and update their coupons
CREATE POLICY "Restaurants can manage their coupons"
ON coupons FOR ALL
TO authenticated
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()
    )
);

-- Allow public to view active coupons for validation
CREATE POLICY "Public can view active coupons"
ON coupons FOR SELECT
TO anon, authenticated
USING (is_active = true);
