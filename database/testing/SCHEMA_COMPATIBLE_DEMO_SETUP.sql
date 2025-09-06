-- CORRECTED DEMO DATA SETUP - BandhuConnect+ v2.1.0
-- This file creates demo accounts compatible with your current database schema
-- Run this in Supabase SQL Editor to create a full demo environment

-- =============================================================================
-- IMPORTANT NOTE: SUPABASE AUTH + PROFILES SETUP
-- =============================================================================
-- This script creates profiles that reference Supabase's auth.users table.
-- Since we cannot directly create auth.users entries via SQL, this script
-- creates standalone profiles for demo purposes.
-- 
-- SIMPLE SETUP:
-- 1. Run this script in Supabase SQL Editor
-- 2. Demo environment will be immediately ready for testing
-- 3. All locations are set around Parul University campus
-- 
-- NOTE: In production, users would be created via Supabase Auth API

-- =============================================================================
-- STEP 1: CLEAN UP EXISTING DEMO DATA
-- =============================================================================

-- Clean up any existing demo data first
delete from user_locations
 where user_id in (
   select id
     from profiles
    where email like '%@demo.com'
       or email = 'admin@bandhuconnect.com'
);

delete from assignments
 where request_id in (
   select id
     from assistance_requests
    where user_id in (
      select id
        from profiles
       where email like '%@demo.com'
          or email = 'admin@bandhuconnect.com'
   )
);

delete from assistance_requests
 where user_id in (
   select id
     from profiles
    where email like '%@demo.com'
       or email = 'admin@bandhuconnect.com'
);

delete from profiles
 where email like '%@demo.com'
    or email = 'admin@bandhuconnect.com';

-- =============================================================================
-- STEP 2: CREATE DEMO PROFILES (standalone for demo purposes)
-- =============================================================================

-- Insert demo profiles with specific UUIDs for demo purposes
-- In production, these would reference actual auth.users entries
insert into profiles (
   id,
   name,
   email,
   phone,
   role,
   volunteer_status,
   is_active
) values

-- VOLUNTEER PROFILES
 ( '11111111-1111-1111-1111-111111111101',
           'Dr. Rajesh Patel',
           'dr.rajesh.medical@demo.com',
           '+91-9123456701',
           cast('volunteer' as user_role),
           cast('available' as volunteer_status),
           true ),( '11111111-1111-1111-1111-111111111102',
                    'Priya Sharma',
                    'priya.guide@demo.com',
                    '+91-9123456702',
                    cast('volunteer' as user_role),
                    cast('available' as volunteer_status),
                    true ),( '11111111-1111-1111-1111-111111111103',
                             'Amit Kumar',
                             'amit.security@demo.com',
                             '+91-9123456703',
                             cast('volunteer' as user_role),
                             cast('available' as volunteer_status),
                             true ),( '11111111-1111-1111-1111-111111111104',
                                      'Ravi Singh',
                                      'ravi.maintenance@demo.com',
                                      '+91-9123456704',
                                      cast('volunteer' as user_role),
                                      cast('available' as volunteer_status),
                                      true ),( '11111111-1111-1111-1111-111111111105',
                                               'Sara Johnson',
                                               'sara.translator@demo.com',
                                               '+91-9123456705',
                                               cast('volunteer' as user_role),
                                               cast('available' as volunteer_status),
                                               true ),

-- PILGRIM PROFILES
                                               ( '11111111-1111-1111-1111-111111111106',
                                                        'Ramesh Gupta',
                                                        'ramesh.elderly@demo.com',
                                                        '+91-9123456706',
                                                        cast('pilgrim' as user_role),
                                                        cast('offline' as volunteer_status),
                                                        true ),( '11111111-1111-1111-1111-111111111107',
                                                                 'Sunita Devi',
                                                                 'sunita.family@demo.com',
                                                                 '+91-9123456707',
                                                                 cast('pilgrim' as user_role),
                                                                 cast('offline' as volunteer_status),
                                                                 true ),( '11111111-1111-1111-1111-111111111108',
                                                                          'Mohan Prasad',
                                                                          'mohan.lost@demo.com',
                                                                          '+91-9123456708',
                                                                          cast('pilgrim' as user_role),
                                                                          cast('offline' as volunteer_status),
                                                                          true ),( '11111111-1111-1111-1111-111111111109',
                                                                                   'Geeta Miller',
                                                                                   'geeta.foreign@demo.com',
                                                                                   '+91-9123456709',
                                                                                   cast('pilgrim' as user_role),
                                                                                   cast('offline' as volunteer_status),
                                                                                   true ),( '11111111-1111-1111-1111-111111111110'
                                                                                   ,
                                                                                            'Vijay Sharma',
                                                                                            'vijay.emergency@demo.com',
                                                                                            '+91-9123456710',
                                                                                            cast('pilgrim' as user_role),
                                                                                            cast('offline' as volunteer_status
                                                                                            ),
                                                                                            true ),( '11111111-1111-1111-1111-111111111111'
                                                                                            ,
                                                                                                     'Kavita Patel',
                                                                                                     'kavita.disabled@demo.com'
                                                                                                     ,
                                                                                                     '+91-9123456711',
                                                                                                     cast('pilgrim' as user_role
                                                                                                     ),
                                                                                                     cast('offline' as volunteer_status
                                                                                                     ),
                                                                                                     true ),( '11111111-1111-1111-1111-111111111112'
                                                                                                     ,
                                                                                                              'Arjun Thakur',
                                                                                                              'arjun.student@demo.com'
                                                                                                              ,
                                                                                                              '+91-9123456712'
                                                                                                              ,
                                                                                                              cast('pilgrim' as
                                                                                                              user_role),
                                                                                                              cast('offline' as
                                                                                                              volunteer_status
                                                                                                              ),
                                                                                                              true ),( '11111111-1111-1111-1111-111111111113'
                                                                                                              ,
                                                                                                                       'Lakshmi Devi'
                                                                                                                       ,
                                                                                                                       'lakshmi.group@demo.com'
                                                                                                                       ,
                                                                                                                       '+91-9123456713'
                                                                                                                       ,
                                                                                                                       cast('pilgrim'
                                                                                                                       as user_role
                                                                                                                       ),
                                                                                                                       cast('offline'
                                                                                                                       as volunteer_status
                                                                                                                       ),
                                                                                                                       true )
                                                                                                                       ,

-- ADMIN PROFILE
                                                                                                                       ( '11111111-1111-1111-1111-111111111100'
                                                                                                                       ,
                                                                                                                            'Admin User'
                                                                                                                            ,
                                                                                                                            'admin@bandhuconnect.com'
                                                                                                                            ,
                                                                                                                            '+91-9123456700'
                                                                                                                            ,
                                                                                                                            cast
                                                                                                                            (
                                                                                                                            'admin'
                                                                                                                            as
                                                                                                                            user_role
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            cast
                                                                                                                            (
                                                                                                                            'offline'
                                                                                                                            as
                                                                                                                            volunteer_status
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            true
                                                                                                                            )
                                                                                                                            ;

-- =============================================================================
-- STEP 3: CREATE USER LOCATIONS FOR REAL-TIME TRACKING
-- =============================================================================

insert into user_locations (
   user_id,
   latitude,
   longitude,
   accuracy,
   is_active,
   last_updated
)
   select p.id,
          case p.email
             when 'dr.rajesh.medical@demo.com' then
                22.2587
             when 'priya.guide@demo.com'       then
                22.2577
             when 'amit.security@demo.com'     then
                22.2597
             when 'ravi.maintenance@demo.com'  then
                22.2567
             when 'sara.translator@demo.com'   then
                22.2607
             when 'ramesh.elderly@demo.com'    then
                22.2590
             when 'sunita.family@demo.com'     then
                22.2580
             when 'mohan.lost@demo.com'        then
                22.2593
             when 'geeta.foreign@demo.com'     then
                22.2570
             when 'vijay.emergency@demo.com'   then
                22.2600
             when 'kavita.disabled@demo.com'   then
                22.2585
             when 'arjun.student@demo.com'     then
                22.2582
             when 'lakshmi.group@demo.com'     then
                22.2588
          end as latitude,
          case p.email
             when 'dr.rajesh.medical@demo.com' then
                72.7794
             when 'priya.guide@demo.com'       then
                72.7804
             when 'amit.security@demo.com'     then
                72.7784
             when 'ravi.maintenance@demo.com'  then
                72.7814
             when 'sara.translator@demo.com'   then
                72.7774
             when 'ramesh.elderly@demo.com'    then
                72.7790
             when 'sunita.family@demo.com'     then
                72.7800
             when 'mohan.lost@demo.com'        then
                72.7788
             when 'geeta.foreign@demo.com'     then
                72.7810
             when 'vijay.emergency@demo.com'   then
                72.7780
             when 'kavita.disabled@demo.com'   then
                72.7795
             when 'arjun.student@demo.com'     then
                72.7798
             when 'lakshmi.group@demo.com'     then
                72.7792
          end as longitude,
          case p.email
             when 'dr.rajesh.medical@demo.com' then
                5.0
             when 'priya.guide@demo.com'       then
                4.0
             when 'amit.security@demo.com'     then
                3.0
             when 'ravi.maintenance@demo.com'  then
                6.0
             when 'sara.translator@demo.com'   then
                4.5
             when 'ramesh.elderly@demo.com'    then
                8.0
             when 'sunita.family@demo.com'     then
                7.0
             when 'mohan.lost@demo.com'        then
                9.0
             when 'geeta.foreign@demo.com'     then
                5.0
             when 'vijay.emergency@demo.com'   then
                9.0
             when 'kavita.disabled@demo.com'   then
                7.5
             when 'arjun.student@demo.com'     then
                6.0
             when 'lakshmi.group@demo.com'     then
                5.5
          end as accuracy,
          true as is_active,
          now() as last_updated
     from profiles p
    where p.email like '%@demo.com';

-- =============================================================================
-- STEP 4: CREATE REALISTIC ASSISTANCE REQUESTS
-- =============================================================================

insert into assistance_requests (
   id,
   user_id,
   type,
   title,
   description,
   priority,
   status,
   location_latitude,
   location_longitude,
   location_description,
   created_at
)
   select gen_random_uuid(),
          p.id,
          cast('medical' as request_type),
          'Elderly person needs medical assistance',
          'My grandfather is feeling dizzy and needs immediate medical attention near Parul University campus',
          cast('high' as priority_level),
          cast('pending' as request_status),
          22.2587, -- Parul University Main Gate latitude
          72.7794, -- Parul University Main Gate longitude  
          'Parul University Main Gate, Vadodara',
          now() - interval '5' minute
     from profiles p
    where p.email = 'ramesh.elderly@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('emergency' as request_type),
          'Lost child - urgent help needed',
          'My 8-year-old son got separated from our group near the campus library. He is wearing a red shirt and blue shorts. Please help!'
          ,
          cast('high' as priority_level),
          cast('pending' as request_status),
          22.2597, -- Near University Library latitude
          72.7784, -- Near University Library longitude
          'Library Area, Parul University',
          now() - interval '3' minute
     from profiles p
    where p.email = 'sunita.family@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('general' as request_type),
          'Campus facilities need attention',
          'The restroom near the engineering block is out of order and needs urgent repair.',
          cast('medium' as priority_level),
          cast('pending' as request_status),
          22.2577, -- Engineering Block area latitude
          72.7804, -- Engineering Block area longitude
          'Engineering Block, Parul University',
          now() - interval '10' minute
     from profiles p
    where p.email = 'mohan.lost@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('navigation' as request_type),
          'Need directions to hostel accommodation',
          'We are new students and cannot find our allocated hostel. Need someone to guide us from the main campus.',
          cast('medium' as priority_level),
          cast('pending' as request_status),
          22.2567, -- Campus hostel area latitude
          72.7814, -- Campus hostel area longitude
          'Student Information Center, Parul University',
          now() - interval '7' minute
     from profiles p
    where p.email = 'geeta.foreign@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('emergency' as request_type),
          'Overcrowding at campus canteen',
          'There is dangerous overcrowding at the main canteen during lunch hour. Someone might get hurt.',
          cast('urgent' as priority_level),
          cast('pending' as request_status),
          22.2607, -- Campus canteen area latitude
          72.7774, -- Campus canteen area longitude
          'Main Canteen, Parul University',
          now() - interval '2' minute
     from profiles p
    where p.email = 'vijay.emergency@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('general' as request_type),
          'Wheelchair assistance needed',
          'I am in a wheelchair and need help navigating through the campus to reach the auditorium for the event.',
          cast('medium' as priority_level),
          cast('pending' as request_status),
          22.2590, -- Near campus auditorium latitude
          72.7790, -- Near campus auditorium longitude
          'Near Main Auditorium, Parul University',
          now() - interval '8' minute
     from profiles p
    where p.email = 'kavita.disabled@demo.com'
   union all

-- COMPLETED REQUESTS (for statistics and success rate testing)
   select gen_random_uuid(),
          p.id,
          cast('navigation' as request_type),
          'Found lost belongings',
          'Someone helped me find my lost bag with important documents near the campus security office. Thank you!',
          cast('low' as priority_level),
          cast('completed' as request_status),
          22.2582, -- Campus security office latitude
          72.7798, -- Campus security office longitude
          'Security Office, Parul University',
          now() - interval '2' hour
     from profiles p
    where p.email = 'arjun.student@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('medical' as request_type),
          'First aid provided',
          'Volunteer provided excellent first aid when my friend fainted near the sports complex. Very grateful!',
          cast('medium' as priority_level),
          cast('completed' as request_status),
          22.2588, -- Sports complex area latitude
          72.7792, -- Sports complex area longitude
          'Sports Complex, Parul University',
          now() - interval '4' hour
     from profiles p
    where p.email = 'lakshmi.group@demo.com';

-- =============================================================================
-- STEP 5: CREATE ASSIGNMENTS FOR SUCCESS RATE TESTING
-- =============================================================================

-- Create assignments for completed requests
insert into assignments (
   id,
   request_id,
   volunteer_id,
   assigned_at,
   status,
   completed_at
)
   select gen_random_uuid(),
          ar.id,
          (
             select id
               from profiles
              where email = 'priya.guide@demo.com'
          ),
          ar.created_at + interval '5' minute,
          cast('completed' as assignment_status),
          ar.created_at + interval '20' minute
     from assistance_requests ar
     join profiles p
   on ar.user_id = p.id
    where p.email = 'arjun.student@demo.com'
      and ar.status = cast('completed' as request_status)
   union all
   select gen_random_uuid(),
          ar.id,
          (
             select id
               from profiles
              where email = 'dr.rajesh.medical@demo.com'
          ),
          ar.created_at + interval '3' minute,
          cast('completed' as assignment_status),
          ar.created_at + interval '28' minute
     from assistance_requests ar
     join profiles p
   on ar.user_id = p.id
    where p.email = 'lakshmi.group@demo.com'
      and ar.status = cast('completed' as request_status)
   union all
   select gen_random_uuid(),
          ar.id,
          (
             select id
               from profiles
              where email = 'priya.guide@demo.com'
          ),
          ar.created_at + interval '2' minute,
          cast('completed' as assignment_status),
          ar.created_at + interval '12' minute
     from assistance_requests ar
     join profiles p
   on ar.user_id = p.id
    where p.email = 'sunita.family@demo.com'
      and ar.status = cast('completed' as request_status)
   union all
   select gen_random_uuid(),
          ar.id,
          (
             select id
               from profiles
              where email = 'ravi.maintenance@demo.com'
          ),
          ar.created_at + interval '4' minute,
          cast('completed' as assignment_status),
          ar.created_at + interval '24' minute
     from assistance_requests ar
     join profiles p
   on ar.user_id = p.id
    where p.email = 'mohan.lost@demo.com'
      and ar.status = cast('completed' as request_status);

-- =============================================================================
-- VERIFICATION AND SUCCESS CONFIRMATION
-- =============================================================================

-- Display summary of created demo data
select 'DEMO SETUP COMPLETED SUCCESSFULLY!' as status;

select 'Profiles Created' as category,
       count(*) as count
  from profiles
 where email like '%@demo.com'
    or email = 'admin@bandhuconnect.com'
union all
select 'User Locations Created' as category,
       count(*) as count
  from user_locations ul
  join profiles p
on ul.user_id = p.id
 where p.email like '%@demo.com'
union all
select 'Assistance Requests Created' as category,
       count(*) as count
  from assistance_requests ar
  join profiles p
on ar.user_id = p.id
 where p.email like '%@demo.com'
union all
select 'Assignments Created' as category,
       count(*) as count
  from assignments a
  join assistance_requests ar
on a.request_id = ar.id
  join profiles p
on ar.user_id = p.id
 where p.email like '%@demo.com';

-- Show demo account information
select 'DEMO ACCOUNT SETUP NOTES' as info,
       'Profiles created but need auth.users to be linked' as auth_note,
       'Create auth users manually in Supabase Auth dashboard' as next_step;

-- Show created profiles
select email,
       name,
       role,
       volunteer_status,
       user_id as auth_user_id_needed
  from profiles
 where email like '%@demo.com'
    or email = 'admin@bandhuconnect.com'
 order by role,
          email;