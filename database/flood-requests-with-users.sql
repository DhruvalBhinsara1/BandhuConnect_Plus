-- Flood requests using existing demo users - matches demo-users-simple.sql pattern
-- Uses ONLY the 7 valid enum values: crowd_management, emergency, general, guidance, lost_person, medical, sanitation

-- Uses the same pilgrim users from demo-users-simple.sql
DO $$
DECLARE
    user_id_1 UUID;
    user_id_2 UUID;
    user_id_3 UUID;
BEGIN
    -- Get existing pilgrim user IDs from auth.users (same pattern as demo-users-simple.sql)
    SELECT id INTO user_id_1 FROM auth.users WHERE email = 'ramesh.pilgrim@demo.com';
    SELECT id INTO user_id_2 FROM auth.users WHERE email = 'sita.pilgrim@demo.com';
    SELECT id INTO user_id_3 FROM auth.users WHERE email = 'mohan.pilgrim@demo.com';
    
    -- Verify users exist
    IF user_id_1 IS NULL OR user_id_2 IS NULL OR user_id_3 IS NULL THEN
        RAISE EXCEPTION 'Demo pilgrim users not found. Please run demo-users-simple.sql first.';
    END IF;

    -- Now insert the flood of assistance requests using the actual user IDs
    INSERT INTO assistance_requests (user_id, type, title, description, priority, status, location, address) VALUES
    (user_id_1, 'medical', 'Elderly person feeling dizzy', 'My grandmother is feeling very dizzy and needs immediate medical attention near the main temple.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), 'Main Temple Complex'),
    (user_id_2, 'medical', 'Child with fever', 'My 8-year-old son has developed high fever. Need urgent medical help.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5720, 23.0230), 4326), 'Near Parking Area'),
    (user_id_3, 'medical', 'Diabetic emergency', 'Diabetic person needs immediate insulin. Blood sugar very low.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5710, 23.0220), 4326), 'Food Court Area'),
    (user_id_1, 'lost_person', 'Missing elderly mother', 'Lost my 70-year-old mother in the crowd. She was wearing a blue saree.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5715, 23.0235), 4326), 'Main Entrance Gate'),
    (user_id_2, 'lost_person', 'Missing child', 'My 6-year-old daughter is missing. She was wearing a red dress.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5718, 23.0228), 4326), 'Temple Courtyard'),
    (user_id_3, 'guidance', 'First time visitor guidance', 'First time visiting the temple. Need guidance about proper rituals.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), 'Information Center'),
    (user_id_1, 'guidance', 'Prayer timing information', 'Need information about special prayer timings and festivals.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5716, 23.0227), 4326), 'Temple Office'),
    (user_id_2, 'guidance', 'Wheelchair accessibility', 'Need guidance for wheelchair accessible routes.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5712, 23.0222), 4326), 'Accessibility Entrance'),
    (user_id_3, 'general', 'Need taxi to railway station', 'Urgent need for taxi. Train departure in 1 hour.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5725, 23.0240), 4326), 'Exit Gate B'),
    (user_id_1, 'general', 'Bus route information', 'Need information about bus routes to city center.', 'low', 'pending', ST_SetSRID(ST_MakePoint(72.5722, 23.0238), 4326), 'Bus Stop Area'),
    (user_id_2, 'general', 'Emergency night shelter', 'Missed last bus home. Need accommodation for family of 4.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5708, 23.0218), 4326), 'Guest House Area'),
    (user_id_3, 'general', 'Water for elderly group', 'Need drinking water for group of 15 elderly pilgrims.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5717, 23.0226), 4326), 'Rest Area'),
    (user_id_1, 'general', 'Lost mobile phone', 'Lost my mobile phone somewhere in the temple complex.', 'low', 'pending', ST_SetSRID(ST_MakePoint(72.5721, 23.0231), 4326), 'Security Office'),
    (user_id_2, 'medical', 'Chest pain emergency', 'Middle-aged man experiencing chest pain.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5709, 23.0219), 4326), 'Prayer Hall'),
    (user_id_3, 'lost_person', 'Missing teenager', 'My 16-year-old son is missing for last 20 minutes.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5724, 23.0234), 4326), 'Youth Activity Area'),
    (user_id_1, 'crowd_management', 'Emergency exit information', 'Large crowd gathering, need emergency exit info.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5716, 23.0226), 4326), 'Central Courtyard'),
    (user_id_2, 'emergency', 'Ambulance needed', 'Need ambulance for elderly person who fell.', 'high', 'pending', ST_SetSRID(ST_MakePoint(72.5711, 23.0221), 4326), 'Steps Area'),
    (user_id_3, 'guidance', 'Special needs assistance', 'Blind person needs guidance to navigate safely.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), 'Main Temple'),
    (user_id_1, 'general', 'Language interpreter', 'Foreign visitors need Hindi/English interpreter.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5718, 23.0228), 4326), 'Visitor Center'),
    (user_id_2, 'sanitation', 'Family with infant needs rest', 'Family with 3-month-old baby needs quiet place to rest and clean facilities.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5707, 23.0217), 4326), 'Mother-Child Rest Area');

    RAISE NOTICE 'Successfully created 20 assistance requests with user IDs: %, %, %', user_id_1, user_id_2, user_id_3;
END $$;
