-- Demo Volunteer User Queries for BandhuConnect+ Testing
-- Use these queries instead of hardcoded mock data for more realistic testing

-- =============================================
-- GET ALL DEMO VOLUNTEERS
-- =============================================
-- Query to fetch all volunteer users with their details
SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    p.role,
    p.skills,
    p.volunteer_status as status,
    p.is_active,
    p.rating,
    p.total_ratings,
    p.created_at,
    p.updated_at,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'volunteer'
AND u.email LIKE '%@demo.com'
ORDER BY p.name;

-- =============================================
-- GET AVAILABLE VOLUNTEERS
-- =============================================
-- Query to fetch only available volunteers for task assignment
SELECT 
    p.id,
    p.name,
    p.email,
    p.skills,
    p.volunteer_status,
    p.rating,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'volunteer'
AND p.volunteer_status = 'available'
AND p.is_active = true
AND u.email LIKE '%@demo.com'
ORDER BY p.rating DESC;

-- =============================================
-- GET VOLUNTEER BY EMAIL (FOR LOGIN)
-- =============================================
-- Query to fetch specific volunteer details during login
SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    p.role,
    p.skills,
    p.volunteer_status as status,
    p.is_active,
    p.rating,
    p.total_ratings,
    p.age,
    p.created_at,
    p.updated_at,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'volunteer'
AND u.email = $1; -- Replace $1 with actual email

-- =============================================
-- GET VOLUNTEER STATISTICS
-- =============================================
-- Query to get real-time volunteer statistics for dashboard
SELECT 
    v.id,
    v.name,
    -- Task statistics
    COALESCE(task_stats.total_tasks, 0) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
    COALESCE(task_stats.active_assignments, 0) as active_assignments,
    -- Calculate hours worked (mock calculation based on completed tasks)
    COALESCE(task_stats.completed_tasks * 2, 0) as hours_worked,
    -- Volunteer info
    v.rating,
    v.volunteer_status,
    v.is_active
FROM profiles v
LEFT JOIN (
    SELECT 
        a.volunteer_id,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN a.status IN ('assigned', 'accepted', 'on_duty') THEN 1 END) as active_assignments
    FROM assignments a
    GROUP BY a.volunteer_id
) task_stats ON v.id = task_stats.volunteer_id
WHERE v.role = 'volunteer'
AND v.id = $1; -- Replace $1 with volunteer ID

-- =============================================
-- GET VOLUNTEER ASSIGNMENTS
-- =============================================
-- Query to fetch all assignments for a specific volunteer
SELECT 
    a.id,
    a.status,
    a.assigned_at,
    a.accepted_at,
    a.started_at,
    a.completed_at,
    -- Request details
    r.id as request_id,
    r.type as request_type,
    r.title,
    r.description,
    r.priority,
    r.status as request_status,
    r.photo_url,
    r.location_description,
    ST_X(r.location::geometry) as request_longitude,
    ST_Y(r.location::geometry) as request_latitude,
    r.created_at as request_created_at,
    -- Requester details
    p.name as requester_name,
    p.phone as requester_phone
FROM assignments a
JOIN assistance_requests r ON a.request_id = r.id
JOIN profiles p ON r.user_id = p.id
WHERE a.volunteer_id = $1 -- Replace $1 with volunteer ID
ORDER BY a.assigned_at DESC;

-- =============================================
-- GET ACTIVE ASSIGNMENTS FOR VOLUNTEER
-- =============================================
-- Query to fetch only active assignments (assigned, accepted, on_duty)
SELECT 
    a.id,
    a.status,
    a.assigned_at,
    a.accepted_at,
    a.started_at,
    -- Request details
    r.id as request_id,
    r.type as request_type,
    r.title,
    r.description,
    r.priority,
    r.location_description,
    ST_X(r.location::geometry) as request_longitude,
    ST_Y(r.location::geometry) as request_latitude,
    -- Requester details
    p.name as requester_name,
    p.phone as requester_phone
FROM assignments a
JOIN assistance_requests r ON a.request_id = r.id
JOIN profiles p ON r.user_id = p.id
WHERE a.volunteer_id = $1 -- Replace $1 with volunteer ID
AND a.status IN ('assigned', 'accepted', 'on_duty')
ORDER BY r.priority DESC, a.assigned_at ASC;

-- =============================================
-- UPDATE VOLUNTEER STATUS
-- =============================================
-- Query to update volunteer status (available, busy, on_duty, offline)
UPDATE profiles 
SET 
    volunteer_status = $2,
    is_active = CASE 
        WHEN $2 = 'offline' THEN false 
        ELSE true 
    END,
    updated_at = NOW()
WHERE id = $1 -- Replace $1 with volunteer ID
AND role = 'volunteer'
RETURNING 
    id, 
    name, 
    volunteer_status, 
    is_active;

-- =============================================
-- UPDATE VOLUNTEER PROFILE
-- =============================================
-- Query to update volunteer profile information
UPDATE profiles 
SET 
    name = $2,
    phone = $3,
    skills = $4,
    volunteer_status = $5,
    updated_at = NOW()
WHERE id = $1 -- Replace $1 with volunteer ID
AND role = 'volunteer'
RETURNING 
    id, 
    name, 
    phone, 
    skills, 
    volunteer_status, 
    updated_at;

-- =============================================
-- GET VOLUNTEER DASHBOARD DATA
-- =============================================
-- Comprehensive query for volunteer dashboard with all needed data
WITH volunteer_stats AS (
    SELECT 
        a.volunteer_id,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN a.status IN ('assigned', 'accepted', 'on_duty') THEN 1 END) as active_assignments,
        -- Calculate estimated hours (2 hours per completed task)
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) * 2 as hours_worked
    FROM assignments a
    WHERE a.volunteer_id = $1 -- Replace $1 with volunteer ID
    GROUP BY a.volunteer_id
),
recent_assignments AS (
    SELECT 
        a.id,
        a.status,
        a.assigned_at,
        r.title,
        r.description,
        r.priority,
        r.type,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude
    FROM assignments a
    JOIN assistance_requests r ON a.request_id = r.id
    WHERE a.volunteer_id = $1 -- Replace $1 with volunteer ID
    AND a.status IN ('assigned', 'accepted', 'on_duty')
    ORDER BY a.assigned_at DESC
    LIMIT 3
)
SELECT 
    -- Volunteer info
    v.id,
    v.name,
    v.email,
    v.volunteer_status,
    v.is_active,
    v.rating,
    -- Statistics
    COALESCE(vs.total_tasks, 0) as total_tasks,
    COALESCE(vs.completed_tasks, 0) as completed_tasks,
    COALESCE(vs.active_assignments, 0) as active_assignments,
    COALESCE(vs.hours_worked, 0) as hours_worked,
    -- Recent assignments (as JSON array)
    COALESCE(
        json_agg(
            json_build_object(
                'id', ra.id,
                'status', ra.status,
                'title', ra.title,
                'description', ra.description,
                'priority', ra.priority,
                'type', ra.type,
                'assigned_at', ra.assigned_at,
                'location', json_build_object(
                    'longitude', ra.longitude,
                    'latitude', ra.latitude
                )
            )
        ) FILTER (WHERE ra.id IS NOT NULL),
        '[]'::json
    ) as recent_assignments
FROM profiles v
LEFT JOIN volunteer_stats vs ON v.id = vs.volunteer_id
LEFT JOIN recent_assignments ra ON true
WHERE v.id = $1 -- Replace $1 with volunteer ID
AND v.role = 'volunteer'
GROUP BY v.id, v.name, v.email, v.volunteer_status, v.is_active, v.rating, 
         vs.total_tasks, vs.completed_tasks, vs.active_assignments, vs.hours_worked;

-- =============================================
-- DEMO VOLUNTEER TEST CREDENTIALS
-- =============================================
/*
Use these credentials for testing:

1. Dr. Raj Patel (Medical + General)
   Email: raj.volunteer@demo.com
   Password: demo123
   Skills: ['medical', 'general']
   Status: available

2. Priya Sharma (Guidance + Crowd Management)
   Email: priya.volunteer@demo.com  
   Password: demo123
   Skills: ['guidance', 'crowd_management']
   Status: available

3. Amit Kumar (Sanitation + General)
   Email: amit.volunteer@demo.com
   Password: demo123
   Skills: ['sanitation', 'general'] 
   Status: busy

4. Sneha Joshi (Lost Person + General)
   Email: sneha.volunteer@demo.com
   Password: demo123
   Skills: ['lost_person', 'general']
   Status: offline

All passwords: demo123
*/
