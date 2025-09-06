# 🚀 BandhuConnect+ Database Setup Guide

**Version:** 2.0.0  
**Last Updated:** September 6, 2025  
**Environment:** Production Ready

## 📋 Overview

Complete guide for setting up the BandhuConnect+ database from scratch. This guide covers schema deployment, function installation, demo data setup, and verification procedures.

---

## 🏗️ Setup Sequence

### **Step 1: Schema Setup**

```sql
-- Run the production schema
\i schema/production-schema.sql
```

**What this does:**

- ✅ Creates all required tables and relationships
- ✅ Sets up enum types (user_role, request_type, etc.)
- ✅ Configures PostGIS for location services
- ✅ Implements Row Level Security (RLS) policies
- ✅ Creates necessary indexes for performance

### **Step 2: Functions Deployment**

```sql
-- Deploy production-ready functions
\i functions/professional-functions.sql
```

**What this does:**

- ✅ Location-based assignment functions
- ✅ Automated notification triggers
- ✅ Data validation functions
- ✅ Analytics and reporting functions

### **Step 3: Demo Data (Optional)**

```sql
-- Create demo environment
\i demo/generic-demo-setup.sql
```

**What this does:**

- ✅ Creates sample users (admin, volunteers, pilgrims)
- ✅ Generates realistic service requests
- ✅ Sets up demo assignments and locations
- ✅ Uses general location terms (adaptable to any venue)

### **Step 4: Verification**

```sql
-- Verify setup
\i database-health-check.sql
```

**What this does:**

- ✅ Checks schema integrity
- ✅ Verifies data relationships
- ✅ Tests security policies
- ✅ Provides performance metrics

---

## 🔧 Environment Configuration

### **Required Extensions**

```sql
-- PostGIS for location services
CREATE EXTENSION IF NOT EXISTS postgis;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Additional utilities
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

### **Environment Variables**

```bash
# Database connection
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=bandhuconnect
DB_USER=your-database-user
DB_PASSWORD=your-secure-password

# Application settings
APP_ENV=production
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 🛡️ Security Configuration

### **Row Level Security (RLS)**

All tables have RLS enabled with policies for:

- ✅ **Profiles:** Users can only view/edit their own profile
- ✅ **Requests:** Pilgrims see their requests, volunteers see assigned ones
- ✅ **Assignments:** Only assigned volunteers and admins can access
- ✅ **Notifications:** Users see only their notifications
- ✅ **Feedback:** Restricted to request participants

### **Admin Access**

```sql
-- Create admin user (use secure-admin-creation.sql template)
-- Replace placeholders with actual values
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
    gen_random_uuid(),
    'admin@yourdomain.com',
    crypt('secure_password', gen_salt('bf')),
    NOW()
);
```

---

## 📍 Location Configuration

### **PostGIS Setup**

The database uses PostGIS for:

- ✅ **Geospatial queries** (finding nearby volunteers)
- ✅ **Distance calculations** (optimal assignment logic)
- ✅ **Location indexing** (fast proximity searches)

### **Location Data Format**

```sql
-- Example location insertion
INSERT INTO locations (name, coordinates, type) VALUES (
    'Main Campus',
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
    'campus'
);
```

---

## 🔄 Maintenance Procedures

### **Regular Health Checks**

```sql
-- Weekly verification
\i database-health-check.sql
```

### **Demo Data Cleanup**

```sql
-- Remove demo/test data
\i cleanup-demo-data.sql
```

### **Performance Optimization**

```sql
-- Update table statistics
ANALYZE;

-- Reindex if needed
REINDEX DATABASE bandhuconnect;
```

---

## 🚨 Troubleshooting

### **Common Issues**

**Schema Errors:**

- ✅ Ensure PostgreSQL 12+ with PostGIS extension
- ✅ Check user permissions for schema creation
- ✅ Verify extension installation

**Function Deployment:**

- ✅ Run schema setup before functions
- ✅ Check for naming conflicts
- ✅ Verify function dependencies

**Demo Data Issues:**

- ✅ Ensure schema and functions are deployed first
- ✅ Check foreign key constraints
- ✅ Verify enum value compatibility

**Performance Issues:**

- ✅ Run ANALYZE after data insertion
- ✅ Check index usage with EXPLAIN
- ✅ Monitor PostGIS spatial queries

---

## 📊 Verification Checklist

### **Schema Verification ✅**

- [ ] All 5 main tables created
- [ ] Foreign key constraints active
- [ ] Enum types properly defined
- [ ] PostGIS extension loaded
- [ ] RLS policies enabled

### **Functions Verification ✅**

- [ ] Auto-assignment function working
- [ ] Location search function active
- [ ] Notification triggers firing
- [ ] Analytics functions available

### **Security Verification ✅**

- [ ] RLS policies tested
- [ ] Admin user can access all data
- [ ] Regular users see only their data
- [ ] No sensitive information exposed

### **Performance Verification ✅**

- [ ] Spatial indexes created
- [ ] Query performance acceptable
- [ ] No missing indexes reported
- [ ] Statistics up to date

---

## 🎯 Quick Start Commands

### **Complete Fresh Setup**

```bash
# 1. Connect to database
psql -h localhost -U postgres -d bandhuconnect

# 2. Run complete setup sequence
\i schema/production-schema.sql
\i functions/professional-functions.sql
\i demo/generic-demo-setup.sql
\i database-health-check.sql
```

### **Production Deployment**

```bash
# 1. Schema only (no demo data)
\i schema/production-schema.sql
\i functions/professional-functions.sql

# 2. Create admin user
\i supabase/secure-admin-creation.sql

# 3. Verify deployment
\i database-health-check.sql
```

---

## 📈 Success Metrics

After successful setup, you should see:

- ✅ **0 schema errors** in health check
- ✅ **All tables** reporting proper record counts
- ✅ **RLS policies** active and tested
- ✅ **Admin user** successfully created
- ✅ **Demo data** (if applicable) properly inserted

---

**Result:** Your BandhuConnect+ database is now ready for production use! 🚀
