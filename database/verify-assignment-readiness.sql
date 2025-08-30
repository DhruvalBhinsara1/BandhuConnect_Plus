-- Quick verification that auto-assignment should now work
SELECT 
    ar.id,
    ar.type,
    ar.priority,
    ar.title,
    CASE ar.type
        WHEN 'guidance' THEN (
            SELECT COUNT(*) FROM profiles p 
            WHERE p.role = 'volunteer' AND p.is_active = true 
            AND p.volunteer_status = 'available'
            AND p.skills && ARRAY['local_knowledge', 'tour_guide', 'navigation', 'language']
        )
        WHEN 'lost_person' THEN (
            SELECT COUNT(*) FROM profiles p 
            WHERE p.role = 'volunteer' AND p.is_active = true 
            AND p.volunteer_status = 'available'
            AND p.skills && ARRAY['search_rescue', 'crowd_management', 'communication', 'local_knowledge']
        )
        WHEN 'general' THEN (
            SELECT COUNT(*) FROM profiles p 
            WHERE p.role = 'volunteer' AND p.is_active = true 
            AND p.volunteer_status = 'available'
            AND p.skills && ARRAY['general', 'assistance', 'support']
        )
        ELSE 0
    END as available_skilled_volunteers
FROM assistance_requests ar
WHERE ar.status = 'pending'
ORDER BY ar.priority DESC, ar.created_at;
