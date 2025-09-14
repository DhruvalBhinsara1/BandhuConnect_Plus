-- SAFE DATABASE FIX: Run these commands in Supabase SQL Editor
-- These commands are safe to run even if some columns already exist

-- 1. Try to add started_at column (will skip if it exists)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- 2. Try to add cancelled_at column (will skip if it exists)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 3. Try to add assignment_method column (will skip if it exists)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_method TEXT;

-- 4. Try to add rating column (will skip if it exists)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rating INTEGER;

-- 5. Try to add feedback column (will skip if it exists)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS feedback TEXT;

-- 6. Set default value for assignment_method (safe even if already set)
ALTER TABLE assignments ALTER COLUMN assignment_method SET DEFAULT 'auto';

-- 7. Update existing records to populate started_at from accepted_at
UPDATE assignments
SET started_at = accepted_at
WHERE started_at IS NULL AND accepted_at IS NOT NULL AND status IN ('in_progress', 'completed');

-- 8. Update remaining records to populate started_at from assigned_at
UPDATE assignments
SET started_at = assigned_at
WHERE started_at IS NULL AND status IN ('in_progress', 'completed');

-- 9. Add documentation comments
COMMENT ON COLUMN assignments.started_at IS 'Timestamp when volunteer actually started working on the assignment';
COMMENT ON COLUMN assignments.cancelled_at IS 'Timestamp when assignment was cancelled';
COMMENT ON COLUMN assignments.assignment_method IS 'How the assignment was made (auto/manual)';
COMMENT ON COLUMN assignments.rating IS 'Volunteer rating for completed assignment (1-5)';
COMMENT ON COLUMN assignments.feedback IS 'Volunteer feedback for completed assignment';

-- 7. Update existing records
UPDATE assignments
SET started_at = accepted_at
WHERE started_at IS NULL AND accepted_at IS NOT NULL AND status IN ('in_progress', 'completed');

-- 8. Update remaining records
UPDATE assignments
SET started_at = assigned_at
WHERE started_at IS NULL AND status IN ('in_progress', 'completed');