-- Create a new test assignment to verify the complete workflow

-- 1. Create a new assistance request from Dhruval
INSERT INTO assistance_requests (
    id,
    user_id,
    title,
    description,
    type,
    priority,
    location,
    address,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    '5595c83a-55ef-426e-a10e-28ff9b70ce44',
    'Navigation Help',
    'Need help finding the main temple entrance',
    'general',
    'medium',
    ST_GeogFromText('POINT(73.3621000 22.2950000)'),
    'Near Main Temple, Vadodara',
    'pending',
    NOW()
);

-- 2. Get the new request ID for assignment creation
SELECT 
    'New request created:' as info,
    id,
    title,
    status,
    created_at
FROM assistance_requests 
WHERE user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND title = 'Navigation Help'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Create assignment linking Dr. Raj to this new request
-- (Replace the request_id with the actual ID from step 2)
-- This will be done manually after getting the request ID
