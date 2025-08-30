-- Debug auto-assignment by checking what the function actually sees
-- Let's manually test the auto-assignment function with a single request

-- First, check current volunteer skills after our fix
SELECT 'Current Volunteer Skills' as debug_type, name, email, skills, volunteer_status, is_active
FROM profiles 
WHERE role = 'volunteer' AND is_active = true
ORDER BY name;

-- Check current pending requests
SELECT 'Pending Requests' as debug_type, id, type, title, description, priority, status
FROM assistance_requests 
WHERE status = 'pending'
LIMIT 5;

-- Test the auto-assignment function directly with one request
SELECT 'Testing Auto-Assignment Function' as debug_type;

-- Get the first pending request ID
DO $$
DECLARE
    test_request_id UUID;
    result RECORD;
BEGIN
    -- Get first pending request
    SELECT id INTO test_request_id 
    FROM assistance_requests 
    WHERE status = 'pending' 
    LIMIT 1;
    
    IF test_request_id IS NOT NULL THEN
        RAISE NOTICE 'Testing auto-assignment for request: %', test_request_id;
        
        -- Try the auto-assignment function
        SELECT * INTO result 
        FROM auto_assign_request_enhanced(test_request_id, 0.1); -- Lower threshold
        
        RAISE NOTICE 'Auto-assignment result: %', result;
    ELSE
        RAISE NOTICE 'No pending requests found';
    END IF;
END $$;
