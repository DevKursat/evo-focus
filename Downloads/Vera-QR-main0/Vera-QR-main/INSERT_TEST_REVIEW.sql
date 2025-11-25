-- Insert a test review manually to verify the dashboard
-- First, get restaurant_id and a recent order_id
-- You need to replace these with actual values from your database

-- Step 1: Find your restaurant_id
-- SELECT id, name FROM organizations LIMIT 5;

-- Step 2: Find a recent order_id
-- SELECT id, order_number, restaurant_id FROM orders ORDER BY created_at DESC LIMIT 5;

-- Step 3: Insert a test review (replace the UUIDs with actual values)
INSERT INTO reviews (
    restaurant_id,
    order_id,
    rating,
    comment,
    is_published
) VALUES (
    'YOUR_RESTAURANT_ID_HERE', -- Replace with actual restaurant ID
    'YOUR_ORDER_ID_HERE',      -- Replace with actual order ID
    5,
    'Harika bir deneyimdi! Çok lezzetliydi.',
    true
);

-- Verify the review was created
SELECT * FROM reviews ORDER BY created_at DESC LIMIT 1;
