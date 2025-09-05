-- Fix Assignment Assigned Field for Existing Assignments
-- This ensures existing PENDING assignments have assigned=true

-- First, check current assignment status
SELECT 'Current Assignment Status' as section;
SELECT 
    a.id,
    a.status,
    a.assigned,
    a.volunteer_id,
    a.pilgrim_id,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.assigned_at DESC;

-- Update assignments to have assigned=true for active statuses
UPDATE assignments 
SET assigned = true, updated_at = NOW()
WHERE status IN ('pending', 'accepted', 'in_progress')
AND assigned IS NOT TRUE;

-- Verify the update
SELECT 'Updated Assignment Status' as section;
SELECT 
    a.id,
    a.status,
    a.assigned,
    a.volunteer_id,
    a.pilgrim_id,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.assigned_at DESC;
