import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Callout } from 'react-native-maps';
import { LocationPreview } from './LocationPreview';
import { UserLocationData } from '../services/mapService';
import { useTheme } from '../theme';

interface MarkerCalloutProps {
  location: UserLocationData;
  isStale?: boolean;
  minutesAgo?: number;
}

export const MarkerCallout: React.FC<MarkerCalloutProps> = ({ location, isStale, minutesAgo }) => {
  const { theme } = useTheme();
  
  return (
    <Callout tooltip>
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{location.user_name}</Text>
          <Text style={[styles.role, { color: theme.primary }]}>{location.user_role}</Text>
        </View>
        
        <LocationPreview
          latitude={location.latitude}
          longitude={location.longitude}
        />
        
        {location.assignment_info?.length > 0 && (
          <View style={[
            styles.assignmentInfo, 
            { 
              backgroundColor: theme.primary + '10',
              borderTopColor: theme.borderLight 
            }
          ]}>
            <Text style={[styles.assignmentText, { color: theme.textPrimary }]}>
              {location.user_role === 'volunteer' 
                ? `Helping: ${location.assignment_info[0].pilgrim_name}`
                : `Assigned: ${location.assignment_info[0].volunteer_name}`
              }
            </Text>
          </View>
        )}
        
        <Text style={[styles.timestamp, { color: theme.textSecondary }, isStale && styles.staleText]}>
          {isStale && minutesAgo ? `Last seen ${minutesAgo} min ago` : `Last updated: ${new Date(location.last_updated).toLocaleTimeString()}`}
        </Text>
      </View>
    </Callout>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  assignmentInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  assignmentText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
  },
  staleText: {
    color: '#DC2626',
    fontWeight: '600',
  },
});
