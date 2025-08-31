-- Quick fix for admin volunteer management
-- This allows the current admin user to manage volunteers immediately

-- First, let's create a simple policy that allows the current admin to manage profiles
-- Replace 'YOUR_ADMIN_USER_ID' with your actual admin user ID from auth.users

-- Drop existing policies if they exist (optional, for clean setup)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create policies that work with the current admin setup
-- Allow authenticated users with admin role to manage profiles
CREATE POLICY "Enable admin access to profiles" ON public.profiles
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email = 'dhruvalbhinsara460@gmail.com'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Alternative: Temporarily disable RLS for testing (NOT recommended for production)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
