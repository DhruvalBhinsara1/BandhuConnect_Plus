-- FORCE REMOVE TECH AND TRANSPORTATION ENUM VALUES
-- This script completely eliminates tech and transportation from the database

-- Step 1: Update ALL data using tech or transportation
UPDATE assistance_requests 
SET type = CASE 
    WHEN type::text = 'tech' THEN 'general'::request_type
    WHEN type::text = 'transportation' THEN 'general'::request_type
    ELSE type
END,
updated_at = NOW()
WHERE type::text IN ('tech', 'transportation');

-- Step 2: Remove tech and transportation from ALL volunteer skills
UPDATE profiles 
SET skills = (
    SELECT ARRAY(
        SELECT skill 
        FROM unnest(skills) AS skill
        WHERE skill NOT IN ('tech', 'transportation')
        UNION
        SELECT CASE 
            WHEN 'tech' = ANY(skills) THEN 'technical_support'
            WHEN 'transportation' = ANY(skills) THEN 'logistics'
        END
        WHERE CASE 
            WHEN 'tech' = ANY(skills) THEN 'technical_support'
            WHEN 'transportation' = ANY(skills) THEN 'logistics'
        END IS NOT NULL
    )
),
updated_at = NOW()
WHERE role = 'volunteer' 
AND ('tech' = ANY(skills) OR 'transportation' = ANY(skills));

-- Step 3: Drop and recreate enum WITHOUT tech and transportation
-- Create new enum with ONLY the values we want (NO tech, NO transportation)
CREATE TYPE request_type_final AS ENUM (
    'crowd_management',
    'emergency',
    'general',
    'guidance', 
    'lost_person',
    'medical',
    'sanitation'
);

-- Step 4: Convert table to use new enum
ALTER TABLE assistance_requests 
ALTER COLUMN type TYPE request_type_final 
USING type::text::request_type_final;

-- Step 5: Drop old enum and rename new one
DROP TYPE request_type CASCADE;
ALTER TYPE request_type_final RENAME TO request_type;

-- Step 6: Verification - these should return 0
SELECT 'Verification - should be 0:' as message;
SELECT COUNT(*) as tech_count FROM assistance_requests WHERE type::text = 'tech';
SELECT COUNT(*) as transportation_count FROM assistance_requests WHERE type::text = 'transportation';
SELECT COUNT(*) as volunteers_with_tech FROM profiles WHERE 'tech' = ANY(skills);
SELECT COUNT(*) as volunteers_with_transportation FROM profiles WHERE 'transportation' = ANY(skills);

-- Step 7: Show final enum values (should NOT include tech or transportation)
SELECT 'Final enum values:' as message;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'request_type'::regtype ORDER BY enumlabel;
