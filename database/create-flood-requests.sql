-- Create a flood of realistic assistance requests for testing auto-assignment
-- This will generate diverse requests across different categories and priorities

-- First, let's get some user IDs to assign requests to
-- We'll use existing pilgrim users or create some if needed

INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, location_description, created_at) VALUES

-- Medical emergencies (high priority)
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000006', 'medical', 'Elderly person feeling dizzy', 'My grandmother is feeling very dizzy and needs immediate medical attention near the main temple.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), 'Main Temple Complex', NOW() - INTERVAL '2 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000007', 'medical', 'Child with fever', 'My 8-year-old son has developed high fever. Need urgent medical help.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5720, 23.0230), 4326), 'Near Parking Area', NOW() - INTERVAL '5 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000008', 'medical', 'Diabetic emergency', 'Diabetic person needs immediate insulin. Blood sugar very low.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5710, 23.0220), 4326), 'Food Court Area', NOW() - INTERVAL '1 minute'),

-- Lost person cases (high priority)
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000006', 'lost_person', 'Missing elderly mother', 'Lost my 70-year-old mother in the crowd. She was wearing a blue saree. Last seen near the main entrance.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5715, 23.0235), 4326), 'Main Entrance Gate', NOW() - INTERVAL '8 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000007', 'lost_person', 'Missing child', 'My 6-year-old daughter is missing. She was wearing a red dress. Please help find her urgently.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5718, 23.0228), 4326), 'Temple Courtyard', NOW() - INTERVAL '3 minutes'),

-- Guidance requests (medium priority)
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000008', 'guidance', 'First time visitor guidance', 'First time visiting the temple. Need guidance about proper rituals and dress code.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), 'Information Center', NOW() - INTERVAL '10 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000006', 'guidance', 'Prayer timing information', 'Need information about special prayer timings and upcoming festivals.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5716, 23.0227), 4326), 'Temple Office', NOW() - INTERVAL '15 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000007', 'guidance', 'Wheelchair accessibility', 'Need guidance for wheelchair accessible routes and facilities in the temple complex.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5712, 23.0222), 4326), 'Accessibility Entrance', NOW() - INTERVAL '12 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000008', 'guidance', 'Photography guidelines', 'Want to know about photography rules and permitted areas for family photos.', 'low', 'pending', ST_SetSRID(ST_MakePoint(72.5719, 23.0229), 4326), 'Garden Area', NOW() - INTERVAL '20 minutes'),

-- Transportation help (medium priority)
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000006', 'transportation', 'Need taxi to railway station', 'Urgent need for taxi or auto to reach railway station. Train departure in 1 hour.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5725, 23.0240), 4326), 'Exit Gate B', NOW() - INTERVAL '7 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000007', 'transportation', 'Bus route information', 'Need information about bus routes to city center and timings.', 'low', 'pending', ST_SetSRID(ST_MakePoint(72.5722, 23.0238), 4326), 'Bus Stop Area', NOW() - INTERVAL '18 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000008', 'transportation', 'Parking assistance', 'Car broke down in parking lot. Need help with vehicle or alternative transport.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5730, 23.0245), 4326), 'Parking Lot C', NOW() - INTERVAL '25 minutes'),

-- Accommodation requests (medium/low priority)
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000006', 'accommodation', 'Emergency night shelter', 'Missed last bus home. Need emergency accommodation for tonight with family of 4.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5708, 23.0218), 4326), 'Guest House Area', NOW() - INTERVAL '30 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000007', 'accommodation', 'Budget lodge recommendation', 'Need recommendation for budget-friendly lodge nearby for 2 nights stay.', 'low', 'pending', ST_SetSRID(ST_MakePoint(72.5705, 23.0215), 4326), 'Information Kiosk', NOW() - INTERVAL '45 minutes'),

-- Food and water requests (low/medium priority)
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000008', 'other', 'Water for elderly group', 'Need drinking water for group of 15 elderly pilgrims. Very hot weather.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5717, 23.0226), 4326), 'Rest Area', NOW() - INTERVAL '6 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000006', 'other', 'Food for diabetic person', 'Need sugar-free food options for diabetic family member. Regular prasad not suitable.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5713, 23.0223), 4326), 'Prasad Counter', NOW() - INTERVAL '22 minutes'),

-- General assistance (low priority)
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000007', 'other', 'Lost mobile phone', 'Lost my mobile phone somewhere in the temple complex. Need help to locate or report.', 'low', 'pending', ST_SetSRID(ST_MakePoint(72.5721, 23.0231), 4326), 'Security Office', NOW() - INTERVAL '35 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000008', 'other', 'Donation procedure help', 'Need guidance about donation procedures and receipt process.', 'low', 'pending', ST_SetSRID(ST_MakePoint(72.5715, 23.0224), 4326), 'Donation Counter', NOW() - INTERVAL '40 minutes'),

-- More urgent requests to create realistic flood
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000006', 'medical', 'Chest pain emergency', 'Middle-aged man experiencing chest pain. Needs immediate medical attention.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5709, 23.0219), 4326), 'Prayer Hall', NOW() - INTERVAL '30 seconds'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000007', 'lost_person', 'Missing teenager', 'My 16-year-old son is missing for last 20 minutes. He has autism, please help urgently.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5724, 23.0234), 4326), 'Youth Activity Area', NOW() - INTERVAL '1 minute'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000008', 'guidance', 'Emergency exit information', 'Large crowd gathering, need information about emergency exits and safety procedures.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5716, 23.0226), 4326), 'Central Courtyard', NOW() - INTERVAL '45 seconds'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000006', 'transportation', 'Ambulance needed', 'Need ambulance for elderly person who fell and injured leg. Cannot walk.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5711, 23.0221), 4326), 'Steps Area', NOW() - INTERVAL '2 minutes'),

-- Additional medium priority requests
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000007', 'guidance', 'Special needs assistance', 'Blind person needs guidance to navigate temple complex safely.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), 'Main Temple', NOW() - INTERVAL '14 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000008', 'other', 'Language interpreter', 'Foreign visitors need Hindi/English interpreter for temple procedures.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5718, 23.0228), 4326), 'Visitor Center', NOW() - INTERVAL '28 minutes'),

(uuid_generate_v4(), '00000000-0000-0000-0000-000000000006', 'accommodation', 'Family with infant needs rest', 'Family with 3-month-old baby needs quiet place to rest and feed the child.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5707, 23.0217), 4326), 'Mother-Child Rest Area', NOW() - INTERVAL '16 minutes');

-- Display summary of created requests
SELECT 
    'Flood Requests Created Successfully!' as message,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
    COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority,
    COUNT(*) FILTER (WHERE priority = 'low') as low_priority,
    COUNT(*) FILTER (WHERE type = 'medical') as medical_requests,
    COUNT(*) FILTER (WHERE type = 'lost_person') as lost_person_requests,
    COUNT(*) FILTER (WHERE type = 'guidance') as guidance_requests,
    COUNT(*) FILTER (WHERE type = 'transportation') as transportation_requests,
    COUNT(*) FILTER (WHERE type = 'accommodation') as accommodation_requests,
    COUNT(*) FILTER (WHERE type = 'other') as other_requests
FROM assistance_requests 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND status = 'pending';
