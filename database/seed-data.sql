-- BandhuConnect+ Seed Data
-- Sample data for testing and development

-- Insert sample admin user (you'll need to create this user in Supabase Auth first)
-- Replace with actual UUID from auth.users after creating the user
INSERT INTO profiles (id, name, email, phone, role, location) VALUES
('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@bandhuconnect.com', '+919913238080', 'admin', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326));

-- Insert sample volunteers
INSERT INTO profiles (id, name, email, phone, role, skills, volunteer_status, location, rating, total_ratings) VALUES
('00000000-0000-0000-0000-000000000002', 'Raj Patel', 'raj.patel@example.com', '+919876543210', 'volunteer', ARRAY['transportation', 'guidance'], 'available', ST_SetSRID(ST_MakePoint(72.5800, 23.0300), 4326), 4.5, 20),
('00000000-0000-0000-0000-000000000003', 'Priya Sharma', 'priya.sharma@example.com', '+919876543211', 'volunteer', ARRAY['medical', 'food'], 'available', ST_SetSRID(ST_MakePoint(72.5750, 23.0250), 4326), 4.8, 35),
('00000000-0000-0000-0000-000000000004', 'Amit Kumar', 'amit.kumar@example.com', '+919876543212', 'volunteer', ARRAY['accommodation', 'general'], 'busy', ST_SetSRID(ST_MakePoint(72.5650, 23.0350), 4326), 4.2, 15),
('00000000-0000-0000-0000-000000000005', 'Sneha Joshi', 'sneha.joshi@example.com', '+919876543213', 'volunteer', ARRAY['transportation', 'emergency'], 'available', ST_SetSRID(ST_MakePoint(72.5900, 23.0200), 4326), 4.7, 28),
('00000000-0000-0000-0000-000000000006', 'Vikram Singh', 'vikram.singh@example.com', '+919876543214', 'volunteer', ARRAY['guidance', 'general'], 'offline', ST_SetSRID(ST_MakePoint(72.5600, 23.0400), 4326), 4.3, 12);

-- Insert sample pilgrims
INSERT INTO profiles (id, name, email, phone, role, location) VALUES
('00000000-0000-0000-0000-000000000007', 'Ramesh Gupta', 'ramesh.gupta@example.com', '+919876543215', 'pilgrim', ST_SetSRID(ST_MakePoint(72.5720, 23.0280), 4326)),
('00000000-0000-0000-0000-000000000008', 'Sita Devi', 'sita.devi@example.com', '+919876543216', 'pilgrim', ST_SetSRID(ST_MakePoint(72.5680, 23.0320), 4326)),
('00000000-0000-0000-0000-000000000009', 'Mohan Lal', 'mohan.lal@example.com', '+919876543217', 'pilgrim', ST_SetSRID(ST_MakePoint(72.5820, 23.0180), 4326));

-- Insert sample assistance requests
INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, address) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'transportation', 'Need ride to temple', 'Looking for transportation from railway station to main temple. Have heavy luggage.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5720, 23.0280), 4326), 'Ahmedabad Railway Station'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000008', 'medical', 'First aid assistance', 'Elderly person needs basic medical assistance, feeling dizzy.', 'high', 'assigned', ST_SetSRID(ST_MakePoint(72.5680, 23.0320), 4326), 'Near Main Temple Gate'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000009', 'food', 'Food for family', 'Need vegetarian food for family of 4, including children.', 'medium', 'in_progress', ST_SetSRID(ST_MakePoint(72.5820, 23.0180), 4326), 'Pilgrim Rest Area'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 'guidance', 'Temple tour guide', 'First time visitor, need guidance about temple rituals and timings.', 'low', 'completed', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), 'Main Temple Complex'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000008', 'accommodation', 'Temporary shelter', 'Need temporary accommodation for tonight, budget friendly.', 'medium', 'pending', ST_SetSRID(ST_MakePoint(72.5750, 23.0300), 4326), 'Near Bus Stand');

-- Insert sample assignments
INSERT INTO assignments (id, request_id, volunteer_id, status, assigned_at, accepted_at, started_at, completed_at, rating, feedback) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'accepted', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '25 minutes', NULL, NULL, NULL, NULL),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'in_progress', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '45 minutes', NULL, NULL, NULL),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'completed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 50 minutes', NOW() - INTERVAL '1 hour 40 minutes', NOW() - INTERVAL '30 minutes', 5, 'Excellent service, very helpful and knowledgeable!');

-- Insert sample chat channels
INSERT INTO chat_channels (id, name, type, request_id, created_by) VALUES
('30000000-0000-0000-0000-000000000001', 'General Help', 'general', NULL, '00000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000002', 'Emergency Support', 'emergency', NULL, '00000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000003', 'Medical Request Chat', 'request_specific', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000008');

-- Insert sample chat messages
INSERT INTO chat_messages (channel_id, sender_id, content, message_type) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Welcome to BandhuConnect+ general help channel!', 'text'),
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hello everyone, ready to help pilgrims today!', 'text'),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008', 'I need medical assistance, feeling dizzy', 'text'),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'I am on my way, please stay calm. ETA 5 minutes.', 'text');

-- Insert sample direct messages
INSERT INTO direct_messages (sender_id, receiver_id, content, message_type) VALUES
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Hi, can you help me with transportation?', 'text'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'Sure! I can pick you up. Where are you located?', 'text');

-- Insert sample location updates
INSERT INTO location_updates (user_id, location, accuracy, speed) VALUES
('00000000-0000-0000-0000-000000000002', ST_SetSRID(ST_MakePoint(72.5800, 23.0300), 4326), 5.0, 0.0),
('00000000-0000-0000-0000-000000000003', ST_SetSRID(ST_MakePoint(72.5750, 23.0250), 4326), 3.0, 15.5),
('00000000-0000-0000-0000-000000000004', ST_SetSRID(ST_MakePoint(72.5650, 23.0350), 4326), 4.0, 8.2);

-- Insert sample notifications
INSERT INTO notifications (user_id, title, body, type, data) VALUES
('00000000-0000-0000-0000-000000000007', 'Request Assigned', 'Your transportation request has been assigned to Raj Patel', 'request_assigned', '{"request_id": "10000000-0000-0000-0000-000000000001", "volunteer_id": "00000000-0000-0000-0000-000000000002"}'),
('00000000-0000-0000-0000-000000000002', 'New Request Available', 'New transportation request near your location', 'new_request', '{"request_id": "10000000-0000-0000-0000-000000000001"}'),
('00000000-0000-0000-0000-000000000008', 'Help is on the way', 'Priya Sharma is coming to assist you with medical help', 'volunteer_assigned', '{"assignment_id": "20000000-0000-0000-0000-000000000001"}');
