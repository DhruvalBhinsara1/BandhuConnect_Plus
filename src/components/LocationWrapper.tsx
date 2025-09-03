import React from 'react';
import { View } from 'react-native';
import { useLocation } from '../context/LocationContext';
import { LocationPermissionModal } from './LocationPermissionModal';
import { useLocationPermission } from '../hooks/useLocationPermission';

interface LocationWrapperProps {
  children: React.ReactNode;
}

export const LocationWrapper: React.FC<LocationWrapperProps> = ({ children }) => {
  const { showPermissionModal, setShowPermissionModal, requestPermissions } = useLocation();
  const { canRequestAgain } = useLocationPermission();

  const handleRequestPermission = async () => {
    try {
      await requestPermissions();
      setShowPermissionModal(false);
    } catch (error) {
      console.error('Failed to request permissions:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      <LocationPermissionModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onRequestPermission={handleRequestPermission}
        canRequestAgain={canRequestAgain}
      />
    </View>
  );
};
