-- Check what enum values are allowed for the type column
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%request%' OR t.typname LIKE '%type%'
ORDER BY t.typname, e.enumsortorder;
