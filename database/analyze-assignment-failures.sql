-- Analysis script to investigate why auto-assignment requests fail to find suitable volunteers
-- This helps debug the matching algorithm and identify bottlenecks

-- 1. Check current volunteer availability and distribution
SELECT 
    'Volunteer Status Distribution' as analysis_type,
    volunteer_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM profiles 
WHERE role = 'volunteer' AND is_active = true
GROUP BY volunteer_status
ORDER BY count DESC;

-- 2. Check skill distribution among volunteers
SELECT 
    'Volunteer Skills Analysis' as analysis_type,
    skill,
    COUNT(*) as volunteer_count
FROM (
    SELECT unnest(skills) as skill
    FROM profiles 
    WHERE role = 'volunteer' AND is_active = true AND skills IS NOT NULL
) skill_breakdown
GROUP BY skill
ORDER BY volunteer_count DESC;

-- 3. Check pending request types and their requirements
SELECT 
    'Pending Requests Analysis' as analysis_type,
    type as request_type,
    priority,
    COUNT(*) as request_count,
    AVG(CASE 
        WHEN location IS NOT NULL THEN 1 
        ELSE 0 
    END) as has_location_ratio
FROM assistance_requests 
WHERE status = 'pending'
GROUP BY type, priority
ORDER BY request_count DESC;

-- 4. Simulate the matching process for each pending request
WITH pending_requests AS (
    SELECT id, type, priority, location, title
    FROM assistance_requests 
    WHERE status = 'pending'
    LIMIT 10
),
volunteer_pool AS (
    SELECT 
        p.id,
        p.name,
        p.skills,
        p.volunteer_status,
        p.location,
        p.rating
    FROM profiles p
    WHERE p.role = 'volunteer'
        AND p.is_active = true
        AND p.volunteer_status IN ('available', 'busy')
),
match_simulation AS (
    SELECT 
        pr.id as request_id,
        pr.type as request_type,
        pr.priority,
        pr.title,
        COUNT(vp.id) as available_volunteers,
        COUNT(CASE WHEN vp.volunteer_status = 'available' THEN 1 END) as truly_available,
        COUNT(CASE WHEN vp.skills IS NOT NULL THEN 1 END) as volunteers_with_skills,
        -- Check skill matching
        COUNT(CASE 
            WHEN vp.skills IS NOT NULL AND (
                CASE pr.type
                    WHEN 'lost_person' THEN vp.skills && ARRAY['search_rescue', 'crowd_management', 'communication', 'local_knowledge']
                    WHEN 'medical' THEN vp.skills && ARRAY['medical', 'first_aid', 'healthcare', 'emergency']
                    WHEN 'guidance' THEN vp.skills && ARRAY['local_knowledge', 'tour_guide', 'navigation', 'language']
                    WHEN 'sanitation' THEN vp.skills && ARRAY['cleaning', 'sanitation', 'maintenance', 'hygiene']
                    WHEN 'general' THEN vp.skills && ARRAY['general', 'assistance', 'support']
                    ELSE vp.skills && ARRAY['general', 'assistance', 'support']
                END
            ) THEN 1 
        END) as skill_matched_volunteers,
        -- Check location constraints
        COUNT(CASE 
            WHEN pr.location IS NULL OR vp.location IS NULL THEN 1
            WHEN ST_DWithin(vp.location, pr.location, 15000) THEN 1
        END) as location_compatible_volunteers
    FROM pending_requests pr
    CROSS JOIN volunteer_pool vp
    WHERE NOT EXISTS (
        -- Exclude volunteers already assigned to pending/active requests
        SELECT 1 FROM assignments a 
        JOIN assistance_requests ar ON a.request_id = ar.id
        WHERE a.volunteer_id = vp.id 
            AND ar.status IN ('pending', 'in_progress', 'assigned')
    )
    GROUP BY pr.id, pr.type, pr.priority, pr.title
)
SELECT 
    'Match Simulation Results' as analysis_type,
    request_id,
    request_type,
    priority,
    title,
    available_volunteers,
    truly_available,
    volunteers_with_skills,
    skill_matched_volunteers,
    location_compatible_volunteers,
    CASE 
        WHEN skill_matched_volunteers = 0 THEN 'No skill match'
        WHEN truly_available = 0 THEN 'No available volunteers'
        WHEN location_compatible_volunteers = 0 THEN 'No volunteers in range'
        ELSE 'Should find match'
    END as likely_failure_reason
FROM match_simulation
ORDER BY skill_matched_volunteers ASC, truly_available ASC;

-- 5. Check for volunteers that might be stuck in assignments
SELECT 
    'Potentially Stuck Volunteers' as analysis_type,
    p.id,
    p.name,
    p.volunteer_status,
    COUNT(a.id) as active_assignments,
    STRING_AGG(ar.status::text, ', ') as assignment_statuses,
    MAX(a.assigned_at) as last_assignment_date
FROM profiles p
LEFT JOIN assignments a ON p.id = a.volunteer_id
LEFT JOIN assistance_requests ar ON a.request_id = ar.id AND ar.status IN ('assigned', 'in_progress')
WHERE p.role = 'volunteer' AND p.is_active = true
GROUP BY p.id, p.name, p.volunteer_status
HAVING COUNT(a.id) > 0
ORDER BY active_assignments DESC;

-- 6. Summary statistics
SELECT 
    'Summary Statistics' as analysis_type,
    (SELECT COUNT(*) FROM assistance_requests WHERE status = 'pending') as pending_requests,
    (SELECT COUNT(*) FROM profiles WHERE role = 'volunteer' AND is_active = true AND volunteer_status = 'available') as available_volunteers,
    (SELECT COUNT(*) FROM profiles WHERE role = 'volunteer' AND is_active = true AND skills IS NOT NULL) as volunteers_with_skills,
    (SELECT COUNT(*) FROM assignments a JOIN assistance_requests ar ON a.request_id = ar.id WHERE ar.status IN ('assigned', 'in_progress')) as active_assignments;
