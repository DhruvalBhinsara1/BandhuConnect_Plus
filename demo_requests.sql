-- Demo Assistance Requests for Auto-Assignment Testing
-- Run this script in Supabase SQL Editor to create test data

-- Use an existing user ID from your profiles table
-- Replace this with an actual user ID: SELECT id FROM profiles LIMIT 1;
WITH demo_user AS (
    SELECT id FROM profiles WHERE role = 'pilgrim' LIMIT 1
)
INSERT INTO assistance_requests (
    user_id,
    type,
    title,
    description,
    priority,
    location,
    address,
    status,
    created_at
) 
SELECT 
    demo_user.id,
    request_data.type::request_type,
    request_data.title,
    request_data.description,
    request_data.priority::priority_level,
    request_data.location,
    request_data.address,
    request_data.status::request_status,
    request_data.created_at
FROM demo_user,
(VALUES 
    ('medical', 'Chest Pain Emergency', 'Elderly pilgrim experiencing chest pain near main temple entrance', 'high', ST_MakePoint(77.2090, 28.6139), 'Red Fort Main Gate, Delhi', 'pending', NOW() - INTERVAL '2 minutes'),
    ('medical', 'Ankle Injury', 'Minor injury - twisted ankle while walking on uneven path', 'medium', ST_MakePoint(77.2410, 28.6562), 'India Gate Lawns, Delhi', 'pending', NOW() - INTERVAL '5 minutes'),
    ('emergency', 'Diabetes Emergency', 'Diabetic pilgrim needs immediate insulin assistance', 'high', ST_MakePoint(77.2588, 28.5535), 'Lotus Temple, Delhi', 'pending', NOW() - INTERVAL '1 minute'),
    ('guidance', 'Lost Pilgrim Group', 'Lost pilgrim group needs directions to accommodation area', 'low', ST_MakePoint(77.2065, 28.6289), 'Chandni Chowk Market, Delhi', 'pending', NOW() - INTERVAL '8 minutes'),
    ('guidance', 'Lost Family', 'Family with children lost in crowded festival area', 'medium', ST_MakePoint(77.2334, 28.6507), 'Connaught Place, Delhi', 'pending', NOW() - INTERVAL '3 minutes'),
    ('guidance', 'Food Location Help', 'International pilgrims need help finding vegetarian food stalls', 'low', ST_MakePoint(77.2303, 28.6692), 'Civil Lines, Delhi', 'pending', NOW() - INTERVAL '12 minutes'),
    ('general', 'Wheelchair Access', 'Wheelchair-bound pilgrim needs accessible transport to main venue', 'medium', ST_MakePoint(77.1855, 28.5244), 'Qutub Minar Complex, Delhi', 'pending', NOW() - INTERVAL '6 minutes'),
    ('emergency', 'Emergency Ambulance', 'Pregnant woman in labor needs immediate ambulance', 'high', ST_MakePoint(77.2197, 28.6328), 'Jama Masjid Area, Delhi', 'pending', NOW() - INTERVAL '30 seconds'),
    ('general', 'Shuttle Service', 'Group of elderly pilgrims need shuttle service to parking area', 'low', ST_MakePoint(77.2295, 28.6129), 'Rajghat, Delhi', 'pending', NOW() - INTERVAL '15 minutes'),
    ('emergency', 'Suspicious Package', 'Suspicious unattended bag reported near prayer hall', 'high', ST_MakePoint(77.2167, 28.6448), 'Red Fort Diwan-i-Khas, Delhi', 'pending', NOW() - INTERVAL '45 seconds'),
    ('lost_person', 'Lost Child', 'Child separated from parents in crowd - crying and distressed', 'medium', ST_MakePoint(77.2507, 28.5933), 'Humayuns Tomb, Delhi', 'pending', NOW() - INTERVAL '4 minutes'),
    ('general', 'Theft Report', 'Pickpocketing incident reported - need security patrol', 'low', ST_MakePoint(77.2441, 28.6585), 'Khan Market, Delhi', 'pending', NOW() - INTERVAL '10 minutes'),
    ('general', 'Luggage Help', 'Pilgrim needs help carrying heavy luggage up stairs', 'medium', ST_MakePoint(77.1716, 28.6271), 'Karol Bagh Metro Station, Delhi', 'pending', NOW() - INTERVAL '7 minutes'),
    ('guidance', 'Translation Help', 'Language barrier - foreign pilgrim needs Hindi translator', 'low', ST_MakePoint(77.3272, 28.5706), 'Akshardham Temple, Delhi', 'pending', NOW() - INTERVAL '20 minutes'),
    ('general', 'Lost Documents', 'Pilgrim lost important documents and phone - needs assistance', 'medium', ST_MakePoint(77.2069, 28.6219), 'Spice Bazaar, Delhi', 'pending', NOW() - INTERVAL '9 minutes'),
    ('medical', 'Heat Exhaustion', 'Heat exhaustion - pilgrim needs shade and water immediately', 'medium', ST_MakePoint(77.2090, 28.6139), 'Red Fort Lahori Gate, Delhi', 'pending', NOW() - INTERVAL '3 minutes'),
    ('general', 'Rain Shelter', 'Rain shelter needed for group of pilgrims without umbrellas', 'low', ST_MakePoint(77.2410, 28.6562), 'India Gate Central Lawn, Delhi', 'pending', NOW() - INTERVAL '11 minutes'),
    ('general', 'Phone Emergency', 'Pilgrim phone battery died - needs to contact family urgently', 'low', ST_MakePoint(77.2065, 28.6289), 'Chandni Chowk Metro Station, Delhi', 'pending', NOW() - INTERVAL '14 minutes'),
    ('guidance', 'WiFi Access', 'WiFi not working - pilgrims need internet access for digital passes', 'medium', ST_MakePoint(77.2334, 28.6507), 'Palika Bazaar, Delhi', 'pending', NOW() - INTERVAL '6 minutes'),
    ('guidance', 'Visual Guide', 'Visually impaired pilgrim needs guide assistance through temple complex', 'medium', ST_MakePoint(77.2588, 28.5535), 'Lotus Temple Prayer Hall, Delhi', 'pending', NOW() - INTERVAL '8 minutes'),
    ('guidance', 'Sign Language', 'Hearing impaired pilgrim needs sign language interpreter', 'medium', ST_MakePoint(77.2303, 28.6692), 'Timarpur, Delhi', 'pending', NOW() - INTERVAL '13 minutes'),
    ('emergency', 'Blood Sugar Emergency', 'Diabetic pilgrim experiencing low blood sugar - needs food urgently', 'high', ST_MakePoint(77.1855, 28.5244), 'Mehrauli Archaeological Park, Delhi', 'pending', NOW() - INTERVAL '2 minutes'),
    ('general', 'Water Emergency', 'Large group ran out of water bottles in hot weather', 'medium', ST_MakePoint(77.2197, 28.6328), 'Jama Masjid Steps, Delhi', 'pending', NOW() - INTERVAL '5 minutes'),
    ('crowd_management', 'Crowd Control', 'Overcrowding at entrance causing safety concern', 'medium', ST_MakePoint(77.2295, 28.6129), 'Rajghat Memorial, Delhi', 'pending', NOW() - INTERVAL '4 minutes'),
    ('crowd_management', 'Photo Spot Control', 'Need crowd control volunteer at popular photo spot', 'low', ST_MakePoint(77.2167, 28.6448), 'Red Fort Throne Room, Delhi', 'pending', NOW() - INTERVAL '16 minutes')
) AS request_data(type, title, description, priority, location, address, status, created_at);

-- Get user IDs that were just created for the completed requests
-- We'll use a subquery to get actual user IDs from the demo users we created


-- Optional: Add some completed requests to show system history
WITH demo_user AS (
    SELECT id FROM profiles WHERE role = 'pilgrim' LIMIT 1
)
INSERT INTO assistance_requests (
    user_id,
    type,
    title,
    description,
    priority,
    location,
    address,
    status,
    created_at,
    updated_at
) 
SELECT 
    demo_user.id,
    completed_data.type::request_type,
    completed_data.title,
    completed_data.description,
    completed_data.priority::priority_level,
    completed_data.location,
    completed_data.address,
    completed_data.status::request_status,
    completed_data.created_at,
    completed_data.updated_at
FROM demo_user,
(VALUES 
    ('medical', 'First Aid Complete', 'Successfully treated minor cut with first aid', 'high', ST_MakePoint(77.2090, 28.6139), 'Red Fort Museum, Delhi', 'cancelled', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '45 minutes'),
    ('guidance', 'Directions Provided', 'Provided directions to restroom facilities', 'medium', ST_MakePoint(77.2410, 28.6562), 'India Gate Parking, Delhi', 'cancelled', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 50 minutes'),
    ('general', 'Shuttle Arranged', 'Arranged shuttle service for elderly group', 'low', ST_MakePoint(77.2588, 28.5535), 'Lotus Temple Parking, Delhi', 'cancelled', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 30 minutes')
) AS completed_data(type, title, description, priority, location, address, status, created_at, updated_at);


-- Display summary of inserted requests
SELECT 
    type,
    priority,
    COUNT(*) as request_count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/60)::INTEGER as avg_age_minutes
FROM assistance_requests 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY type, priority
ORDER BY 
    CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
    END,
    type;
