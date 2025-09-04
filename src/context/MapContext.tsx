import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { secureMapService, UserLocationData } from '../services/secureMapService';
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
  const [centerLocation, setCenterLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapBounds, setMapBounds] = useState<{ southwest: { latitude: number; longitude: number }; northeast: { latitude: number; longitude: number } } | null>(null);

  // Update center and bounds when locations change
  useEffect(() => {
    const updateCenterAndBounds = async () => {
      const bounds = secureMapService.calculateMapBounds(userLocations);
      if (bounds) {
        setCenterLocation({ latitude: bounds.latitude, longitude: bounds.longitude });
        setMapBounds({
          southwest: {
            latitude: bounds.latitude - bounds.latitudeDelta / 2,
            longitude: bounds.longitude - bounds.longitudeDelta / 2
          },
          northeast: {
            latitude: bounds.latitude + bounds.latitudeDelta / 2,
            longitude: bounds.longitude + bounds.longitudeDelta / 2
          }
        });
      }
    };

    updateCenterAndBounds();
  }, [userLocations]);

  const refreshLocations = async () => {
    if (!user) {
      console.log('MapContext: No user found, skipping location refresh');
      return;
    }
    
    console.log('MapContext: Refreshing locations for user:', user.id);
    setLoading(true);
    try {
      const locations = await secureMapService.getAllRelevantLocations();
      console.log('MapContext: Retrieved locations:', locations.length);
      setUserLocations(locations);
    } catch (error) {
      console.error('Error refreshing locations:', error);
      setUserLocations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const updateLocationInDatabase = async () => {
    if (!currentLocation || !user) return;

    try {
      // SecureMapService handles location updates through secureLocationService
      console.log('Location updates handled by secureLocationService');
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

    // Cleanup handled by secureMapService
    secureMapService.cleanup();
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

    secureMapService.subscribeToLocationUpdates((locations) => {
      console.log('Real-time location update received:', locations);
      setUserLocations(prevLocations => {
        // Create a map for efficient deduplication by userId
        const locationMap = new Map<string, UserLocationData>();
        
        // Add existing locations to map
        prevLocations.forEach(loc => {
          const existing = locationMap.get(loc.userId);
          if (!existing || new Date(loc.lastUpdated) > new Date(existing.lastUpdated)) {
            locationMap.set(loc.userId, loc);
          }
        });
        
        // Add/update with new locations
        locations.forEach(newLocation => {
          const existing = locationMap.get(newLocation.userId);
          if (!existing || new Date(newLocation.lastUpdated) > new Date(existing.lastUpdated)) {
            locationMap.set(newLocation.userId, newLocation);
          }
        });
        
        // Convert back to array
        return Array.from(locationMap.values());
      });
    });

    return () => {
      secureMapService.unsubscribeFromLocationUpdates();
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
        subscription();  // Call the unsubscribe function directly
      }
      if (isTracking) {
        secureMapService.cleanup();
      }
    };
  }, [locationUpdateInterval, subscription, isTracking]);

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
