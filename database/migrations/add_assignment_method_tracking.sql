-- Add started_at field to assignments table for accurate hours calculation
-- This migration adds the missing started_at timestamp field (safe to run multiple times)

-- Add started_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'assignments'
                   AND column_name = 'started_at') THEN
        ALTER TABLE assignments ADD COLUMN started_at TIMESTAMPTZ;
        RAISE NOTICE 'Added started_at column to assignments table';
    ELSE
        RAISE NOTICE 'started_at column already exists, skipping';
    END IF;
END $$;

-- Add cancelled_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'assignments'
                   AND column_name = 'cancelled_at') THEN
        ALTER TABLE assignments ADD COLUMN cancelled_at TIMESTAMPTZ;
        RAISE NOTICE 'Added cancelled_at column to assignments table';
    ELSE
        RAISE NOTICE 'cancelled_at column already exists, skipping';
    END IF;
END $$;

-- Add assignment_method column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'assignments'
                   AND column_name = 'assignment_method') THEN
        ALTER TABLE assignments ADD COLUMN assignment_method TEXT DEFAULT 'auto';
        RAISE NOTICE 'Added assignment_method column to assignments table';
    ELSE
        RAISE NOTICE 'assignment_method column already exists, skipping';
    END IF;
END $$;

-- Add rating column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'assignments'
                   AND column_name = 'rating') THEN
        ALTER TABLE assignments ADD COLUMN rating INTEGER;
        RAISE NOTICE 'Added rating column to assignments table';
    ELSE
        RAISE NOTICE 'rating column already exists, skipping';
    END IF;
END $$;

-- Add feedback column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'assignments'
                   AND column_name = 'feedback') THEN
        ALTER TABLE assignments ADD COLUMN feedback TEXT;
        RAISE NOTICE 'Added feedback column to assignments table';
    ELSE
        RAISE NOTICE 'feedback column already exists, skipping';
    END IF;
END $$;

-- Set default value for assignment_method if it exists and doesn't have a default
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public'
               AND table_name = 'assignments'
               AND column_name = 'assignment_method')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'assignments'
                    AND column_name = 'assignment_method'
                    AND column_default IS NOT NULL) THEN
        ALTER TABLE assignments ALTER COLUMN assignment_method SET DEFAULT 'auto';
        RAISE NOTICE 'Set default value for assignment_method column';
    END IF;
END $$;

-- Update existing records to have started_at = accepted_at where accepted_at exists
UPDATE assignments
SET started_at = accepted_at
WHERE started_at IS NULL AND accepted_at IS NOT NULL AND status IN ('in_progress', 'completed');

-- For assignments that don't have accepted_at, use assigned_at as started_at
UPDATE assignments
SET started_at = assigned_at
WHERE started_at IS NULL AND status IN ('in_progress', 'completed');

-- Add comments for documentation (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'started_at') THEN
        COMMENT ON COLUMN assignments.started_at IS 'Timestamp when volunteer actually started working on the assignment';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'cancelled_at') THEN
        COMMENT ON COLUMN assignments.cancelled_at IS 'Timestamp when assignment was cancelled';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'assignment_method') THEN
        COMMENT ON COLUMN assignments.assignment_method IS 'How the assignment was made (auto/manual)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'rating') THEN
        COMMENT ON COLUMN assignments.rating IS 'Volunteer rating for completed assignment (1-5)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'feedback') THEN
        COMMENT ON COLUMN assignments.feedback IS 'Volunteer feedback for completed assignment';
    END IF;
END $$;