import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { locationService } from '../services/locationService';
import { LocationData } from '../types';
import { useAuth } from './AuthContext';
import * as Location from 'expo-location';

interface LocationPermissions {
  foreground: boolean;
  background: boolean;
  error?: any;
}

interface LocationContextType {
  currentLocation: LocationData | null;
  isTracking: boolean;
  isBackgroundTracking: boolean;
  permissions: LocationPermissions | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
  requestPermissions: () => Promise<LocationPermissions>;
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
  const [isTracking, setIsTracking] = useState(false);
  const [isBackgroundTracking, setIsBackgroundTracking] = useState(false);
  const [permissions, setPermissions] = useState<LocationPermissions | null>(null);
  const [watchSubscription, setWatchSubscription] = useState<Location.LocationSubscription | null>(null);
  const { user } = useAuth();

  const requestPermissions = async () => {
    try {
      const perms = await locationService.requestPermissions();
      setPermissions(perms);
      return perms;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      const errorPerms = { foreground: false, background: false, error };
      setPermissions(errorPerms);
      return errorPerms;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }
      return location;
    } catch (error) {
      console.error('Could not get current location:', error);
      return null;
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
        .catch(error => console.error('Error stopping background tracking:', error));
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const startTracking = async () => {
    try {
      if (!permissions?.foreground) {
        const newPerms = await requestPermissions();
        if (!newPerms.foreground) {
          throw new Error('Location permission not granted');
        }
      }

      const subscription = await locationService.watchPosition((location) => {
        setCurrentLocation(location);
      });
      
      if (subscription) {
        setWatchSubscription(subscription);
        setIsTracking(true);
        
        // Start background updates if we have permission
        if (permissions?.background) {
          try {
            await locationService.startBackgroundLocationUpdates();
            setIsBackgroundTracking(true);
          } catch (error) {
            console.error('Failed to start background tracking:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  };

  // Initial setup
  useEffect(() => {
    requestPermissions();
  }, []);

  // Get initial location when permissions granted
  useEffect(() => {
    if (permissions?.foreground) {
      getCurrentLocation();
    }
  }, [permissions]);

  // Auto-start tracking for logged in users
  useEffect(() => {
    const autoStartTracking = async () => {
      if (user && permissions?.foreground && !isTracking) {
        console.log('[LocationContext] Auto-starting location tracking for logged-in user');
        await startTracking().catch(error => {
          console.error('Failed to auto-start tracking:', error);
        });
      }
    };

    autoStartTracking();
  }, [user, permissions, isTracking]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isTracking,
        isBackgroundTracking,
        permissions,
        startTracking,
        stopTracking,
        getCurrentLocation,
        requestPermissions,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export { LocationContext };
export default LocationProvider;
