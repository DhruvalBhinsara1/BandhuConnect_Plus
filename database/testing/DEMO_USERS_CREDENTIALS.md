# 🔑 BandhuConnect+ Demo Users Credentials

## 📧 Demo User Accounts

All demo accounts use the password: **`password123`**

### 👨‍⚕️ Volunteers (5 users)
| Email | Password | Role | Skills |
|-------|----------|------|--------|
| `dr.rajesh.medical@demo.com` | `password123` | Volunteer | Medical, First Aid, Emergency |
| `priya.guide@demo.com` | `password123` | Volunteer | Guidance, Translation, Crowd Management |
| `amit.security@demo.com` | `password123` | Volunteer | Security, Crowd Control, Emergency |
| `ravi.maintenance@demo.com` | `password123` | Volunteer | Maintenance, Technical Support |
| `sara.translator@demo.com` | `password123` | Volunteer | Translation, Language Support |

### 🙏 Pilgrims (8 users)
| Email | Password | Role | Profile |
|-------|----------|------|---------|
| `ramesh.elderly@demo.com` | `password123` | Pilgrim | Elderly person needing assistance |
| `sunita.family@demo.com` | `password123` | Pilgrim | Family with children |
| `mohan.lost@demo.com` | `password123` | Pilgrim | Frequently needs guidance |
| `geeta.foreign@demo.com` | `password123` | Pilgrim | International visitor |
| `vijay.emergency@demo.com` | `password123` | Pilgrim | Emergency contact scenarios |
| `kavita.disabled@demo.com` | `password123` | Pilgrim | Person with disabilities |
| `arjun.student@demo.com` | `password123` | Pilgrim | Student visitor |
| `lakshmi.group@demo.com` | `password123` | Pilgrim | Group coordinator |

### 👑 Admin
| Email | Password | Role |
|-------|----------|------|
| `admin@bandhuconnect.com` | `admin123` | Admin |

## 🏫 Demo Location: Parul University, Vadodara
All demo data is set up for **Parul University campus** with realistic requests and assignments.

## 📱 Testing Instructions

1. **Login** with any of the above credentials
2. **Switch roles** to test different user experiences:
   - **Volunteers**: Accept and complete assistance requests
   - **Pilgrims**: Create new assistance requests
   - **Admin**: Manage users and monitor system

3. **Location**: Demo users are positioned around Parul University campus
4. **Requests**: Pre-created assistance requests are available for testing

## 🚨 Important Notes

- ⚠️ **Test Environment Only**: These are demo credentials for development/testing
- 🔐 **Change in Production**: Never use these passwords in production
- 🗑️ **Cleanup Available**: Use cleanup scripts to remove demo data when needed
- 📍 **Geolocation**: All users positioned at Parul University coordinates

## 🛠️ Quick Setup Commands

To set up demo environment:
```sql
-- Run the main demo setup
\i database/testing/PARUL_UNIVERSITY_DEMO_SETUP.sql

-- Verify setup
\i database/testing/VERIFY_CLEANUP.sql
```

## 📁 File Structure
- `PARUL_UNIVERSITY_DEMO_SETUP.sql` - Main demo data setup
- `SCHEMA_COMPATIBLE_SETUP_GUIDE.md` - Step-by-step setup guide
- `AUTHENTICATION_DEMO_SETUP_GUIDE.md` - Auth setup instructions
- `VERIFY_CLEANUP.sql` - Verification and cleanup tools
