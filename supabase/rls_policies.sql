-- Row Level Security (RLS) Policies for BandhuConnect+
-- These policies control who can access and modify data in the database

-- 1. Profiles table policies
-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- Allow admins to insert new profiles (volunteers, pilgrims)
CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 2. Requests table policies
-- Allow admins to view all requests
CREATE POLICY "Admins can view all requests" ON public.requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- Allow admins to insert, update, delete requests
CREATE POLICY "Admins can manage requests" ON public.requests
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- Allow pilgrims to create requests
CREATE POLICY "Pilgrims can create requests" ON public.requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles pilgrim_profile 
    WHERE pilgrim_profile.id = auth.uid() 
    AND pilgrim_profile.role = 'pilgrim'
  )
);

-- Allow users to view their own requests
CREATE POLICY "Users can view own requests" ON public.requests
FOR SELECT USING (auth.uid() = user_id);

-- Allow volunteers to view requests
CREATE POLICY "Volunteers can view requests" ON public.requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles volunteer_profile 
    WHERE volunteer_profile.id = auth.uid() 
    AND volunteer_profile.role = 'volunteer'
  )
);

-- 3. Assignments table policies
-- Allow admins to manage all assignments
CREATE POLICY "Admins can manage assignments" ON public.assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- Allow volunteers to view their assignments
CREATE POLICY "Volunteers can view own assignments" ON public.assignments
FOR SELECT USING (auth.uid() = volunteer_id);

-- Allow volunteers to update their assignment status
CREATE POLICY "Volunteers can update own assignments" ON public.assignments
FOR UPDATE USING (auth.uid() = volunteer_id);
