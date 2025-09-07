import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { useLocation } from '../../context/LocationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import VolunteerTrackingMinimap from '../../components/common/VolunteerTrackingMinimap';
import { COLORS, STATUS_COLORS, REQUEST_TYPES } from '../../constants';
import { secureMapService, UserLocationData } from '../../services/secureMapService';

const PilgrimDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { requests, getRequests } = useRequest();
  const { currentLocation, getCurrentLocation } = useLocation();
  
  const [refreshing, setRefreshing] = useState(false);
  const [volunteerLocation, setVolunteerLocation] = useState<UserLocationData | null>(null);

  // Distance calculation function
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Same working logic as CreateRequest
  const calculatedDistance = volunteerLocation && currentLocation 
    ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        volunteerLocation.latitude,
        volunteerLocation.longitude
      )
    : 0;

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    }
    return `${(distance / 1000).toFixed(1)} km`;
  };

  const estimatedArrival = calculatedDistance > 0 
    ? `${Math.round((calculatedDistance / 1000) / 5 * 60)} min` 
    : null;

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    await getRequests({ userId: user.id });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation(); // Refresh current location
    await loadDashboardData(); // Refresh requests
    if (assignedRequest) {
      await loadVolunteerLocation(); // Refresh volunteer location
    }
    setRefreshing(false);
  };

  const myRequests = requests.filter(r => r.user_id === user?.id);
  const activeRequests = myRequests.filter(r => 
    ['pending', 'assigned', 'in_progress'].includes(r.status)
  );
  const completedRequests = myRequests.filter(r => r.status === 'completed');

  // Get the real assignment data from active requests
  const assignedRequest = activeRequests.find(r => r.status === 'assigned' || r.status === 'in_progress');

  useEffect(() => {
    // Load volunteer location when there's an assignment
    if (assignedRequest) {
      loadVolunteerLocation();
      const interval = setInterval(loadVolunteerLocation, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [assignedRequest?.id]);

  const loadVolunteerLocation = async () => {
    if (!assignedRequest) return;
    
    try {
      const location = await secureMapService.getCounterpartLocation();
      setVolunteerLocation(location);
    } catch (error) {
      console.error('Error loading volunteer location:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={{ backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Welcome,</Text>
              <Text style={{ color: '#bbf7d0', fontSize: 18 }}>{user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle-outline" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, flex: 1, marginRight: 8 }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{activeRequests.length}</Text>
              <Text style={{ color: '#bbf7d0', fontSize: 12 }}>Active Requests</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, flex: 1, marginLeft: 8 }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{completedRequests.length}</Text>
              <Text style={{ color: '#bbf7d0', fontSize: 12 }}>Completed</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Always-visible Location/Volunteer Tracking Minimap */}
          <Card style={{ 
            marginBottom: 24, 
            backgroundColor: assignedRequest ? '#f0f9ff' : activeRequests.length > 0 ? '#fef3c7' : '#f0fdf4',
            borderColor: assignedRequest ? '#0ea5e9' : activeRequests.length > 0 ? '#f59e0b' : '#16a34a',
            borderWidth: 1,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: assignedRequest ? '#0ea5e9' : activeRequests.length > 0 ? '#f59e0b' : '#16a34a',
                borderRadius: 20,
                padding: 8,
                marginRight: 12,
              }}>
                <Ionicons 
                  name={assignedRequest ? "shield-checkmark" : activeRequests.length > 0 ? "time-outline" : "location-outline"} 
                  size={28} 
                  color="white" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  color: assignedRequest ? '#0c4a6e' : activeRequests.length > 0 ? '#92400e' : '#15803d',
                  marginBottom: 4,
                }}>
                  {assignedRequest ? 'Help is on the way!' : activeRequests.length > 0 ? 'Looking for volunteers' : 'Your Current Location'}
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: assignedRequest ? '#075985' : activeRequests.length > 0 ? '#b45309' : '#166534',
                }}>
                  {assignedRequest 
                    ? `A volunteer is coming to assist you`
                    : activeRequests.length > 0 
                      ? "We're finding the best volunteer to help you"
                      : "Ready to help when you need it"
                  }
                </Text>
              </View>
            </View>

            {/* Minimap - always visible */}
            <VolunteerTrackingMinimap
              currentLocation={currentLocation}
              volunteerLocation={assignedRequest ? volunteerLocation : null}
              calculatedDistance={calculatedDistance}
              estimatedArrival={estimatedArrival}
              formatDistance={formatDistance}
              variant="dashboard"
            />
          </Card>

          {/* Quick Request Actions */}
          <Card style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Need Help?</Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {REQUEST_TYPES.map((type, index) => {
                // Color mapping based on urgency and meaning
                const getColorScheme = (requestType: string) => {
                  switch (requestType) {
                    case 'medical':
                      return { bg: '#fef2f2', icon: '#dc2626' }; // Red - high urgency, health risk
                    case 'emergency':
                      return { bg: '#fff7ed', icon: '#ea580c' }; // Orange - alert, caution
                    case 'lost_person':
                      return { bg: '#eff6ff', icon: '#2563eb' }; // Blue - calm, information, search
                    case 'sanitation':
                      return { bg: '#f0fdf4', icon: '#16a34a' }; // Green - cleanliness, health, eco
                    case 'crowd_management':
                      return { bg: '#faf5ff', icon: '#9333ea' }; // Purple - coordination, collective action
                    case 'guidance':
                      return { bg: '#f0fdfa', icon: '#0d9488' }; // Teal - support, navigation
                    case 'general':
                      return { bg: '#f9fafb', icon: '#6b7280' }; // Grey - non-urgent, catch-all
                    default:
                      return { bg: '#f9fafb', icon: '#6b7280' }; // Default grey
                  }
                };
                
                const colorScheme = getColorScheme(type.value);
                
                return (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => navigation.navigate('CreateRequest', { type: type.value })}
                    style={{ alignItems: 'center', width: '30%', marginBottom: 16 }}
                  >
                    <View style={{ 
                      backgroundColor: colorScheme.bg, 
                      padding: 16, 
                      borderRadius: 50, 
                      marginBottom: 8,
                      shadowColor: colorScheme.icon,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}>
                      <Ionicons name={type.icon as any} size={24} color={colorScheme.icon} />
                    </View>
                    <Text style={{ color: '#374151', fontSize: 10, textAlign: 'center', fontWeight: '500' }}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

          </Card>

          {/* Active Requests */}
          {activeRequests.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Active Requests</Text>
                <TouchableOpacity onPress={() => navigation.navigate('RequestStatus')}>
                  <Text style={{ color: '#059669', fontWeight: '600' }}>View All</Text>
                </TouchableOpacity>
              </View>

              {activeRequests.slice(0, 3).map((request) => (
                <TouchableOpacity
                  key={request.id}
                  onPress={() => navigation.navigate('RequestStatus', { requestId: request.id })}
                  style={{ borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 12 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                        {request.title}
                      </Text>
                      <Text style={{ color: '#4b5563', fontSize: 12, marginBottom: 8 }}>
                        {request.description}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{ 
                            paddingHorizontal: 8, 
                            paddingVertical: 4, 
                            borderRadius: 50, 
                            marginRight: 8,
                            backgroundColor: STATUS_COLORS[request.status] + '20' 
                          }}
                        >
                          <Text
                            style={{ 
                              fontSize: 10, 
                              fontWeight: '500', 
                              textTransform: 'capitalize',
                              color: STATUS_COLORS[request.status] 
                            }}
                          >
                            {request.status.replace('_', ' ')}
                          </Text>
                        </View>
                        <Text style={{ color: '#6b7280', fontSize: 10 }}>
                          {new Date(request.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Recent Activity */}
          {completedRequests.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Recent Activity</Text>
              
              {completedRequests.slice(0, 2).map((request) => (
                <View
                  key={request.id}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                    paddingVertical: 12
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontWeight: '500', color: '#111827' }}>
                        {request.title}
                      </Text>
                      <Text style={{ color: '#6b7280', fontSize: 12 }}>
                        Completed on {new Date(request.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Quick Actions */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Quick Actions</Text>
            
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateRequest')}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 16, 
                paddingHorizontal: 12,
                backgroundColor: '#f0fdf4',
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#bbf7d0'
              }}
            >
              <View style={{ backgroundColor: '#dcfce7', padding: 12, borderRadius: 50, marginRight: 16 }}>
                <Ionicons name="add-circle" size={24} color={COLORS.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>Create New Request</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Get help from nearby volunteers</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('RequestStatus')}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 16, 
                paddingHorizontal: 12,
                backgroundColor: '#eff6ff',
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#bfdbfe'
              }}
            >
              <View style={{ backgroundColor: '#dbeafe', padding: 12, borderRadius: 50, marginRight: 16 }}>
                <Ionicons name="list" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>View My Requests</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Track your assistance requests</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Map')}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 16, 
                paddingHorizontal: 12,
                backgroundColor: '#faf5ff',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e9d5ff'
              }}
            >
              <View style={{ backgroundColor: '#ede9fe', padding: 12, borderRadius: 50, marginRight: 16 }}>
                <Ionicons name="map" size={24} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>Find Nearby Help</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Locate volunteers and services</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          </Card>

          {/* App Information */}
          <Card>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>App Information</Text>
            
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 12, 
                borderBottomWidth: 1, 
                borderBottomColor: '#f3f4f6' 
              }}
            >
              <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
              <Text style={{ color: '#374151', fontSize: 16, marginLeft: 12, flex: 1 }}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 12, 
                borderBottomWidth: 1, 
                borderBottomColor: '#f3f4f6' 
              }}
            >
              <Ionicons name="document-text-outline" size={24} color="#6b7280" />
              <Text style={{ color: '#374151', fontSize: 16, marginLeft: 12, flex: 1 }}>Terms & Conditions</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 12 
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={24} color="#6b7280" />
              <Text style={{ color: '#374151', fontSize: 16, marginLeft: 12, flex: 1 }}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </Card>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PilgrimDashboard;
