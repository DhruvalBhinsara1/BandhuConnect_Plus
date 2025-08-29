-- BandhuConnect+ Supabase Schema
-- This schema is designed for Supabase and follows best practices.
-- It separates user authentication (handled by auth.users) from user profiles (public.profiles).
-- RLS (Row Level Security) policies will need to be added to these tables to control access.

-- 1. Create custom ENUM types for roles, request types, and statuses.
CREATE TYPE public.user_role AS ENUM ('volunteer', 'admin', 'pilgrim');
CREATE TYPE public.request_type AS ENUM ('medical', 'safety', 'lost_child', 'directions', 'sanitation', 'general');
CREATE TYPE public.request_status AS ENUM ('pending', 'in_progress', 'resolved', 'cancelled');

-- 2. Create the `profiles` table to store public user data.
-- This table is linked to Supabase's built-in `auth.users` table.
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    phone text UNIQUE,
    role public.user_role NOT NULL,
    skills text[],
    age int,
    lat float8,
    lng float8,
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create the `requests` table to store all assistance requests.
CREATE TABLE public.requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- The pilgrim who created the request
    type public.request_type NOT NULL,
    status public.request_status NOT NULL DEFAULT 'pending',
    description text,
    photo_url text,
    location text,
    lat float8,
    lng float8,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone
);

-- 4. Create the `assignments` table to link volunteers to requests.
-- This creates a many-to-many relationship between volunteers and requests.
CREATE TABLE public.assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    volunteer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at timestamp with time zone DEFAULT now(),
    status public.request_status NOT NULL DEFAULT 'in_progress'
);

-- 5. Enable Row Level Security (RLS) for all tables.
-- Policies will need to be defined to control data access.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
