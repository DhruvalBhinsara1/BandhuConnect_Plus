-- =============================================================================
-- BandhuConnect+ Secure Admin User Creation
-- Version: 2.1.0 - Updated September 6, 2025
-- Description: Environment-safe admin user creation script
-- =============================================================================

-- SECURITY NOTE: This script contains NO sensitive information
-- All placeholder values must be replaced before execution

-- =============================================================================
-- PREREQUISITES
-- =============================================================================

-- Before running this script:
-- 1. Create user account in Supabase Auth Dashboard
-- 2. Note the generated UUID from auth.users table
-- 3. Replace placeholder values below with actual data
-- 4. Execute this script to create admin profile

-- =============================================================================
-- ADMIN PROFILE CREATION
-- =============================================================================

-- Create admin profile (replace ALL placeholder values)
INSERT INTO public.profiles (
    id,
    name,
    email,
    phone,
    role,
    skills,
    is_active,
    volunteer_status,
    created_at,
    updated_at
) VALUES (
    -- REPLACE with actual UUID from auth.users
    'PLACEHOLDER_AUTH_UUID_REPLACE_BEFORE_USE',
    
    -- REPLACE with actual admin name
    'PLACEHOLDER_ADMIN_NAME',
    
    -- REPLACE with actual admin email
    'admin@placeholder-domain.com',
    
    -- REPLACE with actual phone (optional)
    NULL,
    
    'admin'::public.user_role,
    ARRAY['administration', 'management', 'coordination', 'system_admin'],
    true,
    'offline'::public.volunteer_status,
    NOW(),
    NOW()
)
-- Handle conflicts gracefully
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    skills = EXCLUDED.skills,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =============================================================================
-- VERIFICATION QUERIES (Update before use)
-- =============================================================================

-- Step 1: Find the auth user UUID (replace email before running)
-- SELECT id, email, created_at 
-- FROM auth.users 
-- WHERE email = 'REPLACE_WITH_ACTUAL_ADMIN_EMAIL';

-- Step 2: Verify profile creation (replace email before running)  
-- SELECT id, name, email, role, is_active, created_at
-- FROM public.profiles
-- WHERE email = 'REPLACE_WITH_ACTUAL_ADMIN_EMAIL';

-- =============================================================================
-- ALTERNATIVE: QUERY-BASED INSERTION
-- =============================================================================

-- If you prefer to insert by email lookup (replace email before use):
/*
INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    skills,
    is_active,
    volunteer_status,
    created_at,
    updated_at
)
SELECT 
    au.id,
    'REPLACE_WITH_ACTUAL_ADMIN_NAME',
    au.email,
    'admin'::public.user_role,
    ARRAY['administration', 'management', 'coordination'],
    true,
    'offline'::public.volunteer_status,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'REPLACE_WITH_ACTUAL_ADMIN_EMAIL'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);
*/

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================

-- TO USE THIS SCRIPT SAFELY:
-- 
-- 1. CREATE AUTH USER:
--    - Go to Supabase Dashboard > Authentication > Users
--    - Create new user with email and password
--    - Note the generated UUID
--
-- 2. UPDATE THIS SCRIPT:
--    - Replace 'PLACEHOLDER_AUTH_UUID_REPLACE_BEFORE_USE' with actual UUID
--    - Replace 'PLACEHOLDER_ADMIN_NAME' with actual name
--    - Replace 'admin@placeholder-domain.com' with actual email
--    - Add phone number if desired
--
-- 3. EXECUTE SCRIPT:
--    - Run the INSERT statement in your database
--    - Verify using the verification queries
--
-- 4. SECURITY:
--    - Never commit actual sensitive data to version control
--    - Use environment variables or secure config in production
--    - This template is safe to share as it contains no real data

-- =============================================================================
-- END OF SCRIPT
-- =============================================================================
