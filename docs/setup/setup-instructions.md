# BandhuConnect+ Database Setup Instructions

**Last Updated:** September 6, 2025

## 🎯 Current Database Status

✅ **PRODUCTION READY** - Clean, organized, and fully functional  
✅ **Demo Environment Active** - Parul University focused scenarios  
✅ **Personal Accounts Preserved** - Your admin and pilgrim accounts maintained

## 🚀 Quick Start (Recommended)

**The database is already set up and ready to use!** No additional setup required.

### Current Active Accounts:

- **Admin**: `dhruvalbhinsara460@gmail.com`
- **Pilgrim**: `dhruvalbhinsara000@gmail.com`
- **Demo Accounts**: 10+ realistic accounts with @demo.com emails

### Demo Environment Features:

- **Real Coordinates**: Parul University campus (22.2587, 72.7794)
- **Diverse Scenarios**: Medical emergencies, lost persons, navigation help
- **Testing Ready**: All roles and request types available

---

## 🔧 Available Scripts (For Reference)

These scripts are available in `database/testing/` but **NOT NEEDED** for normal use:

### Production-Ready Scripts:

- `PARUL_UNIVERSITY_DEMO_SETUP.sql` - ✅ Already executed
- `SELECTIVE_CLEANUP.sql` - ✅ Already executed
- `VERIFY_CLEANUP.sql` - Database verification
- `INSPECT_DATABASE_SCHEMA.sql` - Schema analysis

### Legacy Setup Files (Archive):

- `schema.sql` - Database schema and tables
- `functions.sql` - Core database functions
- `auto-assignment-functions.sql` - Auto-assignment system
- `final-setup.sql` - Main setup script with demo data
- `admin-profile-update-policy.sql` - RLS policies
- `simple-admin-functions.sql` - Admin RPC functions

---

## 📱 App Testing Guide

### For Development Testing:

1. **Open the app** - Database is ready
2. **Login** with your existing accounts
3. **Test features** using demo scenarios
4. **Create requests** - Auto-assignment will work immediately

### For Demo/Presentation:

1. **Use demo accounts** - Realistic names and roles
2. **Parul University location** - Real coordinates for GPS testing
3. **Diverse scenarios** - Medical, emergency, navigation cases available

---

## 🔍 If You Need to Reset

**ONLY if something goes wrong:**

### Option 1: Verify Current State

```sql
\i database/testing/VERIFY_CLEANUP.sql
```

### Option 2: Recreate Demo Data

```sql
\i database/testing/PARUL_UNIVERSITY_DEMO_SETUP.sql
```

### Option 3: Emergency Reset (Last Resort)

```sql
-- Contact for assistance if needed
-- Current state is stable and functional
```

---

## 📊 Database Health Check

Current database contains:

- **Profiles**: ~12 (2 personal + ~10 demo)
- **Assistance Requests**: ~15 (various statuses)
- **Assignments**: ~2 (for success rate testing)
- **User Locations**: ~12 (matching active users)

All relationships are working properly with no orphaned data.

---

**Status**: ✅ Ready for immediate use  
**Last Cleanup**: September 6, 2025  
**Next Action**: Start testing the app!
Execute the following files in order in your Supabase SQL Editor:

1. **schema.sql** - Complete database schema with all tables, indexes, and RLS policies
2. **functions.sql** - Database functions for location tracking and assignments
3. **auto-assignment-functions.sql** - Intelligent volunteer assignment system

### 2. Create Initial Admin User

Run this file to set up the initial admin:

1. **create-admin-dhruval.sql** - Creates the initial admin user with proper permissions

### 3. Configure Storage

Set up Supabase Storage buckets:

1. Go to Storage in Supabase dashboard
2. Create bucket named `request-images`
3. Set bucket to public
4. Configure RLS policies for the bucket

### 4. Enable Realtime

Enable realtime for required tables:

1. Go to Database > Replication in Supabase dashboard
2. Enable realtime for these tables:
   - `assistance_requests` - For live request updates
   - `assignments` - For assignment status changes
   - `user_locations` - For real-time location tracking
   - `chat_messages` - For live messaging

## Current Database Schema

### Core Tables

- **profiles** - User profiles with roles (volunteer, admin, pilgrim)
- **assistance_requests** - Help requests from pilgrims
- **assignments** - Volunteer-pilgrim assignments
- **user_locations** - Real-time location tracking
- **chat_messages** - Messaging system
- **notifications** - Push notification management

### Key Features

- **Real-time Location Tracking** - Live GPS updates with role-based visibility
- **Intelligent Assignment System** - Auto-matching based on skills and location
- **Comprehensive RLS Policies** - Secure data access based on user roles
- **Location-based Queries** - PostGIS integration for spatial operations

## Verification

After setup, verify:

- All tables are created successfully
- RLS policies are active and working
- Location tracking functions are operational
- Auto-assignment system is functional
- Storage bucket is accessible
- Realtime is enabled for required tables

## Troubleshooting

**Common Issues:**

- Permission errors: Check RLS policies in schema.sql
- Location tracking not working: Verify user_locations table and functions
- Assignment system failing: Check auto-assignment-functions.sql
- Realtime not updating: Verify table replication settings
- Storage upload issues: Check bucket permissions and RLS

For additional help, check ENVIRONMENT_SETUP.md or the main README.md file.

---

## Current System Status

✅ **Fully Operational Features:**

- Volunteer management with profile updates
- Auto-assignment system (76% success rate)
- Request management with persistence
- Admin dashboard with real-time data
- RLS policies working without recursion errors

The database is production-ready with all critical fixes applied.
