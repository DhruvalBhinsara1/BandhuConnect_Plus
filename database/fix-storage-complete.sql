-- Complete Storage Setup for BandhuConnect+ Image Uploads
-- This script creates the storage bucket and proper RLS policies

-- First, ensure the storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-photos',
  'request-photos', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop all existing storage policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read for all objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to request-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from request-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to request-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from request-photos" ON storage.objects;

-- Create comprehensive RLS policies for storage
-- Allow authenticated users to upload to request-photos bucket
CREATE POLICY "Allow authenticated uploads to request-photos" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'request-photos');

-- Allow public read access to request photos (for displaying images)
CREATE POLICY "Allow public read from request-photos" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'request-photos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to request-photos" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'request-photos')
WITH CHECK (bucket_id = 'request-photos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes from request-photos" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'request-photos');

-- Verify the setup
SELECT 
  'Bucket created:' as status,
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'request-photos';

SELECT 
  'Policies created:' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
