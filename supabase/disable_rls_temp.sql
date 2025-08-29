-- Temporary fix: Disable RLS to get volunteer management working
-- Run this in Supabase SQL Editor to immediately fix the access issues

-- Disable RLS on profiles table temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on requests table temporarily  
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;

-- Disable RLS on assignments table temporarily
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;

-- Note: This is for development/testing only
-- In production, you should use proper RLS policies instead
