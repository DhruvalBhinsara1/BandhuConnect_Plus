# Create Demo Accounts for BandhuConnect+

Since Supabase requires proper authentication signup, you'll need to create these accounts through the signup process. Here are two approaches:

## Option 1: Manual Signup (Recommended)

Use your app's signup functionality to create these accounts:

### Volunteer Accounts:
1. **Dr. Rajesh Patel** - `dr.rajesh.medical@demo.com` | `password123`
2. **Priya Sharma** - `priya.guide@demo.com` | `password123`  
3. **Amit Kumar** - `amit.security@demo.com` | `password123`
4. **Sneha Joshi** - `sneha.translator@demo.com` | `password123`
5. **Ravi Mehta** - `ravi.maintenance@demo.com` | `password123`

### Pilgrim Accounts:
1. **Ramesh Gupta** - `ramesh.elderly@demo.com` | `password123`
2. **Sunita Devi** - `sunita.family@demo.com` | `password123`
3. **Arjun Singh** - `arjun.student@demo.com` | `password123`
4. **Kavita Sharma** - `kavita.disabled@demo.com` | `password123`
5. **Mohan Lal** - `mohan.lost@demo.com` | `password123`
6. **Geeta Patel** - `geeta.foreign@demo.com` | `password123`
7. **Vijay Kumar** - `vijay.emergency@demo.com` | `password123`
8. **Lakshmi Nair** - `lakshmi.group@demo.com` | `password123`

## Option 2: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Users
3. Click "Add user" 
4. Create each account manually with the emails and passwords above

## After Creating Accounts

Once the accounts are created, run this SQL to update their profiles:

```sql
-- Update volunteer profiles
UPDATE profiles SET 
    name = 'Dr. Rajesh Patel',
    phone = '+91-9123456701',
    role = 'volunteer',
    skills = '{"medical", "first_aid", "emergency", "healthcare"}',
    volunteer_status = 'available',
    rating = 4.8,
    total_ratings = 25
WHERE email = 'dr.rajesh.medical@demo.com';

UPDATE profiles SET 
    name = 'Priya Sharma',
    phone = '+91-9123456702',
    role = 'volunteer',
    skills = '{"local_knowledge", "tour_guide", "navigation", "hindi", "gujarati"}',
    volunteer_status = 'available',
    rating = 4.6,
    total_ratings = 18
WHERE email = 'priya.guide@demo.com';

UPDATE profiles SET 
    name = 'Amit Kumar',
    phone = '+91-9123456703',
    role = 'volunteer',
    skills = '{"crowd_management", "security", "emergency", "communication"}',
    volunteer_status = 'busy',
    rating = 4.7,
    total_ratings = 22
WHERE email = 'amit.security@demo.com';

UPDATE profiles SET 
    name = 'Sneha Joshi',
    phone = '+91-9123456704',
    role = 'volunteer',
    skills = '{"language", "translation", "communication", "english", "hindi", "gujarati"}',
    volunteer_status = 'available',
    rating = 4.9,
    total_ratings = 31
WHERE email = 'sneha.translator@demo.com';

UPDATE profiles SET 
    name = 'Ravi Mehta',
    phone = '+91-9123456705',
    role = 'volunteer',
    skills = '{"maintenance", "cleaning", "sanitation", "general"}',
    volunteer_status = 'available',
    rating = 4.4,
    total_ratings = 12
WHERE email = 'ravi.maintenance@demo.com';

-- Update pilgrim profiles
UPDATE profiles SET name = 'Ramesh Gupta', phone = '+91-9123456706', role = 'pilgrim' WHERE email = 'ramesh.elderly@demo.com';
UPDATE profiles SET name = 'Sunita Devi', phone = '+91-9123456707', role = 'pilgrim' WHERE email = 'sunita.family@demo.com';
UPDATE profiles SET name = 'Arjun Singh', phone = '+91-9123456708', role = 'pilgrim' WHERE email = 'arjun.student@demo.com';
UPDATE profiles SET name = 'Kavita Sharma', phone = '+91-9123456709', role = 'pilgrim' WHERE email = 'kavita.disabled@demo.com';
UPDATE profiles SET name = 'Mohan Lal', phone = '+91-9123456710', role = 'pilgrim' WHERE email = 'mohan.lost@demo.com';
UPDATE profiles SET name = 'Geeta Patel', phone = '+91-9123456711', role = 'pilgrim' WHERE email = 'geeta.foreign@demo.com';
UPDATE profiles SET name = 'Vijay Kumar', phone = '+91-9123456712', role = 'pilgrim' WHERE email = 'vijay.emergency@demo.com';
UPDATE profiles SET name = 'Lakshmi Nair', phone = '+91-9123456713', role = 'pilgrim' WHERE email = 'lakshmi.group@demo.com';
```

## Quick Test Account

For immediate testing, create just one account first:
- **Email:** `arjun.student@demo.com`
- **Password:** `password123` 
- **Role:** Pilgrim

This will verify the signup process works correctly before creating all accounts.
