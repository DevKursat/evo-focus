-- Check if order_items table exists and has required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items' AND table_schema = 'public'
ORDER BY ordinal_position;
