-- Check current waiter_calls table structure after the fix
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'waiter_calls'
ORDER BY ordinal_position;
