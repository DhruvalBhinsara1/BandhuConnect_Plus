import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { mapService, UserLocationData } from '../services/mapService';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';

interface MapContextType {
  userLocations: UserLocationData[];
  loading: boolean;
  refreshLocations: () => Promise<void>;
  updateLocationInDatabase: () => Promise<void>;
  centerLocation: { latitude: number; longitude: number } | null;
  mapBounds: { southwest: { latitude: number; longitude: number }; northeast: { latitude: number; longitude: number } } | null;
  isTracking: boolean;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { currentLocation, startTracking, stopTracking, isTracking } = useLocation();
  const [userLocations, setUserLocations] = useState<UserLocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Calculate center and bounds
  const centerLocation = mapService.getCenter(userLocations);
  const mapBounds = mapService.getBounds(userLocations);

  const refreshLocations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let result;
      if (user.role === 'admin') {
        result = await mapService.getAllActiveLocations();
      } else {
        result = await mapService.getAssignmentLocations();
      }

      if (result.data && !result.error) {
        setUserLocations(result.data);
      }
    } catch (error) {
      console.error('Error refreshing locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLocationInDatabase = async () => {
    if (!currentLocation || !user) return;

    try {
      await mapService.updateUserLocation(currentLocation);
    } catch (error) {
      console.error('Error updating location in database:', error);
    }
  };

  const startLocationTracking = () => {
    startTracking();
    
    // Update location in database every 30 seconds
    const interval = setInterval(updateLocationInDatabase, 30000);
    setLocationUpdateInterval(interval);
  };

  const stopLocationTracking = () => {
    stopTracking();
    
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
    }

    // Deactivate location in database
    mapService.deactivateUserLocation();
  };

  // Update location in database when current location changes
  useEffect(() => {
    if (currentLocation && isTracking) {
      updateLocationInDatabase();
    }
  }, [currentLocation, isTracking]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!user) return;

    const locationSubscription = mapService.subscribeToLocationUpdates((payload) => {
      console.log('Location update received:', payload);
      refreshLocations();
    });

    setSubscription(locationSubscription);

    return () => {
      if (locationSubscription) {
        locationSubscription.unsubscribe();
      }
    };
  }, [user]);

  // Initial load and periodic refresh
  useEffect(() => {
    if (user) {
      refreshLocations();
      
      // Refresh every 60 seconds
      const refreshInterval = setInterval(refreshLocations, 60000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
      if (isTracking) {
        mapService.deactivateUserLocation();
      }
    };
  }, []);

  const value: MapContextType = {
    userLocations,
    loading,
    refreshLocations,
    updateLocationInDatabase,
    centerLocation,
    mapBounds,
    isTracking,
    startLocationTracking,
    stopLocationTracking,
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = (): MapContextType => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
