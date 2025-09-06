# Database Setup and Management Guide

**BandhuConnect+ v2.1.0 - Updated September 6, 2025**

## 🎯 Current Database Status

✅ **PRODUCTION READY** - Clean, organized, and fully functional  
✅ **Schema Validated** - All tables, foreign keys, and constraints working  
✅ **Demo Data Ready** - Parul University focused scenarios available  
✅ **Personal Accounts Preserved** - Admin and pilgrim accounts maintained

## 📁 Updated Folder Structure

```
database/
├── testing/
│   ├── PARUL_UNIVERSITY_DEMO_SETUP.sql    # ✅ CURRENT: Demo setup for Parul University
│   ├── SELECTIVE_CLEANUP.sql              # ✅ CURRENT: Clean unwanted accounts safely
│   ├── VERIFY_CLEANUP.sql                 # ✅ CURRENT: Verify database state
│   ├── INSPECT_DATABASE_SCHEMA.sql        # ✅ CURRENT: Analyze database structure
│   └── *.sql                              # Legacy test scripts (archived)
├── schema/
│   ├── current-schema.sql                 # Current production database schema
│   └── consolidated-schema.sql            # Consolidated schema definitions
├── functions/
│   └── *.sql                              # Database functions and procedures
├── maintenance/
│   └── *.sql                              # Maintenance and cleanup scripts
└── archive/
    └── *.sql                              # Legacy/outdated scripts
```

---

## 🏗️ Database Architecture

### **Core Tables**

- **`profiles`** - User profiles (references `auth.users`)
- **`assistance_requests`** - Help requests with PostGIS location
- **`assignments`** - Volunteer assignments
- **`user_locations`** - Real-time location tracking

### **Authentication System**

- **`auth.users`** - Managed by Supabase Auth
- **`profiles`** - Custom user data (foreign key to auth.users)
- **No custom users table** - Uses Supabase's built-in auth

### **Foreign Key Structure**

```sql
profiles.id -> auth.users.id
assistance_requests.user_id -> profiles.id
assignments.volunteer_id -> profiles.id
assignments.request_id -> assistance_requests.id
user_locations.user_id -> profiles.id
```

---

## 📊 Current Schema

### **Enum Types**

- `user_role`: volunteer, admin, pilgrim
- `request_type`: medical, emergency, general, guidance, lost_person, sanitation, crowd_management
- `request_status`: pending, assigned, in_progress, completed, cancelled
- `priority_level`: low, medium, high
- `volunteer_status`: available, busy, offline
- `assignment_status`: pending, accepted, in_progress, completed, cancelled

### **Key Columns**

- **profiles.location** - PostGIS geometry field
- **profiles.skills** - Text array for volunteer skills
- **assistance_requests.location** - PostGIS geometry for request location
- **user_locations.latitude/longitude** - Separate coordinate fields

---

## 🎭 Demo Environment

### **Active Demo Accounts**

| Email                          | Name             | Role      | Purpose               |
| ------------------------------ | ---------------- | --------- | --------------------- |
| `dhruvalbhinsara460@gmail.com` | Dhruval Bhinsara | admin     | Your admin account    |
| `dhruvalbhinsara000@gmail.com` | Dhruval Bhinsara | pilgrim   | Your pilgrim account  |
| `dr.rajesh.medical@demo.com`   | Dr. Rajesh Patel | volunteer | Medical specialist    |
| `priya.guide@demo.com`         | Priya Sharma     | volunteer | Guide/translator      |
| `amit.security@demo.com`       | Amit Kumar       | volunteer | Security specialist   |
| `ravi.maintenance@demo.com`    | Ravi Singh       | volunteer | Maintenance worker    |
| `sara.translator@demo.com`     | Sara Johnson     | volunteer | International support |
| `ramesh.elderly@demo.com`      | Ramesh Gupta     | pilgrim   | Elderly user          |
| `sunita.family@demo.com`       | Sunita Devi      | pilgrim   | Family with children  |
| `mohan.lost@demo.com`          | Mohan Prasad     | pilgrim   | General user          |

### **Demo Scenarios (Parul University)**

1. **Medical Emergency** - Elderly person needs help at medical center
2. **Lost Child** - Urgent help needed near university library
3. **Sanitation Issue** - Restroom facilities at Engineering Block
4. **Navigation Help** - International students need hostel directions
5. **Crowd Management** - Overcrowding at campus canteen
6. **Completed Cases** - For testing success metrics

### **Parul University Coordinates**

- **Main Campus**: 22.2587, 72.7794
- **All demo locations within 1km radius**
- **Real-world coordinates for testing GPS features**

---

## 👥 Account Management

### **Personal Accounts (Preserved)**

- **Admin**: `dhruvalbhinsara460@gmail.com`
- **Pilgrim**: `dhruvalbhinsara000@gmail.com`

### **Demo Accounts (Active)**

- All `@demo.com` accounts with auth.users integration
- Realistic names and roles for testing
- Positioned around Parul University campus

### **Account Creation Process**

1. Create user in Supabase Auth Dashboard
2. User profile automatically created via app signup flow
3. Or manually create profile referencing auth.users ID

---

## 🔧 Maintenance Scripts

### **Current Active Scripts**

| Script                            | Purpose                    | Status              |
| --------------------------------- | -------------------------- | ------------------- |
| `PARUL_UNIVERSITY_DEMO_SETUP.sql` | Create demo environment    | ✅ Ready to use     |
| `SELECTIVE_CLEANUP.sql`           | Clean unwanted accounts    | ✅ Successfully run |
| `VERIFY_CLEANUP.sql`              | Verify database state      | ✅ Available        |
| `INSPECT_DATABASE_SCHEMA.sql`     | Analyze database structure | ✅ Available        |

### **Safe Operations**

```sql
-- Always verify before cleanup
\i VERIFY_CLEANUP.sql

-- Inspect schema changes
\i INSPECT_DATABASE_SCHEMA.sql

-- Create demo data
\i PARUL_UNIVERSITY_DEMO_SETUP.sql
```

---

## 🚨 Status: ALL ISSUES RESOLVED

### **Previous Issues - FIXED**

❌ **Foreign key constraint violations** - ✅ Fixed by using actual auth.users  
❌ **Column doesn't exist errors** - ✅ Fixed by using real schema structure  
❌ **Enum casting errors** - ✅ Fixed by using correct enum types  
❌ **Orphaned data** - ✅ Fixed by proper cleanup sequence

### **Current Status - ALL GOOD**

✅ **Schema compatible** - All scripts match actual database  
✅ **Foreign keys working** - Proper auth.users integration  
✅ **No orphaned data** - Clean relationships maintained  
✅ **Demo data functional** - Ready for testing

---

## 📈 Database Metrics

### **Current Counts**

- **Profiles**: ~12 (2 personal + ~10 demo)
- **User Locations**: ~12 (matching active users)
- **Assistance Requests**: ~15 (including completed)
- **Assignments**: ~2 (for testing success rates)

### **Health Checks**

- ✅ No orphaned records
- ✅ All foreign keys valid
- ✅ Enum types consistent
- ✅ PostGIS locations valid

---

**Last Updated**: September 6, 2025  
**Database Version**: PostgreSQL with PostGIS  
**Supabase Project**: BandhuConnect+ Production  
**Status**: ✅ Production Ready
