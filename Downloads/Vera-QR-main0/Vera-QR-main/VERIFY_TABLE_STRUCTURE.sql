-- Quick verification for waiter_calls table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'waiter_calls'
  AND table_schema = 'public'
ORDER BY ordinal_position;
