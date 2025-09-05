-- Reactivate Assignment for Active Tracking
-- Since the assignment between Dhruval and Dr. Raj is completed, we need to reactivate it for testing

-- Update the assignment status from completed to accepted for active tracking
UPDATE assignments 
SET 
    status = 'accepted',
    assigned = true,
    updated_at = NOW()
WHERE (volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' AND pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44')
   OR (volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' AND pilgrim_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790');

-- Verify the assignment is now active
SELECT 'Reactivated Assignment:' as section;
SELECT 
    a.id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.updated_at,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE (a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' AND a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44')
   OR (a.volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' AND a.pilgrim_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790');
