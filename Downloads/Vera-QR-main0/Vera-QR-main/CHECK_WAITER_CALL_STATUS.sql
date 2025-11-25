-- Check the status of the most recent waiter calls
SELECT id, table_id, status, created_at, acknowledged_at, resolved_at
FROM waiter_calls
ORDER BY created_at DESC
LIMIT 5;
