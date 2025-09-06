-- COMPLETE DATABASE SCHEMA INSPECTION - SINGLE JSON OUTPUT
-- Run this in Supabase SQL Editor to get ALL database info in one JSON result
-- Copy the entire JSON output and share it - no need for multiple queries!

SELECT jsonb_build_object(
    'database_inspection_timestamp', NOW(),
    'database_info', jsonb_build_object(
        'all_tables', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'schema', schemaname,
                    'table', tablename,
                    'owner', tableowner
                )
            )
            FROM pg_tables 
            WHERE schemaname = 'public'
        ),
        
        'table_structures', jsonb_build_object(
            'profiles', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'column_name', column_name,
                        'data_type', data_type,
                        'is_nullable', is_nullable,
                        'column_default', column_default,
                        'character_maximum_length', character_maximum_length
                    ) ORDER BY ordinal_position
                )
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'profiles'
            ),
            'user_locations', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'column_name', column_name,
                        'data_type', data_type,
                        'is_nullable', is_nullable,
                        'column_default', column_default,
                        'character_maximum_length', character_maximum_length
                    ) ORDER BY ordinal_position
                )
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'user_locations'
            ),
            'assistance_requests', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'column_name', column_name,
                        'data_type', data_type,
                        'is_nullable', is_nullable,
                        'column_default', column_default,
                        'character_maximum_length', character_maximum_length
                    ) ORDER BY ordinal_position
                )
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'assistance_requests'
            ),
            'assignments', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'column_name', column_name,
                        'data_type', data_type,
                        'is_nullable', is_nullable,
                        'column_default', column_default,
                        'character_maximum_length', character_maximum_length
                    ) ORDER BY ordinal_position
                )
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'assignments'
            )
        ),
        
        'foreign_keys', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'table_name', tc.table_name,
                    'column_name', kcu.column_name,
                    'foreign_table_name', ccu.table_name,
                    'foreign_column_name', ccu.column_name,
                    'constraint_name', tc.constraint_name
                )
            )
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
        ),
        
        'enum_types', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'enum_name', t.typname,
                    'enum_value', e.enumlabel
                )
            )
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
        ),
        
        'existing_data_samples', jsonb_build_object(
            'profiles', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'name', name,
                        'email', email,
                        'phone', phone,
                        'role', role,
                        'volunteer_status', volunteer_status,
                        'is_active', is_active,
                        'created_at', created_at
                    )
                )
                FROM (SELECT * FROM profiles LIMIT 10) p
            ),
            'user_locations', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'user_id', user_id,
                        'latitude', latitude,
                        'longitude', longitude,
                        'accuracy', accuracy,
                        'is_active', is_active,
                        'last_updated', last_updated
                    )
                )
                FROM (SELECT * FROM user_locations LIMIT 5) ul
            ),
            'assistance_requests', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'user_id', user_id,
                        'type', type,
                        'title', title,
                        'priority', priority,
                        'status', status,
                        'created_at', created_at
                    )
                )
                FROM (SELECT * FROM assistance_requests LIMIT 5) ar
            ),
            'assignments', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'request_id', request_id,
                        'volunteer_id', volunteer_id,
                        'assigned_at', assigned_at,
                        'status', status,
                        'completed_at', completed_at
                    )
                )
                FROM (SELECT * FROM assignments LIMIT 5) a
            )
        ),
        
        'auth_users_sample', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'email', email,
                    'email_confirmed_at', email_confirmed_at,
                    'created_at', created_at
                )
            )
            FROM (SELECT * FROM auth.users LIMIT 5) au
        ),
        
        'table_row_counts', jsonb_build_object(
            'profiles', (SELECT COUNT(*) FROM profiles),
            'user_locations', (SELECT COUNT(*) FROM user_locations),
            'assistance_requests', (SELECT COUNT(*) FROM assistance_requests),
            'assignments', (SELECT COUNT(*) FROM assignments)
        ),
        
        'profiles_foreign_key_details', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'constraint_name', conname,
                    'constraint_type', contype,
                    'referenced_table', confrelid::regclass::text,
                    'column_name', a.attname,
                    'referenced_column', af.attname
                )
            )
            FROM pg_constraint c
            JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
            JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
            WHERE c.conrelid = 'profiles'::regclass AND c.contype = 'f'
        )
    )
) as complete_database_schema;
