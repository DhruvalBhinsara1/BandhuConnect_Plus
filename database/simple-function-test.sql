-- Simple Function Test - No UUID Parameters
-- Test the functions without complex UUID casting

-- 1. Check what user is currently authenticated
SELECT auth.uid() as current_user, auth.role() as auth_role;

-- 2. Test the debug function (no parameters - uses current auth user)
SELECT * FROM get_my_assignment_debug();

-- 3. Test original function
SELECT * FROM get_my_assignment();

-- 4. Check if there are any assignments at all
SELECT COUNT(*) as total_assignments FROM assignments;
SELECT COUNT(*) as active_assignments FROM assignments WHERE status IN ('pending', 'accepted', 'in_progress');

-- 5. Check profiles table
SELECT id, name, role FROM profiles LIMIT 5;
