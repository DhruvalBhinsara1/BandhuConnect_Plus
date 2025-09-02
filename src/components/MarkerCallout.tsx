import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Callout } from 'react-native-maps';
import { LocationPreview } from './LocationPreview';
import { UserLocationData } from '../services/mapService';

interface MarkerCalloutProps {
  location: UserLocationData;
}

export const MarkerCallout: React.FC<MarkerCalloutProps> = ({ location }) => {
  return (
    <Callout tooltip>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{location.user_name}</Text>
          <Text style={styles.role}>{location.user_role}</Text>
        </View>
        
        <LocationPreview
          latitude={location.latitude}
          longitude={location.longitude}
        />
        
        {location.assignment_info?.length > 0 && (
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentText}>
              {location.user_role === 'volunteer' 
                ? `Helping: ${location.assignment_info[0].pilgrim_name}`
                : `Assigned: ${location.assignment_info[0].volunteer_name}`
              }
            </Text>
          </View>
        )}
        
        <Text style={styles.timestamp}>
          Last updated: {new Date(location.last_updated).toLocaleTimeString()}
        </Text>
      </View>
    </Callout>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  assignmentInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  assignmentText: {
    fontSize: 14,
    color: '#4B5563',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
