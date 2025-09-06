-- COMPLETE DEMO DATA SETUP WITH PROPER AUTH - BandhuConnect+ v2.1.0
-- This file creates demo accounts with proper Supabase authentication
-- Run this in Supabase SQL Editor to create a full demo environment

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

delete from auth.users
 where email like '%@demo.com'
    or email = 'admin@bandhuconnect.com';

-- =============================================================================
-- STEP 2: CREATE AUTH USERS WITH PROPER AUTHENTICATION
-- =============================================================================

-- Note: Each time this script runs, it will generate completely new random UUIDs
-- This ensures no predictable patterns like 11111111-1111-1111-1111-111111111111

-- Create auth users with properly hashed passwords and random UUIDs
insert into auth.users (
   instance_id,
   id,
   aud,
   role,
   email,
   encrypted_password,
   email_confirmed_at,
   confirmation_token,
   confirmation_sent_at,
   recovery_token,
   recovery_sent_at,
   email_change_token_new,
   email_change,
   email_change_sent_at,
   last_sign_in_at,
   raw_app_meta_data,
   raw_user_meta_data,
   is_super_admin,
   created_at,
   updated_at,
   phone,
   phone_confirmed_at,
   phone_change,
   phone_change_token,
   phone_change_sent_at,
   email_change_token_current,
   email_change_confirm_status,
   banned_until,
   reauthentication_token,
   reauthentication_sent_at,
   is_sso_user,
   deleted_at
) values 
-- VOLUNTEER ACCOUNTS
 ( '00000000-0000-0000-0000-000000000000',
           gen_random_uuid(),
           'authenticated',
           'authenticated',
           'dr.rajesh.medical@demo.com',
           crypt(
              'password123',
              gen_salt('bf')
           ),
           now(),
           '',
           now(),
           '',
           now(),
           '',
           '',
           now(),
           now(),
           '{"provider": "email", "providers": ["email"]}',
           '{"name": "Dr. Rajesh Patel"}',
           false,
           now(),
           now(),
           null,
           null,
           '',
           '',
           now(),
           '',
           0,
           now(),
           '',
           now(),
           false,
           null ),( '00000000-0000-0000-0000-000000000000',
                    gen_random_uuid(),
                    'authenticated',
                    'authenticated',
                    'priya.guide@demo.com',
                    crypt(
                       'password123',
                       gen_salt('bf')
                    ),
                    now(),
                    '',
                    now(),
                    '',
                    now(),
                    '',
                    '',
                    now(),
                    now(),
                    '{"provider": "email", "providers": ["email"]}',
                    '{"name": "Priya Sharma"}',
                    false,
                    now(),
                    now(),
                    null,
                    null,
                    '',
                    '',
                    now(),
                    '',
                    0,
                    now(),
                    '',
                    now(),
                    false,
                    null ),( '00000000-0000-0000-0000-000000000000',
                             gen_random_uuid(),
                             'authenticated',
                             'authenticated',
                             'amit.security@demo.com',
                             crypt(
                                'password123',
                                gen_salt('bf')
                             ),
                             now(),
                             '',
                             now(),
                             '',
                             now(),
                             '',
                             '',
                             now(),
                             now(),
                             '{"provider": "email", "providers": ["email"]}',
                             '{"name": "Amit Kumar"}',
                             false,
                             now(),
                             now(),
                             null,
                             null,
                             '',
                             '',
                             now(),
                             '',
                             0,
                             now(),
                             '',
                             now(),
                             false,
                             null ),( '00000000-0000-0000-0000-000000000000',
                                      gen_random_uuid(),
                                      'authenticated',
                                      'authenticated',
                                      'ravi.maintenance@demo.com',
                                      crypt(
                                         'password123',
                                         gen_salt('bf')
                                      ),
                                      now(),
                                      '',
                                      now(),
                                      '',
                                      now(),
                                      '',
                                      '',
                                      now(),
                                      now(),
                                      '{"provider": "email", "providers": ["email"]}',
                                      '{"name": "Ravi Singh"}',
                                      false,
                                      now(),
                                      now(),
                                      null,
                                      null,
                                      '',
                                      '',
                                      now(),
                                      '',
                                      0,
                                      now(),
                                      '',
                                      now(),
                                      false,
                                      null ),( '00000000-0000-0000-0000-000000000000',
                                               gen_random_uuid(),
                                               'authenticated',
                                               'authenticated',
                                               'sara.translator@demo.com',
                                               crypt(
                                                  'password123',
                                                  gen_salt('bf')
                                               ),
                                               now(),
                                               '',
                                               now(),
                                               '',
                                               now(),
                                               '',
                                               '',
                                               now(),
                                               now(),
                                               '{"provider": "email", "providers": ["email"]}',
                                               '{"name": "Sara Johnson"}',
                                               false,
                                               now(),
                                               now(),
                                               null,
                                               null,
                                               '',
                                               '',
                                               now(),
                                               '',
                                               0,
                                               now(),
                                               '',
                                               now(),
                                               false,
                                               null ),

-- PILGRIM ACCOUNTS
                                               ( '00000000-0000-0000-0000-000000000000',
                                                        gen_random_uuid(),
                                                        'authenticated',
                                                        'authenticated',
                                                        'ramesh.elderly@demo.com',
                                                        crypt(
                                                           'password123',
                                                           gen_salt('bf')
                                                        ),
                                                        now(),
                                                        '',
                                                        now(),
                                                        '',
                                                        now(),
                                                        '',
                                                        '',
                                                        now(),
                                                        now(),
                                                        '{"provider": "email", "providers": ["email"]}',
                                                        '{"name": "Ramesh Gupta"}',
                                                        false,
                                                        now(),
                                                        now(),
                                                        null,
                                                        null,
                                                        '',
                                                        '',
                                                        now(),
                                                        '',
                                                        0,
                                                        now(),
                                                        '',
                                                        now(),
                                                        false,
                                                        null ),( '00000000-0000-0000-0000-000000000000',
                                                                 gen_random_uuid(),
                                                                 'authenticated',
                                                                 'authenticated',
                                                                 'sunita.family@demo.com',
                                                                 crypt(
                                                                    'password123',
                                                                    gen_salt('bf')
                                                                 ),
                                                                 now(),
                                                                 '',
                                                                 now(),
                                                                 '',
                                                                 now(),
                                                                 '',
                                                                 '',
                                                                 now(),
                                                                 now(),
                                                                 '{"provider": "email", "providers": ["email"]}',
                                                                 '{"name": "Sunita Devi"}',
                                                                 false,
                                                                 now(),
                                                                 now(),
                                                                 null,
                                                                 null,
                                                                 '',
                                                                 '',
                                                                 now(),
                                                                 '',
                                                                 0,
                                                                 now(),
                                                                 '',
                                                                 now(),
                                                                 false,
                                                                 null ),( '00000000-0000-0000-0000-000000000000',
                                                                          gen_random_uuid(),
                                                                          'authenticated',
                                                                          'authenticated',
                                                                          'mohan.lost@demo.com',
                                                                          crypt(
                                                                             'password123',
                                                                             gen_salt('bf')
                                                                          ),
                                                                          now(),
                                                                          '',
                                                                          now(),
                                                                          '',
                                                                          now(),
                                                                          '',
                                                                          '',
                                                                          now(),
                                                                          now(),
                                                                          '{"provider": "email", "providers": ["email"]}',
                                                                          '{"name": "Mohan Prasad"}',
                                                                          false,
                                                                          now(),
                                                                          now(),
                                                                          null,
                                                                          null,
                                                                          '',
                                                                          '',
                                                                          now(),
                                                                          '',
                                                                          0,
                                                                          now(),
                                                                          '',
                                                                          now(),
                                                                          false,
                                                                          null ),( '00000000-0000-0000-0000-000000000000',
                                                                                   gen_random_uuid(),
                                                                                   'authenticated',
                                                                                   'authenticated',
                                                                                   'geeta.foreign@demo.com',
                                                                                   crypt(
                                                                                      'password123',
                                                                                      gen_salt('bf')
                                                                                   ),
                                                                                   now(),
                                                                                   '',
                                                                                   now(),
                                                                                   '',
                                                                                   now(),
                                                                                   '',
                                                                                   '',
                                                                                   now(),
                                                                                   now(),
                                                                                   '{"provider": "email", "providers": ["email"]}'
                                                                                   ,
                                                                                   '{"name": "Geeta Miller"}',
                                                                                   false,
                                                                                   now(),
                                                                                   now(),
                                                                                   null,
                                                                                   null,
                                                                                   '',
                                                                                   '',
                                                                                   now(),
                                                                                   '',
                                                                                   0,
                                                                                   now(),
                                                                                   '',
                                                                                   now(),
                                                                                   false,
                                                                                   null ),( '00000000-0000-0000-0000-000000000000'
                                                                                   ,
                                                                                            gen_random_uuid(),
                                                                                            'authenticated',
                                                                                            'authenticated',
                                                                                            'vijay.emergency@demo.com',
                                                                                            crypt(
                                                                                               'password123',
                                                                                               gen_salt('bf')
                                                                                            ),
                                                                                            now(),
                                                                                            '',
                                                                                            now(),
                                                                                            '',
                                                                                            now(),
                                                                                            '',
                                                                                            '',
                                                                                            now(),
                                                                                            now(),
                                                                                            '{"provider": "email", "providers": ["email"]}'
                                                                                            ,
                                                                                            '{"name": "Vijay Sharma"}',
                                                                                            false,
                                                                                            now(),
                                                                                            now(),
                                                                                            null,
                                                                                            null,
                                                                                            '',
                                                                                            '',
                                                                                            now(),
                                                                                            '',
                                                                                            0,
                                                                                            now(),
                                                                                            '',
                                                                                            now(),
                                                                                            false,
                                                                                            null ),( '00000000-0000-0000-0000-000000000000'
                                                                                            ,
                                                                                                     gen_random_uuid(),
                                                                                                     'authenticated',
                                                                                                     'authenticated',
                                                                                                     'kavita.disabled@demo.com'
                                                                                                     ,
                                                                                                     crypt(
                                                                                                        'password123',
                                                                                                        gen_salt('bf')
                                                                                                     ),
                                                                                                     now(),
                                                                                                     '',
                                                                                                     now(),
                                                                                                     '',
                                                                                                     now(),
                                                                                                     '',
                                                                                                     '',
                                                                                                     now(),
                                                                                                     now(),
                                                                                                     '{"provider": "email", "providers": ["email"]}'
                                                                                                     ,
                                                                                                     '{"name": "Kavita Patel"}'
                                                                                                     ,
                                                                                                     false,
                                                                                                     now(),
                                                                                                     now(),
                                                                                                     null,
                                                                                                     null,
                                                                                                     '',
                                                                                                     '',
                                                                                                     now(),
                                                                                                     '',
                                                                                                     0,
                                                                                                     now(),
                                                                                                     '',
                                                                                                     now(),
                                                                                                     false,
                                                                                                     null ),( '00000000-0000-0000-0000-000000000000'
                                                                                                     ,
                                                                                                              gen_random_uuid
                                                                                                              (),
                                                                                                              'authenticated'
                                                                                                              ,
                                                                                                              'authenticated'
                                                                                                              ,
                                                                                                              'arjun.student@demo.com'
                                                                                                              ,
                                                                                                              crypt(
                                                                                                                 'password123'
                                                                                                                 ,
                                                                                                                 gen_salt('bf'
                                                                                                                 )
                                                                                                              ),
                                                                                                              now(),
                                                                                                              '',
                                                                                                              now(),
                                                                                                              '',
                                                                                                              now(),
                                                                                                              '',
                                                                                                              '',
                                                                                                              now(),
                                                                                                              now(),
                                                                                                              '{"provider": "email", "providers": ["email"]}'
                                                                                                              ,
                                                                                                              '{"name": "Arjun Thakur"}'
                                                                                                              ,
                                                                                                              false,
                                                                                                              now(),
                                                                                                              now(),
                                                                                                              null,
                                                                                                              null,
                                                                                                              '',
                                                                                                              '',
                                                                                                              now(),
                                                                                                              '',
                                                                                                              0,
                                                                                                              now(),
                                                                                                              '',
                                                                                                              now(),
                                                                                                              false,
                                                                                                              null ),( '00000000-0000-0000-0000-000000000000'
                                                                                                              ,
                                                                                                                       gen_random_uuid
                                                                                                                       (),
                                                                                                                       'authenticated'
                                                                                                                       ,
                                                                                                                       'authenticated'
                                                                                                                       ,
                                                                                                                       'lakshmi.group@demo.com'
                                                                                                                       ,
                                                                                                                       crypt(
                                                                                                                          'password123'
                                                                                                                          ,
                                                                                                                          gen_salt
                                                                                                                          ('bf'
                                                                                                                          )
                                                                                                                       ),
                                                                                                                       now(),
                                                                                                                       '',
                                                                                                                       now(),
                                                                                                                       '',
                                                                                                                       now(),
                                                                                                                       '',
                                                                                                                       '',
                                                                                                                       now(),
                                                                                                                       now(),
                                                                                                                       '{"provider": "email", "providers": ["email"]}'
                                                                                                                       ,
                                                                                                                       '{"name": "Lakshmi Devi"}'
                                                                                                                       ,
                                                                                                                       false,
                                                                                                                       now(),
                                                                                                                       now(),
                                                                                                                       null,
                                                                                                                       null,
                                                                                                                       '',
                                                                                                                       '',
                                                                                                                       now(),
                                                                                                                       '',
                                                                                                                       0,
                                                                                                                       now(),
                                                                                                                       '',
                                                                                                                       now(),
                                                                                                                       false,
                                                                                                                       null )
                                                                                                                       ,

-- ADMIN ACCOUNT
                                                                                                                       ( '00000000-0000-0000-0000-000000000000'
                                                                                                                       ,
                                                                                                                            gen_random_uuid
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            'authenticated'
                                                                                                                            ,
                                                                                                                            'authenticated'
                                                                                                                            ,
                                                                                                                            'admin@bandhuconnect.com'
                                                                                                                            ,
                                                                                                                            crypt
                                                                                                                            (
                                                                                                                               'admin123'
                                                                                                                               ,
                                                                                                                               gen_salt
                                                                                                                               (
                                                                                                                               'bf'
                                                                                                                               )
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            ''
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            ''
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            ''
                                                                                                                            ,
                                                                                                                            ''
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            '{"provider": "email", "providers": ["email"]}'
                                                                                                                            ,
                                                                                                                            '{"name": "Admin User"}'
                                                                                                                            ,
                                                                                                                            false
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            null
                                                                                                                            ,
                                                                                                                            null
                                                                                                                            ,
                                                                                                                            ''
                                                                                                                            ,
                                                                                                                            ''
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            ''
                                                                                                                            ,
                                                                                                                            0
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            ''
                                                                                                                            ,
                                                                                                                            now
                                                                                                                            (
                                                                                                                            )
                                                                                                                            ,
                                                                                                                            false
                                                                                                                            ,
                                                                                                                            null
                                                                                                                            )
                                                                                                                            ;

-- =============================================================================
-- STEP 3: CREATE PROFILES WITH MATCHING AUTH.USERS IDS
-- =============================================================================

-- Create profiles using the auth.users ids (they are automatically linked)
insert into profiles (
   id,
   name,
   email,
   phone,
   role,
   skills,
   volunteer_status,
   is_active,
   location,
   address
)
   select au.id,
          case au.email
             when 'dr.rajesh.medical@demo.com' then
                'Dr. Rajesh Patel'
             when 'priya.guide@demo.com'       then
                'Priya Sharma'
             when 'amit.security@demo.com'     then
                'Amit Kumar'
             when 'ravi.maintenance@demo.com'  then
                'Ravi Singh'
             when 'sara.translator@demo.com'   then
                'Sara Johnson'
             when 'ramesh.elderly@demo.com'    then
                'Ramesh Gupta'
             when 'sunita.family@demo.com'     then
                'Sunita Devi'
             when 'mohan.lost@demo.com'        then
                'Mohan Prasad'
             when 'geeta.foreign@demo.com'     then
                'Geeta Miller'
             when 'vijay.emergency@demo.com'   then
                'Vijay Sharma'
             when 'kavita.disabled@demo.com'   then
                'Kavita Patel'
             when 'arjun.student@demo.com'     then
                'Arjun Thakur'
             when 'lakshmi.group@demo.com'     then
                'Lakshmi Devi'
             when 'admin@bandhuconnect.com'    then
                'Admin User'
          end as name,
          au.email,
          case au.email
             when 'dr.rajesh.medical@demo.com' then
                '+91-9123456701'
             when 'priya.guide@demo.com'       then
                '+91-9123456702'
             when 'amit.security@demo.com'     then
                '+91-9123456703'
             when 'ravi.maintenance@demo.com'  then
                '+91-9123456704'
             when 'sara.translator@demo.com'   then
                '+91-9123456705'
             when 'ramesh.elderly@demo.com'    then
                '+91-9123456706'
             when 'sunita.family@demo.com'     then
                '+91-9123456707'
             when 'mohan.lost@demo.com'        then
                '+91-9123456708'
             when 'geeta.foreign@demo.com'     then
                '+91-9123456709'
             when 'vijay.emergency@demo.com'   then
                '+91-9123456710'
             when 'kavita.disabled@demo.com'   then
                '+91-9123456711'
             when 'arjun.student@demo.com'     then
                '+91-9123456712'
             when 'lakshmi.group@demo.com'     then
                '+91-9123456713'
             when 'admin@bandhuconnect.com'    then
                '+91-9123456700'
          end as phone,
          case
             when au.email in ( 'dr.rajesh.medical@demo.com',
                                'priya.guide@demo.com',
                                'amit.security@demo.com',
                                'ravi.maintenance@demo.com',
                                'sara.translator@demo.com' ) then
                cast('volunteer' as user_role)
             when au.email = 'admin@bandhuconnect.com' then
                cast('admin' as user_role)
             else
                cast('pilgrim' as user_role)
          end as role,
          case au.email
             when 'dr.rajesh.medical@demo.com' then
                array['medical',
                'first_aid','emergency']
             when 'priya.guide@demo.com'       then
                array['guidance',
                'translation','crowd_management']
             when 'amit.security@demo.com'     then
                array['security',
                'crowd_management','emergency']
             when 'ravi.maintenance@demo.com'  then
                array['sanitation',
                'maintenance','general']
             when 'sara.translator@demo.com'   then
                array['guidance',
                'translation','lost_person']
             else
                null
          end as skills,
          case
             when au.email in ( 'dr.rajesh.medical@demo.com',
                                'priya.guide@demo.com',
                                'amit.security@demo.com',
                                'ravi.maintenance@demo.com',
                                'sara.translator@demo.com' ) then
                cast('available' as volunteer_status)
             else
                cast('offline' as volunteer_status)
          end as volunteer_status,
          true as is_active,
          case au.email
             when 'dr.rajesh.medical@demo.com' then
                st_geogfromtext('POINT(77.2088 28.6142)')
             when 'priya.guide@demo.com'       then
                st_geogfromtext('POINT(77.2098 28.6138)')
             when 'amit.security@demo.com'     then
                st_geogfromtext('POINT(77.2092 28.6148)')
             when 'ravi.maintenance@demo.com'  then
                st_geogfromtext('POINT(77.2075 28.6125)')
             when 'sara.translator@demo.com'   then
                st_geogfromtext('POINT(77.2105 28.6135)')
             when 'ramesh.elderly@demo.com'    then
                st_geogfromtext('POINT(77.2090 28.6139)')
             when 'sunita.family@demo.com'     then
                st_geogfromtext('POINT(77.2100 28.6150)')
             when 'mohan.lost@demo.com'        then
                st_geogfromtext('POINT(77.2080 28.6120)')
             when 'geeta.foreign@demo.com'     then
                st_geogfromtext('POINT(77.2110 28.6160)')
             when 'vijay.emergency@demo.com'   then
                st_geogfromtext('POINT(77.2070 28.6130)')
             when 'kavita.disabled@demo.com'   then
                st_geogfromtext('POINT(77.2095 28.6145)')
             when 'arjun.student@demo.com'     then
                st_geogfromtext('POINT(77.2085 28.6135)')
             when 'lakshmi.group@demo.com'     then
                st_geogfromtext('POINT(77.2105 28.6155)')
             when 'admin@bandhuconnect.com'    then
                st_geogfromtext('POINT(77.2090 28.6140)')
          end as location,
          case au.email
             when 'dr.rajesh.medical@demo.com' then
                'Medical Station A, Kumbh Mela'
             when 'priya.guide@demo.com'       then
                'Information Desk, Main Gate'
             when 'amit.security@demo.com'     then
                'Security Post 1, Kumbh Mela'
             when 'ravi.maintenance@demo.com'  then
                'Sanitation Unit, Sector 5'
             when 'sara.translator@demo.com'   then
                'International Help Desk'
             when 'ramesh.elderly@demo.com'    then
                'Gate 3, Kumbh Mela Grounds'
             when 'sunita.family@demo.com'     then
                'Main Temple Area, Kumbh Mela'
             when 'mohan.lost@demo.com'        then
                'Sector 7, Public Area'
             when 'geeta.foreign@demo.com'     then
                'Information Center, Kumbh Mela'
             when 'vijay.emergency@demo.com'   then
                'Bathing Ghat 2, River Bank'
             when 'kavita.disabled@demo.com'   then
                'Near Main Ceremony Ground'
             when 'arjun.student@demo.com'     then
                'Lost & Found Center'
             when 'lakshmi.group@demo.com'     then
                'Medical Tent Area'
             when 'admin@bandhuconnect.com'    then
                'Admin Control Center'
          end as address
     from auth.users au
    where au.email like '%@demo.com'
       or au.email = 'admin@bandhuconnect.com';

-- =============================================================================
-- STEP 4: CREATE USER LOCATIONS FOR REAL-TIME TRACKING
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
                28.6142
             when 'priya.guide@demo.com'       then
                28.6138
             when 'amit.security@demo.com'     then
                28.6148
             when 'ravi.maintenance@demo.com'  then
                28.6125
             when 'sara.translator@demo.com'   then
                28.6135
             when 'ramesh.elderly@demo.com'    then
                28.6139
             when 'sunita.family@demo.com'     then
                28.6150
             when 'mohan.lost@demo.com'        then
                28.6120
             when 'geeta.foreign@demo.com'     then
                28.6160
             when 'vijay.emergency@demo.com'   then
                28.6130
             when 'kavita.disabled@demo.com'   then
                28.6145
             when 'arjun.student@demo.com'     then
                28.6135
             when 'lakshmi.group@demo.com'     then
                28.6155
          end as latitude,
          case p.email
             when 'dr.rajesh.medical@demo.com' then
                77.2088
             when 'priya.guide@demo.com'       then
                77.2098
             when 'amit.security@demo.com'     then
                77.2092
             when 'ravi.maintenance@demo.com'  then
                77.2075
             when 'sara.translator@demo.com'   then
                77.2105
             when 'ramesh.elderly@demo.com'    then
                77.2090
             when 'sunita.family@demo.com'     then
                77.2100
             when 'mohan.lost@demo.com'        then
                77.2080
             when 'geeta.foreign@demo.com'     then
                77.2110
             when 'vijay.emergency@demo.com'   then
                77.2070
             when 'kavita.disabled@demo.com'   then
                77.2095
             when 'arjun.student@demo.com'     then
                77.2085
             when 'lakshmi.group@demo.com'     then
                77.2105
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
-- STEP 5: CREATE REALISTIC ASSISTANCE REQUESTS
-- =============================================================================

insert into assistance_requests (
   id,
   user_id,
   type,
   title,
   description,
   priority,
   status,
   location,
   address,
   estimated_duration,
   created_at
)
   select gen_random_uuid(),
          p.id,
          cast('medical' as request_type),
          'Elderly person needs medical assistance',
          'My grandfather is feeling dizzy and needs immediate medical attention near Gate 3',
          cast('high' as priority_level),
          cast('pending' as request_status),
          st_geogfromtext('POINT(77.2090 28.6139)'),
          'Gate 3, Kumbh Mela Grounds',
          30,
          now() - interval '5' minute
     from profiles p
    where p.email = 'ramesh.elderly@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('lost_person' as request_type),
          'Lost child - urgent help needed',
          'My 8-year-old son got separated from our group near the main temple. He is wearing a red shirt and blue shorts. Please help!'
          ,
          cast('high' as priority_level),
          cast('pending' as request_status),
          st_geogfromtext('POINT(77.2100 28.6150)'),
          'Main Temple Area, Kumbh Mela',
          45,
          now() - interval '3' minute
     from profiles p
    where p.email = 'sunita.family@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('sanitation' as request_type),
          'Toilet facilities blocked',
          'The public toilet near Sector 7 is completely blocked and overflowing. Urgent cleaning needed.',
          cast('medium' as priority_level),
          cast('pending' as request_status),
          st_geogfromtext('POINT(77.2080 28.6120)'),
          'Sector 7, Public Toilet Block',
          60,
          now() - interval '10' minute
     from profiles p
    where p.email = 'mohan.lost@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('guidance' as request_type),
          'Need directions to accommodation',
          'We are foreign visitors and cannot find our allocated accommodation. Need someone who speaks English to guide us.'
          ,
          cast('medium' as priority_level),
          cast('pending' as request_status),
          st_geogfromtext('POINT(77.2110 28.6160)'),
          'Information Center, Kumbh Mela',
          20,
          now() - interval '7' minute
     from profiles p
    where p.email = 'geeta.foreign@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('crowd_management' as request_type),
          'Overcrowding at bathing ghat',
          'There is dangerous overcrowding at Ghat 2. People are getting pushed and someone might get hurt.',
          cast('high' as priority_level),
          cast('pending' as request_status),
          st_geogfromtext('POINT(77.2070 28.6130)'),
          'Bathing Ghat 2, River Bank',
          90,
          now() - interval '2' minute
     from profiles p
    where p.email = 'vijay.emergency@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('general' as request_type),
          'Wheelchair assistance needed',
          'I am in a wheelchair and need help navigating through the crowd to reach the main ceremony area.',
          cast('medium' as priority_level),
          cast('pending' as request_status),
          st_geogfromtext('POINT(77.2095 28.6145)'),
          'Near Main Ceremony Ground',
          40,
          now() - interval '8' minute
     from profiles p
    where p.email = 'kavita.disabled@demo.com'
   union all

-- COMPLETED REQUESTS (for statistics and success rate testing)
   select gen_random_uuid(),
          p.id,
          cast('guidance' as request_type),
          'Found lost belongings',
          'Someone helped me find my lost bag with important documents. Thank you!',
          cast('low' as priority_level),
          cast('completed' as request_status),
          st_geogfromtext('POINT(77.2085 28.6135)'),
          'Lost & Found Center',
          15,
          now() - interval '2' hour
     from profiles p
    where p.email = 'arjun.student@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('medical' as request_type),
          'First aid provided',
          'Volunteer provided excellent first aid when my friend fainted. Very grateful!',
          cast('medium' as priority_level),
          cast('completed' as request_status),
          st_geogfromtext('POINT(77.2105 28.6155)'),
          'Medical Tent Area',
          25,
          now() - interval '4' hour
     from profiles p
    where p.email = 'lakshmi.group@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('guidance' as request_type),
          'Directions provided successfully',
          'Volunteer helped us find our way to the parking area. Very helpful and polite.',
          cast('low' as priority_level),
          cast('completed' as request_status),
          st_geogfromtext('POINT(77.2095 28.6140)'),
          'Parking Area B',
          10,
          now() - interval '6' hour
     from profiles p
    where p.email = 'sunita.family@demo.com'
   union all
   select gen_random_uuid(),
          p.id,
          cast('general' as request_type),
          'Food assistance provided',
          'Volunteer helped elderly family member get food from distribution center.',
          cast('medium' as priority_level),
          cast('completed' as request_status),
          st_geogfromtext('POINT(77.2088 28.6145)'),
          'Food Distribution Center',
          20,
          now() - interval '3' hour
     from profiles p
    where p.email = 'mohan.lost@demo.com';

-- =============================================================================
-- STEP 6: CREATE ASSIGNMENTS FOR SUCCESS RATE TESTING
-- =============================================================================

-- Create assignments for completed requests
insert into assignments (
   id,
   request_id,
   volunteer_id,
   assigned_at,
   status
)
   select gen_random_uuid(),
          ar.id,
          (
             select id
               from profiles
              where email = 'priya.guide@demo.com'
          ),
          ar.created_at + interval '5' minute,
          cast('completed' as assignment_status)
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
          cast('completed' as assignment_status)
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
          cast('completed' as assignment_status)
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
          cast('completed' as assignment_status)
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

select 'Authentication Users Created' as category,
       count(*) as count
  from auth.users
 where email like '%@demo.com'
    or email = 'admin@bandhuconnect.com'
union all
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

-- Show demo account credentials
select 'DEMO LOGIN CREDENTIALS' as info,
       'All demo accounts use password: password123' as password_info,
       'Admin account uses password: admin123' as admin_info;

-- Verify all users have proper random UUIDs (not sequential)
select email,
       id,
       case
          when cast(id as text) like '%1111%' then
             'Sequential UUID Found!'
          else
             'Random UUID'
       end as uuid_status,
       email_confirmed_at is not null as is_confirmed
  from auth.users
 where email like '%@demo.com'
    or email = 'admin@bandhuconnect.com'
 order by email;