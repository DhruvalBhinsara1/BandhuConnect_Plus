-- Simple Assignment Fix - Direct approach to create the missing assignment
-- This bypasses complex foreign key issues by creating records step by step

-- Step 1: Ensure Dhruval exists in users table (required for pilgrim_id foreign key)
INSERT INTO users (id, name, role, created_at, updated_at)
VALUES (
    '5595c83a-55ef-426e-a10e-28ff9b70ce44',
    'Dhruval Bhinsara', 
    'pilgrim',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create a simple assistance request
INSERT INTO assistance_requests (
    id,
    user_id,
    type,
    title,
    description,
    location,
    status
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', -- Fixed UUID for this request
    '5595c83a-55ef-426e-a10e-28ff9b70ce44',
    'general',
    'Location Tracking',
    'Location tracking assistance',
    ST_GeogFromText('POINT(72.5714 23.0225)'),
    'pending'
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Create the assignment directly
INSERT INTO assignments (
    id,
    request_id,
    volunteer_id,
    pilgrim_id,
    status,
    assigned,
    created_at,
    assigned_at
) VALUES (
    'a47ac10b-58cc-4372-a567-0e02b2c3d480', -- Fixed UUID for this assignment
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', -- Links to the request above
    'a81c0e62-4bec-4552-bca3-b158c6afa790', -- Dr. Raj (volunteer)
    '5595c83a-55ef-426e-a10e-28ff9b70ce44', -- Dhruval (pilgrim)
    'accepted',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Verify the assignment was created
SELECT 'Assignment Created Successfully:' as section;
SELECT 
    a.id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.id = 'a47ac10b-58cc-4372-a567-0e02b2c3d480';

-- Step 5: Test pilgrim get_my_assignment logic
SELECT 'Pilgrim get_my_assignment Test:' as section;
SELECT 
    a.id as assignment_id,
    pv.id as counterpart_id,
    pv.name as counterpart_name,
    pv.role as counterpart_role,
    true as is_active,
    a.assigned
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true;

-- Step 6: Test volunteer get_my_assignment logic  
SELECT 'Volunteer get_my_assignment Test:' as section;
SELECT 
    a.id as assignment_id,
    pu.id as counterpart_id,
    pu.name as counterpart_name,
    'pilgrim' as counterpart_role,
    true as is_active,
    a.assigned
FROM assignments a
JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true;
