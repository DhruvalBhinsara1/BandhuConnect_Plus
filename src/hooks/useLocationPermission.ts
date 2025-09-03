import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationPermissionStatus {
  foreground: boolean;
  background: boolean;
  loading: boolean;
  error?: string;
  canRequestAgain: boolean;
}

export const useLocationPermission = () => {
  const [status, setStatus] = useState<LocationPermissionStatus>({
    foreground: false,
    background: false,
    loading: true,
    canRequestAgain: true,
  });

  const checkPermissions = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      const backgroundStatus = await Location.getBackgroundPermissionsAsync();
      
      setStatus({
        foreground: foregroundStatus.status === 'granted',
        background: backgroundStatus.status === 'granted',
        loading: false,
        canRequestAgain: foregroundStatus.canAskAgain,
        error: undefined,
      });
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      const foregroundResult = await Location.requestForegroundPermissionsAsync();
      const foregroundGranted = foregroundResult.status === 'granted';
      
      let backgroundGranted = false;
      if (foregroundGranted) {
        const backgroundResult = await Location.requestBackgroundPermissionsAsync();
        backgroundGranted = backgroundResult.status === 'granted';
      }
      
      setStatus({
        foreground: foregroundGranted,
        background: backgroundGranted,
        loading: false,
        canRequestAgain: foregroundResult.canAskAgain,
        error: foregroundGranted ? undefined : 'Location permission denied',
      });
      
      return foregroundGranted;
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Permission request failed',
      }));
      return false;
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    ...status,
    requestPermissions,
    checkPermissions,
  };
};
