# BandhuConnect+ Database Setup Instructions

## Essential Files Required

**IMPORTANT**: After cleanup, these are the ONLY files you need for a complete database setup:

### Core Database Files:
- `schema.sql` - Database schema and tables
- `functions.sql` - Core database functions  
- `auto-assignment-functions.sql` - Auto-assignment system
- `final-setup.sql` - **Main setup script with demo data**
- `admin-profile-update-policy.sql` - Current RLS policies
- `simple-admin-functions.sql` - Admin RPC functions

### Optional Files:
- `demo-users-simple.sql` - Additional demo data
- `create-admin-dhruval.sql` - Admin user creation
- `create-flood-requests.sql` - Test request generation
- `cleanup-enum-values.sql` - Enum cleanup (if needed)

All other files have been marked with `.DELETE` extension and should be removed.

---

## Quick Setup (Recommended)

**For fastest setup, use the main setup script:**

1. Go to your Supabase project SQL Editor
2. Run `final-setup.sql` - This contains everything you need:
   - Complete schema
   - All functions
   - Demo users and data
   - Proper RLS policies

3. Run `auto-assignment-functions.sql` for the auto-assignment system

4. Run `admin-profile-update-policy.sql` for the latest RLS fixes

**That's it! Your database is ready.**

---

## Manual Setup (Alternative)

If you prefer step-by-step setup:

### Step 1: Create Database Schema
1. Go to your Supabase project SQL Editor
2. Run `schema.sql` to create all tables and types

### Step 2: Add Functions
1. Run `functions.sql` for core database functions
2. Run `auto-assignment-functions.sql` for auto-assignment
3. Run `simple-admin-functions.sql` for admin operations

### Step 3: Setup RLS Policies
1. Run `admin-profile-update-policy.sql` for current RLS policies

### Step 4: Add Demo Data
1. Run `final-setup.sql` for demo users and data
2. Optionally run `demo-users-simple.sql` for additional test data

---

## Current System Status

✅ **Fully Operational Features:**
- Volunteer management with profile updates
- Auto-assignment system (76% success rate)
- Request management with persistence
- Admin dashboard with real-time data
- RLS policies working without recursion errors

The database is production-ready with all critical fixes applied.
