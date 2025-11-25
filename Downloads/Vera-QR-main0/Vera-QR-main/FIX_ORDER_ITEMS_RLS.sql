-- Fix order_items RLS policy to allow insert during order creation
DROP POLICY IF EXISTS "Allow insert order_items" ON order_items;

-- Allow anyone to insert order items (part of order creation)
CREATE POLICY "Allow insert order_items"
ON order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow select for order tracking
DROP POLICY IF EXISTS "Allow select order_items" ON order_items;
CREATE POLICY "Allow select order_items"
ON order_items FOR SELECT
TO anon, authenticated
USING (true);
