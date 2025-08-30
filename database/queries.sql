-- BandhuConnect+ Database Queries
-- Common SQL queries for the application

-- =============================================
-- USER/PROFILE MANAGEMENT QUERIES
-- =============================================

-- Create new user profile (after Supabase auth signup)
INSERT INTO profiles (id, name, email, phone, role, skills, location)
VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326));

-- Get user profile by ID
SELECT * FROM profiles WHERE id = $1;

-- Get user profile by email
SELECT * FROM profiles WHERE email = $1;

-- Update user profile
UPDATE profiles 
SET name = $1, email = $2, phone = $3, skills = $4, location = ST_SetSRID(ST_MakePoint($5, $6), 4326), updated_at = NOW()
WHERE id = $7;

-- Update volunteer status
UPDATE profiles 
SET volunteer_status = $1, updated_at = NOW()
WHERE id = $2 AND role = 'volunteer';

-- Get all volunteers with their status
SELECT id, name, email, phone, skills, volunteer_status, rating, total_ratings,
       ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude
FROM profiles 
WHERE role = 'volunteer' 
ORDER BY name;

-- Get available volunteers near location (within 10km)
SELECT p.*, 
       ST_Distance(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance_meters
FROM profiles p
WHERE p.role = 'volunteer' 
  AND p.volunteer_status = 'available'
  AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326), 10000)
ORDER BY distance_meters
LIMIT 10;

-- =============================================
-- ASSISTANCE REQUEST QUERIES
-- =============================================

-- Create new assistance request
INSERT INTO assistance_requests (user_id, type, title, description, priority, location, address, photo_url)
VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9)
RETURNING *;

-- Get all requests with user info
SELECT ar.*, p.name as user_name, p.phone as user_phone,
       ST_X(ar.location::geometry) as longitude, ST_Y(ar.location::geometry) as latitude
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
ORDER BY ar.created_at DESC;

-- Get requests by user ID
SELECT ar.*, 
       ST_X(ar.location::geometry) as longitude, ST_Y(ar.location::geometry) as latitude
FROM assistance_requests ar
WHERE ar.user_id = $1
ORDER BY ar.created_at DESC;

-- Get requests by status
SELECT ar.*, p.name as user_name, p.phone as user_phone,
       ST_X(ar.location::geometry) as longitude, ST_Y(ar.location::geometry) as latitude
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
WHERE ar.status = $1
ORDER BY ar.created_at DESC;

-- Get pending requests near location (for volunteers)
SELECT ar.*, p.name as user_name, p.phone as user_phone,
       ST_X(ar.location::geometry) as longitude, ST_Y(ar.location::geometry) as latitude,
       ST_Distance(ar.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance_meters
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
WHERE ar.status = 'pending'
  AND ST_DWithin(ar.location, ST_SetSRID(ST_MakePoint($1, $2), 4326), 20000)
ORDER BY distance_meters, ar.created_at;

-- Update request status
UPDATE assistance_requests 
SET status = $1, updated_at = NOW()
WHERE id = $2;

-- Get request details with assignment info
SELECT ar.*, p.name as user_name, p.phone as user_phone, p.email as user_email,
       ST_X(ar.location::geometry) as longitude, ST_Y(ar.location::geometry) as latitude,
       a.id as assignment_id, a.status as assignment_status, a.volunteer_id,
       vp.name as volunteer_name, vp.phone as volunteer_phone
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
LEFT JOIN assignments a ON ar.id = a.request_id AND a.status != 'cancelled'
LEFT JOIN profiles vp ON a.volunteer_id = vp.id
WHERE ar.id = $1;

-- =============================================
-- ASSIGNMENT QUERIES
-- =============================================

-- Create new assignment
INSERT INTO assignments (request_id, volunteer_id, status)
VALUES ($1, $2, 'pending')
RETURNING *;

-- Get assignments for volunteer
SELECT a.*, ar.title, ar.description, ar.type, ar.priority, ar.status as request_status,
       ST_X(ar.location::geometry) as longitude, ST_Y(ar.location::geometry) as latitude,
       p.name as requester_name, p.phone as requester_phone
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles p ON ar.user_id = p.id
WHERE a.volunteer_id = $1
ORDER BY a.created_at DESC;

-- Get assignments by status for volunteer
SELECT a.*, ar.title, ar.description, ar.type, ar.priority, ar.status as request_status,
       ST_X(ar.location::geometry) as longitude, ST_Y(ar.location::geometry) as latitude,
       p.name as requester_name, p.phone as requester_phone
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles p ON ar.user_id = p.id
WHERE a.volunteer_id = $1 AND a.status = $2
ORDER BY a.created_at DESC;

-- Update assignment status
UPDATE assignments 
SET status = $1, 
    accepted_at = CASE WHEN $1 = 'accepted' THEN NOW() ELSE accepted_at END,
    started_at = CASE WHEN $1 = 'in_progress' THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
    cancelled_at = CASE WHEN $1 = 'cancelled' THEN NOW() ELSE cancelled_at END,
    updated_at = NOW()
WHERE id = $2;

-- Get active assignments for admin dashboard
SELECT a.*, ar.title, ar.type, ar.priority,
       p.name as requester_name, vp.name as volunteer_name,
       ST_X(ar.location::geometry) as longitude, ST_Y(ar.location::geometry) as latitude
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles p ON ar.user_id = p.id
JOIN profiles vp ON a.volunteer_id = vp.id
WHERE a.status IN ('accepted', 'in_progress')
ORDER BY a.updated_at DESC;

-- =============================================
-- CHAT AND MESSAGING QUERIES
-- =============================================

-- Create chat channel
INSERT INTO chat_channels (name, type, request_id, created_by)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- Get chat channels
SELECT * FROM chat_channels 
WHERE is_active = true
ORDER BY updated_at DESC;

-- Send message to channel
INSERT INTO chat_messages (channel_id, sender_id, content, message_type, metadata)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- Get messages from channel
SELECT cm.*, p.name as sender_name, p.avatar_url
FROM chat_messages cm
JOIN profiles p ON cm.sender_id = p.id
WHERE cm.channel_id = $1
ORDER BY cm.created_at ASC
LIMIT 50 OFFSET $2;

-- Send direct message
INSERT INTO direct_messages (sender_id, receiver_id, content, message_type, metadata)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- Get direct messages between two users
SELECT dm.*, 
       sp.name as sender_name, sp.avatar_url as sender_avatar,
       rp.name as receiver_name, rp.avatar_url as receiver_avatar
FROM direct_messages dm
JOIN profiles sp ON dm.sender_id = sp.id
JOIN profiles rp ON dm.receiver_id = rp.id
WHERE (dm.sender_id = $1 AND dm.receiver_id = $2) 
   OR (dm.sender_id = $2 AND dm.receiver_id = $1)
ORDER BY dm.created_at ASC
LIMIT 50 OFFSET $3;

-- Mark messages as read
UPDATE direct_messages 
SET is_read = true 
WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false;

-- =============================================
-- LOCATION TRACKING QUERIES
-- =============================================

-- Update user location
INSERT INTO location_updates (user_id, location, accuracy, speed, heading)
VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6);

-- Update profile location
UPDATE profiles 
SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326), updated_at = NOW()
WHERE id = $3;

-- Get recent location updates for user
SELECT *, ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude
FROM location_updates 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 10;

-- Get volunteers near location with their latest position
SELECT p.*, lu.created_at as last_location_update,
       ST_X(p.location::geometry) as longitude, ST_Y(p.location::geometry) as latitude,
       ST_Distance(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance_meters
FROM profiles p
LEFT JOIN LATERAL (
    SELECT created_at 
    FROM location_updates 
    WHERE user_id = p.id 
    ORDER BY created_at DESC 
    LIMIT 1
) lu ON true
WHERE p.role = 'volunteer' 
  AND p.volunteer_status IN ('available', 'busy')
  AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326), 15000)
ORDER BY distance_meters;

-- =============================================
-- NOTIFICATION QUERIES
-- =============================================

-- Create notification
INSERT INTO notifications (user_id, title, body, type, data)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- Get user notifications
SELECT * FROM notifications 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 20 OFFSET $2;

-- Get unread notifications count
SELECT COUNT(*) as unread_count 
FROM notifications 
WHERE user_id = $1 AND is_read = false;

-- Mark notification as read
UPDATE notifications 
SET is_read = true 
WHERE id = $1 AND user_id = $2;

-- Mark all notifications as read for user
UPDATE notifications 
SET is_read = true 
WHERE user_id = $1 AND is_read = false;

-- =============================================
-- ANALYTICS AND REPORTING QUERIES
-- =============================================

-- Get volunteer statistics
SELECT 
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assignments,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_assignments,
    AVG(rating) as average_rating
FROM assignments 
WHERE volunteer_id = $1;

-- Get admin dashboard statistics
SELECT 
    (SELECT COUNT(*) FROM assistance_requests WHERE status = 'pending') as pending_requests,
    (SELECT COUNT(*) FROM assistance_requests WHERE status = 'in_progress') as active_requests,
    (SELECT COUNT(*) FROM assistance_requests WHERE status = 'completed') as completed_requests,
    (SELECT COUNT(*) FROM profiles WHERE role = 'volunteer' AND volunteer_status = 'available') as available_volunteers,
    (SELECT COUNT(*) FROM profiles WHERE role = 'volunteer' AND volunteer_status = 'busy') as busy_volunteers,
    (SELECT COUNT(*) FROM assignments WHERE status = 'in_progress') as active_assignments;

-- Get request statistics by type
SELECT type, COUNT(*) as count, 
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM assistance_requests 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY type
ORDER BY count DESC;

-- Get volunteer performance metrics
SELECT p.id, p.name, p.rating, p.total_ratings,
       COUNT(a.id) as total_assignments,
       COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
       AVG(EXTRACT(EPOCH FROM (a.completed_at - a.accepted_at))/60) as avg_completion_time_minutes
FROM profiles p
LEFT JOIN assignments a ON p.id = a.volunteer_id
WHERE p.role = 'volunteer'
GROUP BY p.id, p.name, p.rating, p.total_ratings
ORDER BY p.rating DESC, completed_assignments DESC;

-- =============================================
-- REAL-TIME SUBSCRIPTION QUERIES
-- =============================================

-- Subscribe to new requests (for volunteers)
-- This is used with Supabase Realtime
SELECT * FROM assistance_requests WHERE status = 'pending';

-- Subscribe to assignment updates (for specific volunteer)
SELECT * FROM assignments WHERE volunteer_id = $1;

-- Subscribe to request updates (for specific user)
SELECT * FROM assistance_requests WHERE user_id = $1;

-- Subscribe to chat messages (for specific channel)
SELECT cm.*, p.name as sender_name 
FROM chat_messages cm
JOIN profiles p ON cm.sender_id = p.id
WHERE cm.channel_id = $1;

-- Subscribe to direct messages (for specific user)
SELECT dm.*, p.name as sender_name 
FROM direct_messages dm
JOIN profiles p ON dm.sender_id = p.id
WHERE dm.receiver_id = $1 OR dm.sender_id = $1;
