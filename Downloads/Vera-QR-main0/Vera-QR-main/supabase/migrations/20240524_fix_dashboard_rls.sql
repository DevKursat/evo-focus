-- Enable RLS on all relevant tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

-- Helper policy for restaurant admins to access data belonging to their restaurant
-- We can reuse this logic for multiple tables

-- ORDERS
DROP POLICY IF EXISTS "Restaurant admins can view orders" ON orders;
CREATE POLICY "Restaurant admins can view orders" ON orders FOR SELECT
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Restaurant admins can update orders" ON orders;
CREATE POLICY "Restaurant admins can update orders" ON orders FOR UPDATE
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

-- COUPONS
DROP POLICY IF EXISTS "Restaurant admins can view coupons" ON coupons;
CREATE POLICY "Restaurant admins can view coupons" ON coupons FOR SELECT
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Restaurant admins can insert coupons" ON coupons;
CREATE POLICY "Restaurant admins can insert coupons" ON coupons FOR INSERT
WITH CHECK (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Restaurant admins can update coupons" ON coupons;
CREATE POLICY "Restaurant admins can update coupons" ON coupons FOR UPDATE
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Restaurant admins can delete coupons" ON coupons;
CREATE POLICY "Restaurant admins can delete coupons" ON coupons FOR DELETE
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

-- LOYALTY POINTS
DROP POLICY IF EXISTS "Restaurant admins can view loyalty" ON loyalty_points;
CREATE POLICY "Restaurant admins can view loyalty" ON loyalty_points FOR SELECT
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Restaurant admins can update loyalty" ON loyalty_points;
CREATE POLICY "Restaurant admins can update loyalty" ON loyalty_points FOR UPDATE
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

-- LOYALTY TRANSACTIONS
-- Transactions link to loyalty_points, which has restaurant_id. Or maybe they have restaurant_id directly?
-- Assuming they link via loyalty_point_id.
-- Safe approach: Check if the associated loyalty_point belongs to a restaurant user manages.
DROP POLICY IF EXISTS "Restaurant admins can view transactions" ON loyalty_transactions;
CREATE POLICY "Restaurant admins can view transactions" ON loyalty_transactions FOR SELECT
USING (
  loyalty_point_id IN (
    SELECT id FROM loyalty_points
    WHERE restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Restaurant admins can insert transactions" ON loyalty_transactions;
CREATE POLICY "Restaurant admins can insert transactions" ON loyalty_transactions FOR INSERT
WITH CHECK (
  loyalty_point_id IN (
    SELECT id FROM loyalty_points
    WHERE restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid())
  )
);

-- REVIEWS
DROP POLICY IF EXISTS "Restaurant admins can view reviews" ON reviews;
CREATE POLICY "Restaurant admins can view reviews" ON reviews FOR SELECT
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Restaurant admins can update reviews" ON reviews;
CREATE POLICY "Restaurant admins can update reviews" ON reviews FOR UPDATE
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Restaurant admins can delete reviews" ON reviews;
CREATE POLICY "Restaurant admins can delete reviews" ON reviews FOR DELETE
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

-- TABLE CALLS
DROP POLICY IF EXISTS "Restaurant admins can view calls" ON table_calls;
CREATE POLICY "Restaurant admins can view calls" ON table_calls FOR SELECT
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Restaurant admins can update calls" ON table_calls;
CREATE POLICY "Restaurant admins can update calls" ON table_calls FOR UPDATE
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));

-- WEBHOOK CONFIGS
DROP POLICY IF EXISTS "Restaurant admins can manage webhooks" ON webhook_configs;
CREATE POLICY "Restaurant admins can manage webhooks" ON webhook_configs FOR ALL
USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE profile_id = auth.uid()));
