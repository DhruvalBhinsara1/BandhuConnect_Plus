-- URGENT FIX: Drop problematic RLS policies causing infinite recursion
-- Run this FIRST to fix login issues

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can update volunteer profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read volunteer profiles" ON profiles;

-- TEMPORARY: Disable RLS on profiles table to restore login functionality
-- (This should be re-enabled with proper policies later)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Alternative: Create a simple RLS policy that doesn't cause recursion
-- This allows authenticated users to update profiles (less secure but functional)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated updates" ON profiles
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
