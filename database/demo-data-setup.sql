-- Demo Data Setup for BandhuConnect+ Hackathon
-- Run this in Supabase SQL Editor to create realistic demo scenarios

-- Create sample assistance requests for demo
-- First verify we have the accounts
SELECT email, name, role FROM profiles WHERE email IN (
    'ramesh.elderly@demo.com', 'sunita.family@demo.com', 'mohan.lost@demo.com', 
    'geeta.foreign@demo.com', 'vijay.emergency@demo.com', 'kavita.disabled@demo.com'
);

INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, address, estimated_duration) VALUES
-- Medical emergencies
(uuid_generate_v4(), (SELECT id FROM profiles WHERE email = 'ramesh.elderly@demo.com' LIMIT 1), 'medical', 'Elderly person needs medical assistance', 'My grandfather is feeling dizzy and needs immediate medical attention near Gate 3', 'high', 'pending', ST_GeogFromText('POINT(77.2090 28.6139)'), 'Gate 3, Kumbh Mela Grounds', 30),

-- Lost person cases
(uuid_generate_v4(), (SELECT id FROM profiles WHERE email = 'sunita.family@demo.com' LIMIT 1), 'lost_person', 'Lost child - urgent help needed', 'My 8-year-old son got separated from our group near the main temple. He is wearing a red shirt and blue shorts. Please help!', 'high', 'pending', ST_GeogFromText('POINT(77.2100 28.6150)'), 'Main Temple Area, Kumbh Mela', 45),

-- Sanitation issues
(uuid_generate_v4(), (SELECT id FROM profiles WHERE email = 'mohan.lost@demo.com' LIMIT 1), 'sanitation', 'Toilet facilities blocked', 'The public toilet near Sector 7 is completely blocked and overflowing. Urgent cleaning needed.', 'medium', 'pending', ST_GeogFromText('POINT(77.2080 28.6120)'), 'Sector 7, Public Toilet Block', 60),

-- Guidance requests
(uuid_generate_v4(), (SELECT id FROM profiles WHERE email = 'geeta.foreign@demo.com' LIMIT 1), 'guidance', 'Need directions to accommodation', 'We are foreign visitors and cannot find our allocated accommodation. Need someone who speaks English to guide us.', 'medium', 'pending', ST_GeogFromText('POINT(77.2110 28.6160)'), 'Information Center, Kumbh Mela', 20),

-- Crowd management
(uuid_generate_v4(), (SELECT id FROM profiles WHERE email = 'vijay.emergency@demo.com' LIMIT 1), 'crowd_management', 'Overcrowding at bathing ghat', 'There is dangerous overcrowding at Ghat 2. People are getting pushed and someone might get hurt.', 'high', 'pending', ST_GeogFromText('POINT(77.2070 28.6130)'), 'Bathing Ghat 2, River Bank', 90),

-- General assistance
(uuid_generate_v4(), (SELECT id FROM profiles WHERE email = 'kavita.disabled@demo.com' LIMIT 1), 'general', 'Wheelchair assistance needed', 'I am in a wheelchair and need help navigating through the crowd to reach the main ceremony area.', 'medium', 'pending', ST_GeogFromText('POINT(77.2095 28.6145)'), 'Near Main Ceremony Ground', 40);

-- Create some completed requests for statistics
INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, address, estimated_duration, created_at) VALUES
(uuid_generate_v4(), (SELECT id FROM profiles WHERE email = 'arjun.student@demo.com' LIMIT 1), 'guidance', 'Found lost belongings', 'Someone helped me find my lost bag with important documents. Thank you!', 'low', 'completed', ST_GeogFromText('POINT(77.2085 28.6135)'), 'Lost & Found Center', 15, NOW() - INTERVAL '2 hours'),

(uuid_generate_v4(), (SELECT id FROM profiles WHERE email = 'lakshmi.group@demo.com' LIMIT 1), 'medical', 'First aid provided', 'Volunteer provided excellent first aid when my friend fainted. Very grateful!', 'medium', 'completed', ST_GeogFromText('POINT(77.2105 28.6155)'), 'Medical Tent Area', 25, NOW() - INTERVAL '4 hours');

-- Update some volunteer locations for realistic demo
UPDATE profiles SET 
    location = ST_GeogFromText('POINT(77.2088 28.6142)'),
    address = 'Volunteer Station A, Kumbh Mela'
WHERE email = 'dr.rajesh.medical@demo.com';

UPDATE profiles SET 
    location = ST_GeogFromText('POINT(77.2092 28.6148)'),
    address = 'Security Post 1, Kumbh Mela'
WHERE email = 'amit.security@demo.com';

UPDATE profiles SET 
    location = ST_GeogFromText('POINT(77.2098 28.6138)'),
    address = 'Information Desk, Main Gate'
WHERE email = 'priya.guide@demo.com';

UPDATE profiles SET 
    location = ST_GeogFromText('POINT(77.2075 28.6125)'),
    address = 'Sanitation Unit, Sector 5'
WHERE email = 'ravi.maintenance@demo.com';

-- Insert some user locations for real-time tracking demo
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, is_active) VALUES
-- Volunteers
((SELECT id FROM profiles WHERE email = 'dr.rajesh.medical@demo.com' LIMIT 1), 28.6142, 77.2088, 5.0, true),
((SELECT id FROM profiles WHERE email = 'amit.security@demo.com' LIMIT 1), 28.6148, 77.2092, 3.0, true),
((SELECT id FROM profiles WHERE email = 'priya.guide@demo.com' LIMIT 1), 28.6138, 77.2098, 4.0, true),
((SELECT id FROM profiles WHERE email = 'ravi.maintenance@demo.com' LIMIT 1), 28.6125, 77.2075, 6.0, true),

-- Pilgrims
((SELECT id FROM profiles WHERE email = 'ramesh.elderly@demo.com' LIMIT 1), 28.6139, 77.2090, 8.0, true),
((SELECT id FROM profiles WHERE email = 'sunita.family@demo.com' LIMIT 1), 28.6150, 77.2100, 7.0, true),
((SELECT id FROM profiles WHERE email = 'geeta.foreign@demo.com' LIMIT 1), 28.6160, 77.2110, 5.0, true),
((SELECT id FROM profiles WHERE email = 'vijay.emergency@demo.com' LIMIT 1), 28.6130, 77.2070, 9.0, true)

ON CONFLICT (user_id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy = EXCLUDED.accuracy,
    is_active = EXCLUDED.is_active,
    last_updated = NOW();

-- Verify demo data
SELECT 
    'Assistance Requests' as data_type,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
FROM assistance_requests

UNION ALL

SELECT 
    'User Locations' as data_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active,
    0 as completed
FROM user_locations

UNION ALL

SELECT 
    'Volunteers' as data_type,
    COUNT(*) as count,
    COUNT(CASE WHEN volunteer_status = 'available' THEN 1 END) as available,
    COUNT(CASE WHEN volunteer_status = 'busy' THEN 1 END) as busy
FROM profiles WHERE role = 'volunteer';

-- Show sample requests for demo
SELECT 
    ar.title,
    ar.type,
    ar.priority,
    ar.status,
    p.name as requester,
    ar.address,
    ar.estimated_duration
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
ORDER BY ar.created_at DESC
LIMIT 10;
