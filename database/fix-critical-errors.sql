-- Fix Critical Errors: Role mismatch, policy recursion, and coordinates

-- 1. Fix infinite recursion in assignments policy
-- Drop the problematic RLS policy and recreate it properly
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;

-- Create a simpler, non-recursive policy for assignments
CREATE POLICY "Users can view their assignments" ON assignments
FOR SELECT USING (
  pilgrim_id = auth.uid() OR volunteer_id = auth.uid()
);

-- 2. Clear and fix location coordinates (replace old coordinates with Parul University Vadodara area)
DELETE FROM locations WHERE user_id IN (
  '5595c83a-55ef-426e-a10e-28ff9b70ce44', -- Dhruval Bhinsara
  'a81c0e62-4bec-4552-bca3-b158c6afa790', -- Dr. Raj Patel  
  '5f121537-9b20-4029-8bdc-c054678f9a2f'  -- Sunita Guide
);

-- Insert fresh Parul University Vadodara area coordinates
INSERT INTO locations (user_id, latitude, longitude, accuracy, speed, bearing, last_updated)
VALUES 
  -- Dhruval Bhinsara (pilgrim) - Near Parul University Main Gate
  ('5595c83a-55ef-426e-a10e-28ff9b70ce44', 22.3039, 73.1812, 8.5, 0.0, 0.0, NOW() - INTERVAL '30 seconds'),
  -- Dr. Raj Patel (volunteer) - Parul University Campus Area  
  ('a81c0e62-4bec-4552-bca3-b158c6afa790', 22.3055, 73.1825, 12.3, 0.0, 0.0, NOW() - INTERVAL '45 seconds'),
  -- Sunita Guide (volunteer) - Parul University Hospital Area
  ('5f121537-9b20-4029-8bdc-c054678f9a2f', 22.3025, 73.1805, 15.2, 0.0, 0.0, NOW() - INTERVAL '60 seconds');

-- 3. Verify the fixes
SELECT 'Assignment Policy Check' as check_type, count(*) as count FROM assignments WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

SELECT 'Location Coordinates Check' as check_type, u.name, u.role, l.latitude, l.longitude, l.last_updated
FROM locations l
JOIN users u ON l.user_id = u.id
WHERE u.id IN ('5595c83a-55ef-426e-a10e-28ff9b70ce44', 'a81c0e62-4bec-4552-bca3-b158c6afa790', '5f121537-9b20-4029-8bdc-c054678f9a2f')
ORDER BY u.role, u.name;
