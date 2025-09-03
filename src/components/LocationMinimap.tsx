import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { useNavigation } from '@react-navigation/native';

interface LocationMinimapProps {
  style?: any;
}

const LocationMinimap: React.FC<LocationMinimapProps> = ({ style }) => {
  const { currentLocation, isTracking } = useLocation();
  const navigation = useNavigation<any>();

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(4);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePress = () => {
    navigation.navigate('Map');
  };

  if (!currentLocation) {
    return null; // Don't show anything if location is unavailable
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#e5e7eb'
      }, style]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons 
              name={isTracking ? "location" : "location-outline"} 
              size={16} 
              color={isTracking ? "#059669" : "#6b7280"} 
            />
            <Text style={{ 
              marginLeft: 6, 
              fontSize: 14, 
              fontWeight: '600',
              color: '#111827'
            }}>
              Location: {formatCoordinate(currentLocation.latitude)}, {formatCoordinate(currentLocation.longitude)}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={{ 
              marginLeft: 6, 
              fontSize: 12, 
              color: '#6b7280'
            }}>
              Last updated: {formatTime(currentLocation.timestamp.toString())}
            </Text>
          </View>
        </View>
        
        <View style={{ 
          backgroundColor: '#f0fdf4', 
          borderRadius: 20, 
          padding: 8,
          marginLeft: 12
        }}>
          <Ionicons name="map" size={16} color="#059669" />
        </View>
      </View>
      
      {currentLocation.accuracy && (
        <View style={{ 
          marginTop: 8, 
          paddingTop: 8, 
          borderTopWidth: 1, 
          borderTopColor: '#f3f4f6' 
        }}>
          <Text style={{ 
            fontSize: 11, 
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            Accuracy: ±{Math.round(currentLocation.accuracy).toString()}m
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default LocationMinimap;
