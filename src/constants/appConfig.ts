// App-specific configuration - hardcoded per build
// This prevents role confusion and ensures each app build has a fixed role

export const APP_CONFIG = {
  // Role is hardcoded per app build to prevent confusion
  // Pilgrim app → role: 'pilgrim'
  // Volunteer app → role: 'volunteer'
  // Admin app → role: 'admin'
  ROLE: 'pilgrim' as 'pilgrim' | 'volunteer' | 'admin', // Change this per build
  
  // App metadata
  APP_NAME: 'BandhuConnect+ Pilgrim',
  VERSION: '1.0.0',
  BUILD_TYPE: 'development',
  
  // Location publishing strategy
  LOCATION_PUBLISH_INTERVAL: 10000, // 10 seconds
  LOCATION_PUBLISH_DISTANCE: 25, // 25 meters
  STALE_LOCATION_THRESHOLD: 2 * 60 * 1000, // 2 minutes
  
  // Debug settings
  DEBUG_ENABLED: __DEV__,
  SHOW_DEBUG_DRAWER: __DEV__,
};

// Helper function to get user role - always returns hardcoded role
export const getUserRole = () => {
  return APP_CONFIG.ROLE;
};

// Helper function to check if current user should see specific markers
export const shouldShowMarker = (markerRole: string, currentUserRole: string) => {
  switch (currentUserRole) {
    case 'pilgrim':
      // Pilgrims see themselves and their assigned volunteer
      return markerRole === 'volunteer' || markerRole === 'pilgrim';
    case 'volunteer':
      // Volunteers see themselves and their assigned pilgrims
      return markerRole === 'pilgrim' || markerRole === 'volunteer';
    case 'admin':
      // Admins see everyone
      return true;
    default:
      return false;
  }
};

// Helper function to get counterpart role
export const getCounterpartRole = (userRole: string) => {
  switch (userRole) {
    case 'pilgrim':
      return 'volunteer';
    case 'volunteer':
      return 'pilgrim';
    case 'admin':
      return 'all';
    default:
      return null;
  }
};
