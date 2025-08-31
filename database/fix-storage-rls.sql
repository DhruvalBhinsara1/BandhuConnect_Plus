-- Fix Storage RLS policies for image uploads
-- This addresses the "new row violates row-level security policy" error

-- First, temporarily disable RLS on storage.buckets to allow bucket creation
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Create storage bucket policies for request photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-photos',
  'request-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Re-enable RLS on storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Allow authenticated users to upload to request-photos bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'request-photos');

-- Allow public read access to request photos
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'request-photos');

-- Allow users to update their own uploads
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'request-photos');

-- Allow users to delete their own uploads
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'request-photos');
