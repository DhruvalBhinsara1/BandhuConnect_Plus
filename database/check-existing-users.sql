-- Check existing users and profiles structure
-- Run this to see what users already exist in your database

-- Check auth.users table structure and data
SELECT 'Auth Users:' as info;
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if profiles table exists and its structure
SELECT 'Profiles Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check existing profiles data
SELECT 'Existing Profiles:' as info;
SELECT id, name, role, phone, is_active, created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if users table exists (our new secure table)
SELECT 'Users Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check existing users data (our new secure table)
SELECT 'Existing Users (secure table):' as info;
SELECT id, name, role, phone, is_active, created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check existing assignments
SELECT 'Existing Assignments:' as info;
SELECT id, pilgrim_id, volunteer_id, is_active, assigned_at
FROM assignments 
ORDER BY assigned_at DESC 
LIMIT 10;

-- Check existing locations
SELECT 'Existing Locations:' as info;
SELECT user_id, latitude, longitude, last_updated
FROM locations 
ORDER BY last_updated DESC 
LIMIT 10;
