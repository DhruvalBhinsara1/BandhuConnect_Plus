-- =============================================================================
-- BandhuConnect+ Supabase Production Schema
-- Version: 2.1.0 - Updated September 6, 2025
-- Description: Complete production schema for volunteer assistance platform
-- =============================================================================

-- This schema matches the current production database structure
-- RLS (Row Level Security) policies are included for secure access control

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- CUSTOM ENUM TYPES
-- =============================================================================

-- Create custom ENUM types for roles, request types, and statuses
CREATE TYPE public.user_role AS ENUM ('pilgrim', 'volunteer', 'admin');
CREATE TYPE public.volunteer_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE public.request_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.assignment_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.request_type AS ENUM ('medical', 'navigation', 'emergency', 'general', 'guidance', 'lost_person', 'sanitation', 'crowd_management');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Create the profiles table to store user data
-- This table is linked to Supabase's built-in auth.users table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role public.user_role NOT NULL DEFAULT 'pilgrim',
    avatar_url TEXT,
    skills TEXT[], -- Array of volunteer skills
    location GEOGRAPHY(POINT, 4326), -- PostGIS location data
    address TEXT,
    volunteer_status public.volunteer_status DEFAULT 'offline',
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the `user_locations` table for real-time location tracking
CREATE TABLE public.user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    altitude DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Create the `assistance_requests` table to store all assistance requests
CREATE TABLE public.assistance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type public.request_type NOT NULL DEFAULT 'general',
    priority public.priority_level NOT NULL DEFAULT 'medium',
    status public.request_status NOT NULL DEFAULT 'pending',
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create the `assignments` table to link volunteers to requests
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.assistance_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.assignment_status NOT NULL DEFAULT 'pending',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(request_id)
);
-- 6. Indexes for performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_volunteer_status ON public.profiles(volunteer_status);
CREATE INDEX idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX idx_user_locations_active ON public.user_locations(is_active);
CREATE INDEX idx_assistance_requests_status ON public.assistance_requests(status);
CREATE INDEX idx_assistance_requests_user_id ON public.assistance_requests(user_id);
CREATE INDEX idx_assignments_volunteer_id ON public.assignments(volunteer_id);
CREATE INDEX idx_assignments_request_id ON public.assignments(request_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);

-- 7. Enable Row Level Security (RLS) for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User locations policies
CREATE POLICY "Users can view relevant locations" ON public.user_locations FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.assignments a 
        JOIN public.assistance_requests ar ON a.request_id = ar.id 
        WHERE (a.volunteer_id = auth.uid() AND ar.user_id = user_locations.user_id)
           OR (ar.user_id = auth.uid() AND a.volunteer_id = user_locations.user_id)
    )
);

CREATE POLICY "Users can update own location" ON public.user_locations FOR ALL USING (user_id = auth.uid());

-- Assistance requests policies  
CREATE POLICY "Users can view relevant requests" ON public.assistance_requests FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.assignments WHERE request_id = assistance_requests.id AND volunteer_id = auth.uid())
);

CREATE POLICY "Pilgrims can manage own requests" ON public.assistance_requests FOR ALL USING (user_id = auth.uid());

-- Assignments policies
CREATE POLICY "Users can view relevant assignments" ON public.assignments FOR SELECT USING (
    volunteer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.assistance_requests WHERE id = assignments.request_id AND user_id = auth.uid())
);

CREATE POLICY "Volunteers can update assignments" ON public.assignments FOR UPDATE USING (volunteer_id = auth.uid());

-- 9. Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assistance_requests_updated_at BEFORE UPDATE ON public.assistance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
