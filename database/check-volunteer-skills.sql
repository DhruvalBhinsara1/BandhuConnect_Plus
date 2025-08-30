-- Check what skills volunteers actually have vs what's required
SELECT 
  -- Check current volunteer skills to identify issues
SELECT 
    name, 
    email, 
    skills, 
    volunteer_status,
    is_active
FROM profiles 
WHERE role = 'volunteer' 
    AND is_active = true 
    AND volunteer_status IN ('available', 'busy')
ORDER BY volunteer_status, name;

-- Show required skills for each request type
SELECT 
    'Required Skills by Request Type' as analysis_type,
    'guidance' as request_type,
    ARRAY['local_knowledge', 'tour_guide', 'navigation', 'language'] as required_skills
UNION ALL
SELECT 
    'Required Skills by Request Type',
    'lost_person',
    ARRAY['search_rescue', 'crowd_management', 'communication', 'local_knowledge']
UNION ALL
SELECT 
    'Required Skills by Request Type',
    'medical',
    ARRAY['medical', 'first_aid', 'healthcare', 'emergency']
UNION ALL
SELECT 
    'Required Skills by Request Type',
    'sanitation',
    ARRAY['cleaning', 'sanitation', 'maintenance', 'hygiene']
UNION ALL
SELECT 
    'Required Skills by Request Type',
    'general',
    ARRAY['general', 'assistance', 'support'];

-- Check skill overlap
SELECT 
    'Skill Gap Analysis' as analysis_type,
    'guidance_requests' as issue,
    'Need volunteers with: local_knowledge, tour_guide, navigation, language' as solution
UNION ALL
SELECT 
    'Skill Gap Analysis',
    'lost_person_requests',
    'Need volunteers with: search_rescue, crowd_management, communication, local_knowledge';
