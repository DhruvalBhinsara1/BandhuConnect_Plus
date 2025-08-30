-- Verification Script - Check for tech and transportation in ALL data
-- Run this to verify complete removal of tech and transportation

-- 1. Check assistance_requests table for tech/transportation
SELECT 'ASSISTANCE REQUESTS CHECK:' as check_section;
SELECT 
    type::text as request_type, 
    COUNT(*)::text as count,
    'Should be 0 for tech/transportation' as note
FROM assistance_requests 
WHERE type::text IN ('tech', 'transportation')
GROUP BY type::text
UNION ALL
SELECT 'TOTAL tech/transportation requests:', COUNT(*)::text, 'Should be 0'
FROM assistance_requests 
WHERE type::text IN ('tech', 'transportation');

-- 2. Check volunteer skills for tech/transportation
SELECT 'VOLUNTEER SKILLS CHECK:' as check_section;
SELECT 
    name,
    email,
    skills,
    'Has tech skill' as issue
FROM profiles 
WHERE role = 'volunteer' 
AND 'tech' = ANY(skills)
UNION ALL
SELECT 
    name,
    email,
    skills,
    'Has transportation skill' as issue
FROM profiles 
WHERE role = 'volunteer' 
AND 'transportation' = ANY(skills);

-- 3. Count volunteers with tech/transportation skills
SELECT 'VOLUNTEER SKILLS COUNT:' as check_section;
SELECT 
    'Volunteers with tech skill' as skill_type,
    COUNT(*)::text as count,
    'Should be 0' as note
FROM profiles 
WHERE role = 'volunteer' AND 'tech' = ANY(skills)
UNION ALL
SELECT 
    'Volunteers with transportation skill' as skill_type,
    COUNT(*)::text as count,
    'Should be 0' as note
FROM profiles 
WHERE role = 'volunteer' AND 'transportation' = ANY(skills);

-- 4. Show current enum values
SELECT 'CURRENT ENUM VALUES:' as check_section;
SELECT 
    enumlabel as enum_value,
    CASE 
        WHEN enumlabel IN ('tech', 'transportation') THEN '❌ SHOULD BE REMOVED'
        ELSE '✅ OK'
    END as status
FROM pg_enum 
WHERE enumtypid = 'request_type'::regtype 
ORDER BY enumlabel;

-- 5. Show all request types currently in use
SELECT 'REQUEST TYPES IN USE:' as check_section;
SELECT 
    type::text as request_type,
    COUNT(*)::text as count,
    CASE 
        WHEN type::text IN ('tech', 'transportation') THEN '❌ PROBLEM - Should not exist'
        ELSE '✅ OK'
    END as status
FROM assistance_requests 
GROUP BY type::text 
ORDER BY type::text;

-- 6. Show all unique skills in volunteer profiles
SELECT 'ALL VOLUNTEER SKILLS:' as check_section;
SELECT 
    DISTINCT skill,
    COUNT(*)::text as volunteers_with_skill,
    CASE 
        WHEN skill IN ('tech', 'transportation') THEN '❌ PROBLEM - Should not exist'
        ELSE '✅ OK'
    END as status
FROM profiles p, unnest(p.skills) as skill
WHERE p.role = 'volunteer'
GROUP BY skill
ORDER BY skill;

-- 7. Summary check
SELECT 'SUMMARY:' as check_section;
SELECT 
    'Total requests with tech/transportation' as metric,
    COUNT(*)::text as value,
    CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '❌ NEEDS CLEANUP' END as status
FROM assistance_requests 
WHERE type::text IN ('tech', 'transportation')
UNION ALL
SELECT 
    'Total volunteers with tech/transportation skills' as metric,
    COUNT(*)::text as value,
    CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '❌ NEEDS CLEANUP' END as status
FROM profiles 
WHERE role = 'volunteer' 
AND ('tech' = ANY(skills) OR 'transportation' = ANY(skills))
UNION ALL
SELECT 
    'Tech/transportation in enum' as metric,
    COUNT(*)::text as value,
    CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '❌ NEEDS CLEANUP' END as status
FROM pg_enum 
WHERE enumtypid = 'request_type'::regtype 
AND enumlabel IN ('tech', 'transportation');
