// App Role Configuration
// This file defines the hardcoded role for this app build
// CRITICAL: This must be different for pilgrim vs volunteer app builds

export type AppRole = 'pilgrim' | 'volunteer' | 'admin';

// CHANGE THIS VALUE FOR DIFFERENT APP BUILDS:
// - Set to 'pilgrim' for pilgrim app builds
// - Set to 'volunteer' for volunteer app builds  
// - Set to 'admin' for admin app builds
export const APP_ROLE: AppRole = 'volunteer'; // Current build: volunteer

// Role-specific configuration
export const ROLE_CONFIG = {
  pilgrim: {
    appName: 'BandhuConnect+ Pilgrim',
    primaryColor: '#DC2626', // Red
    markerIcon: '🔴',
    counterpartRole: 'volunteer' as const,
    counterpartColor: '#16A34A', // Green
    counterpartIcon: '🟢',
    description: 'Pilgrim tracking app'
  },
  volunteer: {
    appName: 'BandhuConnect+ Volunteer',
    primaryColor: '#16A34A', // Green
    markerIcon: '🟢',
    counterpartRole: 'pilgrim' as const,
    counterpartColor: '#DC2626', // Red
    counterpartIcon: '🔴',
    description: 'Volunteer tracking app'
  },
  admin: {
    appName: 'BandhuConnect+ Admin',
    primaryColor: '#2563EB', // Blue
    markerIcon: '🔵',
    counterpartRole: null,
    counterpartColor: '#6B7280', // Gray
    counterpartIcon: '⚪',
    description: 'Admin management app'
  }
} as const;

// Get current role configuration
export const getCurrentRoleConfig = () => ROLE_CONFIG[APP_ROLE];

// Validation function to ensure role consistency
export const validateUserRole = (userRole: string): boolean => {
  return userRole === APP_ROLE;
};

// Helper to get expected counterpart role
export const getCounterpartRole = (): AppRole | null => {
  return getCurrentRoleConfig().counterpartRole;
};
