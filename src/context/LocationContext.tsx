import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { locationService } from '../services/locationService';
import { LocationData } from '../types';

interface LocationContextType {
  currentLocation: LocationData | null;
  isTracking: boolean;
  permissions: { foreground: boolean; background: boolean } | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
  requestPermissions: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissions, setPermissions] = useState<{ foreground: boolean; background: boolean } | null>(null);
  const [watchSubscription, setWatchSubscription] = useState<any>(null);

  const requestPermissions = async () => {
    const perms = await locationService.requestPermissions();
    setPermissions(perms);
  };

  const getCurrentLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    }
    return location;
  };

  const startTracking = async () => {
    if (!permissions?.foreground) {
      await requestPermissions();
    }

    if (permissions?.foreground) {
      setIsTracking(true);
      const subscription = await locationService.watchPosition((location) => {
        setCurrentLocation(location);
      });
      setWatchSubscription(subscription);
    }
  };

  const stopTracking = () => {
    if (watchSubscription) {
      watchSubscription.remove();
      setWatchSubscription(null);
    }
    setIsTracking(false);
  };

  useEffect(() => {
    // Request permissions on mount
    requestPermissions();

    return () => {
      stopTracking();
    };
  }, []);

  const value: LocationContextType = {
    currentLocation,
    isTracking,
    permissions,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermissions,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
