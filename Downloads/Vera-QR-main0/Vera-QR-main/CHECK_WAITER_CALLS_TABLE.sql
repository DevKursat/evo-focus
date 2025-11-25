-- Check waiter_calls table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'waiter_calls'
ORDER BY ordinal_position;
