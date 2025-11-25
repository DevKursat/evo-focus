-- Test creating an order directly to see the exact error
-- First, let's check if we have any restaurants
SELECT id, name FROM restaurants LIMIT 3;

-- If you see restaurants, pick one ID and replace below
-- Also get a product ID
SELECT id, name_tr, price FROM products LIMIT 3;

-- Try to create a test order (replace the IDs with actual values from above)
INSERT INTO orders (
    restaurant_id,
    order_number,
    subtotal,
    tax_amount,
    total_amount,
    status,
    session_id,
    payment_status
) VALUES (
    'YOUR_RESTAURANT_ID_HERE', -- Replace this
    'TEST-001',
    100.00,
    10.00,
    110.00,
    'pending',
    'test-session',
    'unpaid'
) RETURNING id, order_number;
