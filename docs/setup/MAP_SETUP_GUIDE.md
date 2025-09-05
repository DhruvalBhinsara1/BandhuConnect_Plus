# Real-Time Map Feature Setup Guide

This guide will help you set up the comprehensive real-time map feature for BandhuConnect+ that works seamlessly across all three user types (Admin, Volunteer, Pilgrim).

## 🚀 Features Implemented

### **Admin View**
- **Complete Overview**: See all active users (volunteers, pilgrims, admins) on the map
- **Assignment Tracking**: Visual indicators showing which volunteer is helping which pilgrim
- **Status Indicators**: Color-coded markers showing volunteer availability and pilgrim status
- **Real-time Updates**: Live location updates every 30 seconds with database synchronization

### **Volunteer View**
- **Assigned Pilgrim Tracking**: See location of pilgrims you're assigned to help
- **Your Location**: Track and share your location with assigned pilgrims
- **Assignment Status**: Visual indicators of your current assignments

### **Pilgrim View**
- **Assigned Volunteer Tracking**: See location of volunteer assigned to help you
- **Your Location**: Share your location with assigned volunteer
- **Request Status**: Visual indicators of your request status

## 📋 Prerequisites

1. **React Native Maps**: Already installed via `npm install react-native-maps`
2. **Expo Location**: Already available in your dependencies
3. **Supabase Database**: Your existing Supabase setup

## 🗄️ Database Setup

### Step 1: Run Location Tracking Schema

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Run the contents of database/location-tracking-schema.sql
```

This creates:
- `user_locations` table for real-time location storage
- RLS policies for proper access control
- Helper functions for location management
- Triggers for automatic timestamp updates

### Step 2: Verify Database Setup

After running the schema, verify these tables exist:
- `user_locations` - stores real-time location data
- Proper RLS policies are active
- Functions `update_user_location()` and `get_all_active_locations()` exist

## 🎨 Map Legend

The map uses color-coded markers to indicate user status:

| Color | User Type | Status |
|-------|-----------|--------|
| 🔴 Red | Admin | Always red |
| 🟢 Green | Volunteer | Currently assigned to a pilgrim |
| 🔵 Blue | Volunteer | Available (not assigned) |
| 🟠 Orange | Pilgrim | Has assigned volunteer |
| ⚫ Gray | Pilgrim | Waiting for volunteer |

## 🎮 Map Controls

### **Control Panel (Top Right)**
- **Refresh Button**: Manually refresh all locations
- **Center Button**: Center map on your current location
- **Fit All Button**: Zoom to show all active users
- **Start/Stop Tracking**: Toggle your location sharing

### **Legend (Bottom Left)**
- Visual guide to marker colors and meanings
- Always visible for reference

### **Status Bar (Bottom)**
- Shows count of active users visible
- Displays "Live Tracking" status when active

## 🔧 How It Works

### **Location Tracking Flow**
1. User starts location tracking via map controls
2. App requests location permissions
3. Location updates every 30 seconds to database
4. Real-time subscriptions notify other users of changes
5. Map automatically refreshes with new positions

### **Permission Handling**
- Foreground location permission required for basic tracking
- Background permission requested for continuous tracking
- Graceful fallback if permissions denied

### **Data Synchronization**
- **Database Updates**: Every 30 seconds when tracking active
- **Real-time Subscriptions**: Instant updates via Supabase realtime
- **Auto Refresh**: Map refreshes every 60 seconds
- **Offline Handling**: Locations marked inactive after 10 minutes

## 🚨 Troubleshooting

### **Map Not Loading**
- Ensure `react-native-maps` is properly installed
- Check if Google Maps API is configured (if using Google provider)
- Verify location permissions are granted

### **No Location Updates**
- Check if location tracking is started
- Verify location permissions are granted
- Check database connectivity
- Look for console errors in location service

### **Empty Map**
- Ensure database schema is properly set up
- Check if users have started location tracking
- Verify RLS policies allow data access
- Check if locations are within 10-minute active window

### **Permission Issues**
- Location permissions must be granted in device settings
- App will show permission dialog on first use
- Check device location services are enabled

## 📱 Usage Instructions

### **For All Users**
1. Navigate to Map tab in bottom navigation
2. Tap "Start Tracking" to begin sharing location
3. Use control buttons to navigate and refresh map
4. Tap markers to see user details and assignment info

### **For Admins**
- See all active users across the system
- Monitor volunteer-pilgrim assignments
- Track response times and coverage areas

### **For Volunteers**
- See pilgrims you're assigned to help
- Share your location with assigned pilgrims
- Navigate to pilgrim locations efficiently

### **For Pilgrims**
- See volunteers assigned to help you
- Share your location with assigned volunteer
- Track volunteer approach and ETA

## 🔐 Security & Privacy

- **RLS Policies**: Users can only see relevant locations based on assignments
- **Time-Limited**: Locations auto-expire after 10 minutes of inactivity
- **Permission-Based**: All location sharing requires explicit user consent
- **Encrypted**: All data transmitted via HTTPS/WSS

## 🎯 Next Steps

The map feature is now fully functional! Users can:

1. **Start the app** and navigate to the Map tab
2. **Grant location permissions** when prompted
3. **Start tracking** to share location with relevant users
4. **Use map controls** to navigate and view other users
5. **Monitor assignments** and track real-time progress

The system will automatically handle location updates, real-time synchronization, and proper access control based on user roles and assignments.

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify database setup is complete
3. Ensure all dependencies are installed
4. Check console logs for specific error messages

The map feature provides a comprehensive, food-delivery-app-style tracking experience that enhances coordination between all user types in the BandhuConnect+ ecosystem.
