import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { secureLocationService } from '../services/secureLocationService';
import { secureMapService, UserLocationData, AssignmentData } from '../services/secureMapService';
import { APP_ROLE, validateUserRole } from '../constants/appRole';
import { supabase } from '../services/supabase';

interface SecureLocationContextType {
  // Location data
  locations: UserLocationData[];
  assignment: AssignmentData | null;
  
  // Status
  isTracking: boolean;
  hasPermissions: boolean;
  hasAssignment: boolean;
  isInitialized: boolean;
  
  // Actions
  initializeTracking: () => Promise<boolean>;
  refreshLocations: () => Promise<void>;
  centerOnSelf: () => Promise<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number; } | null>;
  stopTracking: () => void;
  
  // Error state
  error: string | null;
}

const SecureLocationContext = createContext<SecureLocationContextType | undefined>(undefined);

interface SecureLocationProviderProps {
  children: ReactNode;
}

export function SecureLocationProvider({ children }: SecureLocationProviderProps) {
  const [locations, setLocations] = useState<UserLocationData[]>([]);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeOnAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await initializeOnAuth();
        } else if (event === 'SIGNED_OUT') {
          cleanup();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      cleanup();
    };
  }, []);

  /**
   * Initialize tracking when user is authenticated
   */
  const initializeOnAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No authenticated user');
        return;
      }

      // Verify user role matches app build
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setError('User profile not found');
        return;
      }

      if (!validateUserRole(profile.role)) {
        setError(`Role mismatch: Expected ${APP_ROLE}, got ${profile.role}`);
        return;
      }

      // Check for assignment
      const assignmentData = await secureMapService.getMyAssignment();
      setAssignment(assignmentData);
      setHasAssignment(assignmentData !== null);

      setIsInitialized(true);
      setError(null);

      console.log('[SecureLocationContext] Initialized successfully');

    } catch (error) {
      console.error('[SecureLocationContext] Initialization failed:', error);
      setError('Failed to initialize location tracking');
    }
  };

  /**
   * Initialize location tracking
   */
  const initializeTracking = async (): Promise<boolean> => {
    try {
      setError(null);

      if (!hasAssignment) {
        setError('No active assignment found');
        return false;
      }

      // Initialize location service
      const success = await secureLocationService.initializeTracking();
      
      if (!success) {
        setError('Failed to initialize location tracking');
        setHasPermissions(false);
        setIsTracking(false);
        return false;
      }

      setHasPermissions(true);
      setIsTracking(true);

      // Load initial locations
      await refreshLocations();

      // Subscribe to real-time updates
      secureMapService.subscribeToLocationUpdates((updatedLocations) => {
        setLocations(updatedLocations);
      });

      console.log('[SecureLocationContext] Tracking initialized successfully');
      return true;

    } catch (error) {
      console.error('[SecureLocationContext] Failed to initialize tracking:', error);
      setError('Failed to start location tracking');
      return false;
    }
  };

  /**
   * Refresh all location data
   */
  const refreshLocations = async (): Promise<void> => {
    try {
      const updatedLocations = await secureMapService.refreshLocations();
      setLocations(updatedLocations);
    } catch (error) {
      console.error('[SecureLocationContext] Failed to refresh locations:', error);
      setError('Failed to refresh location data');
    }
  };

  /**
   * Get center coordinates for own location
   */
  const centerOnSelf = async () => {
    try {
      return await secureMapService.getOwnLocationCenter();
    } catch (error) {
      console.error('[SecureLocationContext] Failed to get own location center:', error);
      setError('Failed to get your location');
      return null;
    }
  };

  /**
   * Stop location tracking
   */
  const stopTracking = (): void => {
    secureLocationService.stopTracking();
    secureMapService.unsubscribeFromLocationUpdates();
    setIsTracking(false);
    setHasPermissions(false);
    setLocations([]);
    console.log('[SecureLocationContext] Tracking stopped');
  };

  /**
   * Cleanup resources
   */
  const cleanup = (): void => {
    stopTracking();
    setAssignment(null);
    setHasAssignment(false);
    setIsInitialized(false);
    setError(null);
  };

  const contextValue: SecureLocationContextType = {
    // Data
    locations,
    assignment,
    
    // Status
    isTracking,
    hasPermissions,
    hasAssignment,
    isInitialized,
    
    // Actions
    initializeTracking,
    refreshLocations,
    centerOnSelf,
    stopTracking,
    
    // Error
    error,
  };

  return (
    <SecureLocationContext.Provider value={contextValue}>
      {children}
    </SecureLocationContext.Provider>
  );
}

/**
 * Hook to use secure location context
 */
export function useSecureLocation(): SecureLocationContextType {
  const context = useContext(SecureLocationContext);
  if (context === undefined) {
    throw new Error('useSecureLocation must be used within a SecureLocationProvider');
  }
  return context;
}
