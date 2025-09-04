import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { secureMapService } from '../services/secureMapService';

interface TrackingStatusProps {
  style?: any;
}

export const TrackingStatus: React.FC<TrackingStatusProps> = ({ style }) => {
  const [status, setStatus] = useState({
    hasAssignment: false,
    counterpartName: '',
    counterpartRole: '',
    isActive: false,
    statusMessage: 'Loading...'
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const assignmentStatus = await secureMapService.getAssignmentStatus();
        setStatus({
          hasAssignment: assignmentStatus.hasAssignment,
          counterpartName: assignmentStatus.counterpartName || '',
          counterpartRole: assignmentStatus.counterpartRole || '',
          isActive: assignmentStatus.isActive,
          statusMessage: assignmentStatus.statusMessage
        });
      } catch (error) {
        setStatus({
          hasAssignment: false,
          counterpartName: '',
          counterpartRole: '',
          isActive: false,
          statusMessage: 'Unable to check tracking status'
        });
      }
    };

    fetchStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!status.hasAssignment) return '#6B7280'; // Gray
    if (status.isActive) return '#16A34A'; // Green
    return '#F59E0B'; // Orange for completed
  };

  const getStatusIcon = () => {
    if (!status.hasAssignment) return 'location-outline';
    if (status.isActive) return 'navigate';
    return 'checkmark-circle';
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusRow}>
        <Ionicons 
          name={getStatusIcon()} 
          size={16} 
          color={getStatusColor()} 
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {status.statusMessage}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
});
