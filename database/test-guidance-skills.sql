-- Test if guidance requests now have matching volunteers
SELECT 
    'Skill Match Test' as test_type,
    'guidance' as request_type,
    COUNT(*) as volunteers_with_matching_skills
FROM profiles p
WHERE p.role = 'volunteer' 
    AND p.is_active = true 
    AND p.volunteer_status IN ('available', 'busy')
    AND p.skills && ARRAY['local_knowledge', 'tour_guide', 'navigation', 'language'];
