-- Fix RLS policies for volunteer status updates
-- This script addresses the issue where updates return empty arrays due to RLS blocking

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Temporarily disable RLS for testing (CAUTION: Only for development)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- OR create proper admin policy for updates
CREATE POLICY IF NOT EXISTS "Admin can update all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Also ensure admin can read all profiles
CREATE POLICY IF NOT EXISTS "Admin can read all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Check if policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname LIKE '%Admin%';
