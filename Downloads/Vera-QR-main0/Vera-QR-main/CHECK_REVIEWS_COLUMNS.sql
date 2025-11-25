-- Check what columns currently exist in the reviews table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public'
ORDER BY ordinal_position;
