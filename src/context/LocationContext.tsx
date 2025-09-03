import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { locationService } from '../services/locationService';
import { LocationData } from '../types';
import { useAuth } from './AuthContext';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { LocationErrorHandler, LocationErrorType } from '../utils/locationErrorHandler';

interface LocationPermissions {
  foreground: boolean;
  background: boolean;
  error?: any;
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
      const perms = await locationService.requestPermissions();
      setPermissions(perms);
      return perms;
    } catch (error) {
      console.log('Permission request failed:', error);
      const errorPerms = { foreground: false, background: false, error };
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
        LocationErrorHandler.showUserFriendlyError(locationError);
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
      if (!permissions?.foreground) {
        const newPerms = await requestPermissions();
        if (!newPerms.foreground) {
          const errorMessage = newPerms.error || 'Location permission not granted';
          console.log('Cannot start tracking - permission denied:', errorMessage);
          
          // Only show modal for actual permission denials, not Expo Go limitations
          if (!errorMessage.includes('Expo Go')) {
            setShowPermissionModal(true);
          }
          return; // Don't throw error, just return silently
        }
      }

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
          try {
            await locationService.startBackgroundLocationUpdates();
            setIsBackgroundTracking(true);
            console.log('Background location tracking started');
          } catch (error) {
            console.log('Failed to start background tracking:', error);
          }
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

  // Initial setup - silent permission request
  useEffect(() => {
    const silentPermissionRequest = async () => {
      try {
        await requestPermissions();
      } catch (error) {
        // Silently handle permission request errors
        console.log('Permission request failed silently:', error);
      }
    };
    
    silentPermissionRequest();
  }, []);

  // Initialize permissions and location on mount
  useEffect(() => {
    if (user) {
      console.log('LocationContext: Initializing for user:', user.id);
      requestPermissions().then(perms => {
        console.log('LocationContext: Permissions result:', perms);
        if (perms.foreground) {
          getCurrentLocation();
        } else {
          console.log('LocationContext: No foreground permission, cannot get location');
        }
      });
    }
  }, [user]);

  // Auto-start tracking for logged in users
  useEffect(() => {
    const autoStartTracking = async () => {
      if (user && permissions?.foreground && !isTracking) {
        console.log('[LocationContext] Auto-starting location tracking for logged-in user');
        // Silent auto-start - no error handling needed since startTracking is now graceful
        await startTracking();
      }
    };

    autoStartTracking();
  }, [user, permissions, isTracking]);

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
