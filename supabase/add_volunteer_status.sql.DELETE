-- Add volunteer status fields to profiles table
-- This will track active/inactive status and on/off duty status

-- Create ENUM types for volunteer status
CREATE TYPE public.volunteer_status AS ENUM ('active', 'inactive');
CREATE TYPE public.duty_status AS ENUM ('on_duty', 'off_duty');

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN volunteer_status public.volunteer_status DEFAULT 'active',
ADD COLUMN duty_status public.duty_status DEFAULT 'off_duty';

-- Update existing volunteers to have default status
UPDATE public.profiles 
SET volunteer_status = 'active', duty_status = 'off_duty' 
WHERE role = 'volunteer';

-- Add some sample status variations to demo volunteers
UPDATE public.profiles 
SET volunteer_status = 'active', duty_status = 'on_duty' 
WHERE name IN ('Dhruval', 'Amogh') AND role = 'volunteer';

UPDATE public.profiles 
SET volunteer_status = 'inactive', duty_status = 'off_duty' 
WHERE name IN ('Om') AND role = 'volunteer';
