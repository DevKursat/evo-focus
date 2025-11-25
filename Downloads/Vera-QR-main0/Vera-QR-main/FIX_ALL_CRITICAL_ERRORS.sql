-- COMPREHENSIVE FIX FOR ALL ORDER-RELATED ISSUES
-- Run this single script to fix all 3 problems

-- 1. FIX COUPONS RLS
DROP POLICY IF EXISTS "Allow authenticated users to insert coupons" ON coupons;
DROP POLICY IF EXISTS "Restaurants can manage their coupons" ON coupons;
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;

CREATE POLICY "Restaurants can insert their coupons"
ON coupons FOR INSERT
TO authenticated
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()
    )
);

CREATE POLICY "Restaurants can manage their coupons"
ON coupons FOR ALL
TO authenticated
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()
    )
);

CREATE POLICY "Public can view active coupons"
ON coupons FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 2. FIX ORDER_ITEMS RLS
DROP POLICY IF EXISTS "Allow insert order_items" ON order_items;
DROP POLICY IF EXISTS "Allow select order_items" ON order_items;

CREATE POLICY "Allow insert order_items"
ON order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow select order_items"
ON order_items FOR SELECT
TO anon, authenticated
USING (true);

-- 3. VERIFY ORDERS RLS (should already be fixed)
-- This was fixed earlier, just verifying
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'orders';
