-- Check which tables exist for restaurant/organization relationships
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%organization%' OR table_name LIKE '%staff%' OR table_name LIKE '%member%')
ORDER BY table_name;
