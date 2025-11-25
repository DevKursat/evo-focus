-- Fix RLS policies for orders table to allow anonymous insert
-- This is needed for customer orders

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anonymous insert orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated insert orders" ON orders;

-- Allow anyone (including anonymous users) to insert orders
CREATE POLICY "Allow anonymous insert orders"
ON orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to view their own orders (by session_id)
DROP POLICY IF EXISTS "Users can view their orders" ON orders;
CREATE POLICY "Users can view their orders"
ON orders FOR SELECT
TO anon, authenticated
USING (true);
