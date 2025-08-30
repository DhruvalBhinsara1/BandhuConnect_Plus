-- Fix ALL volunteer skills to use only valid enum values
-- Valid enum values: crowd_management, emergency, general, guidance, lost_person, medical, sanitation

UPDATE profiles 
SET skills = CASE email
    -- Demo volunteers (already mostly fixed)
    WHEN 'amit.volunteer@demo.com' THEN ARRAY['sanitation', 'general']
    WHEN 'raj.volunteer@demo.com' THEN ARRAY['medical', 'general']
    WHEN 'priya.volunteer@demo.com' THEN ARRAY['guidance', 'crowd_management']
    WHEN 'sneha.volunteer@demo.com' THEN ARRAY['lost_person', 'general']
    
    -- Fix other volunteers with invalid skills
    WHEN 'amit.tech@volunteer.com' THEN ARRAY['general', 'guidance']
    WHEN 'arjun.multi@volunteer.com' THEN ARRAY['medical', 'emergency', 'general']
    WHEN 'priya.sharma@volunteer.com' THEN ARRAY['general', 'guidance']
    WHEN 'kavita.hygiene@volunteer.com' THEN ARRAY['guidance', 'general']
    WHEN 'meera.crowd@volunteer.com' THEN ARRAY['guidance', 'crowd_management']
    WHEN 'mohan.clean@volunteer.com' THEN ARRAY['sanitation', 'general']
    WHEN 'rajesh.kumar@volunteer.com' THEN ARRAY['lost_person', 'crowd_management', 'general']
    WHEN 'pooja.versatile@volunteer.com' THEN ARRAY['general', 'guidance']
    WHEN 'ravi.helper@volunteer.com' THEN ARRAY['general', 'guidance']
    WHEN 'sneha.it@volunteer.com' THEN ARRAY['guidance', 'general']
    WHEN 'sunita.guide@volunteer.com' THEN ARRAY['guidance', 'general']
    WHEN 'vikram.singh@volunteer.com' THEN ARRAY['medical', 'emergency', 'general']
    
    ELSE skills -- Keep existing skills for any others
END,
volunteer_status = 'available', -- Make all available for testing
is_active = true
WHERE role = 'volunteer';

-- Verify the fix
SELECT name, email, skills, volunteer_status, is_active
FROM profiles 
WHERE role = 'volunteer' 
ORDER BY name;
