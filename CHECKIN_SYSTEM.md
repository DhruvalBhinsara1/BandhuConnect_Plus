# CHECK-IN SYSTEM DOCUMENTATION

How the assignment algorithm ensures tasks are only assigned to checked-in volunteers

## 🔐 CHECK-IN REQUIREMENT

**Tasks are ONLY assigned to volunteers who have checked in** within the last 24 hours.

### How Check-In is Determined

1. **Location Data Check**: System queries `user_locations` table for recent location updates
2. **Time Window**: Only considers location data from the last 24 hours as "checked in"
3. **Automatic Filtering**: Assignment algorithm automatically excludes volunteers without recent check-ins

### Check-In Bonus Scoring

- ✅ **Within 1 hour**: +0.3 bonus points
- ✅ **Within 4 hours**: +0.2 bonus points
- ✅ **Within 12 hours**: +0.1 bonus points
- ✅ **Within 24 hours**: +0.05 bonus points
- ❌ **Over 24 hours**: No bonus (but still eligible if status is 'available')

### Assignment Algorithm Flow

1. Find volunteers within radius (15km, expands to 25km)
2. **FILTER**: Remove volunteers without recent location data
3. Score remaining volunteers based on:
   - Skills match (35%)
   - Distance (25%)
   - Availability + Check-in bonus (30%)
   - Urgency bonus (10%)
4. Assign to highest-scoring volunteer above threshold

### UI Indicators

- **VolunteerDashboard**: Shows "Checked In" vs "Checked Out" status
- **Clear messaging**: "Check in to receive assignments"
- **Status colors**: Green for checked in, red for checked out

### Database Tables Involved

- `user_locations`: Stores check-in location data with timestamps
- `assignments`: Records assignment timestamps (started_at, completed_at)
- `profiles`: Volunteer status and availability

This ensures that only active, checked-in volunteers receive assignments, improving response times and volunteer engagement.
