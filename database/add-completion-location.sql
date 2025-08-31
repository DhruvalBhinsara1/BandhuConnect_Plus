-- Add completion location fields to assignments table
-- This will store the volunteer's GPS location when they complete a task

ALTER TABLE assignments 
ADD COLUMN completion_latitude DECIMAL(10, 8),
ADD COLUMN completion_longitude DECIMAL(11, 8),
ADD COLUMN completion_address TEXT;
