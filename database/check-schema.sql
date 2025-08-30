-- Check the actual schema of assistance_requests table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assistance_requests' 
ORDER BY ordinal_position;
