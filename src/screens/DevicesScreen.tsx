import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/authService';
import { deviceService, UserDevice } from '../services/deviceService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../components/ui/Toast';
import { useConfirmationDialog } from '../components/ui/ConfirmationDialog';

export const DevicesScreen = () => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const toast = useToast();
  const { confirm, ConfirmationDialog } = useConfirmationDialog();
  const currentDeviceToken = deviceService.getDeviceToken();

  const loadDevices = async () => {
    try {
      const authService = new AuthService();
      const devices = await authService.getActiveDevices();
      setDevices(devices);
    } catch (error) {
      toast.showError('Error', 'Failed to load devices');
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  const handleDeactivateDevice = async (device: UserDevice) => {
    if (device.device_token === currentDeviceToken) {
      const confirmed = await confirm(
        'Sign Out Current Device',
        'This is your current device. Deactivating it will sign you out of the app. Are you sure you want to continue?',
        {
          confirmLabel: 'Sign Out',
          cancelLabel: 'Cancel',
          variant: 'warning',
          icon: 'log-out'
        }
      );

      if (confirmed) {
        try {
          const authService = new AuthService();
          await authService.signOut();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' as never }],
          });
        } catch (error) {
          toast.showError('Error', 'Failed to sign out');
          console.error('Error signing out:', error);
        }
      }
    } else {
      const confirmed = await confirm(
        'Deactivate Device',
        `Are you sure you want to deactivate "${device.device_name}"? This will sign out the device immediately.`,
        {
          confirmLabel: 'Deactivate',
          cancelLabel: 'Cancel',
          variant: 'danger',
          icon: 'trash'
        }
      );

      if (confirmed) {
        try {
          await deviceService.deactivateDevice(device.device_id);
          await loadDevices();
          toast.showSuccess('Success', 'Device deactivated successfully');
        } catch (error) {
          toast.showError('Error', 'Failed to deactivate device');
          console.error('Error deactivating device:', error);
        }
      }
    }
  };

  const renderDevice = ({ item }: { item: UserDevice }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {item.device_name}
          {item.device_token === currentDeviceToken && ' (Current)'}
        </Text>
        <Text style={styles.lastActive}>
          Last active: {new Date(item.last_active).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deactivateButton}
        onPress={() => handleDeactivateDevice(item)}
      >
        <Text style={styles.deactivateText}>Deactivate</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Active Devices</Text>
      <Text style={styles.subheader}>
        You can have up to 2 active devices at a time
      </Text>
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.device_id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No active devices found</Text>
        }
      />
      <ConfirmationDialog />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastActive: {
    fontSize: 14,
    color: '#666',
  },
  deactivateButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deactivateText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
});
