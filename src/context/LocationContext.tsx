import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { locationService } from '../services/locationService';
import { LocationData } from '../types';
import { useAuth } from './AuthContext';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';
import { LocationErrorHandler, LocationErrorType } from '../utils/locationErrorHandler';

interface LocationPermissions {
  foreground: boolean;
  background: boolean;
  error?: any;
  dontAskAgain?: boolean;
  highestAvailable?: boolean;
}

interface LocationContextType {
  currentLocation: LocationData | null;
  lastKnownLocation: LocationData | null;
  isTracking: boolean;
  isBackgroundTracking: boolean;
  permissions: LocationPermissions | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<void>;
  requestPermissions: () => Promise<LocationPermissions>;
  showPermissionModal: boolean;
  setShowPermissionModal: (show: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [lastKnownLocation, setLastKnownLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isBackgroundTracking, setIsBackgroundTracking] = useState(false);
  const [permissions, setPermissions] = useState<LocationPermissions | null>(null);
  const [watchSubscription, setWatchSubscription] = useState<Location.LocationSubscription | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const { user } = useAuth();

  const requestPermissions = async () => {
    try {
      console.log('📍 Requesting location permissions...');
      
      // Quick permission check first
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      
      if (foregroundStatus === 'granted') {
        console.log('📍 Foreground permission already granted');
        const perms = {
          foreground: true,
          background: false,
          highestAvailable: true,
          dontAskAgain: false
        };
        setPermissions(perms);
        return perms;
      }
      
      // If not granted, request permissions
      const result = await locationService.requestPermissions();
      
      if ('error' in result && result.error) {
        console.log('LocationContext: Permission request failed:', result.error);
        
        // Handle Expo Go gracefully without showing error modal
        if (result.error.includes('Expo Go')) {
          console.log('LocationContext: Running in Expo Go - location features limited');
          const expoGoPerms = { 
            foreground: false, 
            background: false,
            highestAvailable: false,
            dontAskAgain: false
          };
          setPermissions(expoGoPerms);
          return expoGoPerms;
        }
        
        // For other errors, show user-friendly message
        setShowPermissionModal(true);
      }
      
      const perms = {
        foreground: result.foreground,
        background: result.background,
        highestAvailable: result.background || result.foreground,
        dontAskAgain: false
      };
      
      console.log('LocationContext: Permissions result:', perms);
      setPermissions(perms);
      return perms;
    } catch (error) {
      console.log('LocationContext: Permission request error:', error);
      const errorPerms = { 
        foreground: false, 
        background: false,
        highestAvailable: false,
        dontAskAgain: false
      };
      setPermissions(errorPerms);
      return errorPerms;
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('LocationContext: Getting current location...');
      const location = await locationService.getCurrentLocation();
      if (location) {
        console.log('LocationContext: Setting current location:', location);
        setCurrentLocation(location);
        setLastKnownLocation(location); // Update last known location
        
        // Also update in database immediately
        try {
          await locationService.updateLocation(location);
          console.log('LocationContext: Updated location in database');
        } catch (updateError) {
          console.log('LocationContext: Failed to update location in database:', updateError);
        }
      } else {
        console.log('LocationContext: Location unavailable - GPS may be disabled or no signal');
        // Don't show error to user for common GPS issues
      }
    } catch (error) {
      console.log('LocationContext: Location unavailable:', error);
      const locationError = LocationErrorHandler.parseError(error);
      LocationErrorHandler.logError(locationError, 'getCurrentLocation');
      
      // Only show user-friendly errors for permission issues, not GPS unavailability
      if (locationError.type !== LocationErrorType.GPS_UNAVAILABLE) {
        // Add placeholder toast handler - in real app this would use the actual toast
        const dummyToast = {
          showError: (title: string, message: string) => console.log(`Toast: ${title} - ${message}`),
          showWarning: (title: string, message: string) => console.log(`Toast: ${title} - ${message}`),
        };
        LocationErrorHandler.showUserFriendlyError(locationError, dummyToast);
      }
    }
  };

  const stopTracking = () => {
    try {
      if (watchSubscription) {
        watchSubscription.remove();
        setWatchSubscription(null);
      }
      setIsTracking(false);

      // Stop background tracking if it's running
      locationService.stopBackgroundLocationUpdates()
        .then(() => setIsBackgroundTracking(false))
        .catch(error => console.log('Error stopping background tracking:', error));
    } catch (error) {
      console.log('Error stopping location tracking:', error);
    }
  };

  const startTracking = async () => {
    try {
      console.log('[LocationContext] Starting location tracking...');
      
      if (!permissions?.foreground) {
        console.log('[LocationContext] No foreground permission, requesting...');
        const newPerms = await requestPermissions();
        if (!newPerms.foreground) {
          const errorMessage = ('error' in newPerms && newPerms.error) ? String(newPerms.error) : 'Location permission not granted';
          console.log('Cannot start tracking - permission denied:', errorMessage);
          
          // Only show modal for actual permission denials, not Expo Go limitations
          if (!errorMessage.includes('Expo Go')) {
            setShowPermissionModal(true);
          }
          return; // Don't throw error, just return silently
        }
      }

      // Force publish location on tracking start
      await locationService.forcePublishLocation();

      const subscription = await locationService.watchPosition((location) => {
        setCurrentLocation(location);
        setLastKnownLocation(location); // Update last known location
      });
      
      if (subscription) {
        setWatchSubscription(subscription);
        setIsTracking(true);
        console.log('Location tracking started successfully');
        
        // Start background updates if we have permission
        if (permissions?.background) {
          console.log('[LocationContext] Starting background location tracking...');
          const backgroundResult = await locationService.startBackgroundLocationUpdates();
          if (backgroundResult.success) {
            setIsBackgroundTracking(true);
            console.log('✅ Background location tracking started successfully');
          } else {
            console.log('❌ Failed to start background tracking:', backgroundResult.error);
            // Continue with foreground tracking even if background fails
          }
        } else {
          console.log('⚠️ Background location permission not available - using foreground only');
        }
      } else {
        console.log('Failed to create location subscription - likely due to Expo Go limitations');
      }
    } catch (error) {
      console.log('Error starting location tracking:', error);
      setIsTracking(false);
      
      // Silent handling - no user alerts for location issues
      const locationError = LocationErrorHandler.parseError(error);
      LocationErrorHandler.logError(locationError, 'startTracking');
      
      // Only show permission modal for actual permission issues, not technical errors
      if (locationError.type === LocationErrorType.PERMISSION_DENIED && 
          !locationError.message.includes('Expo Go')) {
        setShowPermissionModal(true);
      }
      
      // Don't throw error - handle gracefully
    }
  };

  // Single initialization effect - optimized for speed
  useEffect(() => {
    const fastInitialization = async () => {
      if (!user) return;
      
      console.log('LocationContext: Fast initialization for user:', user.id);
      
      try {
        // Quick permission check first
        const perms = await requestPermissions();
        
        if (perms.foreground) {
          // Start location tracking immediately without waiting
          startTracking();
        } else {
          console.log('LocationContext: No foreground permission, skipping location');
        }
      } catch (error) {
        console.log('LocationContext: Fast initialization failed:', error);
        // Continue silently - don't block the app
      }
    };

    fastInitialization();
  }, [user]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        lastKnownLocation,
        isTracking,
        isBackgroundTracking,
        permissions,
        startTracking,
        stopTracking,
        getCurrentLocation,
        requestPermissions,
        showPermissionModal,
        setShowPermissionModal,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export { LocationContext };
export default LocationProvider;
