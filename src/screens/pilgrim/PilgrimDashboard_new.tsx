import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { useLocation } from '../../context/LocationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import VolunteerTrackingMinimap from '../../components/common/VolunteerTrackingMinimap';
import { useTheme } from '../../theme';
import { STATUS_COLORS, REQUEST_TYPES } from '../../constants';
import { secureMapService, UserLocationData } from '../../services/secureMapService';
import { locationService } from '../../services/locationService';

const PilgrimDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { userRequests, getActiveRequests, getRequestVolunteerAssignments } = useRequest();
  const { location, getCurrentLocation } = useLocation();
  const theme = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeHelp, setActiveHelp] = useState<any>(null);
  const [volunteerLocation, setVolunteerLocation] = useState<UserLocationData | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadActiveHelp();
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeHelp?.volunteer_id) {
      loadVolunteerLocation();
      const interval = setInterval(loadVolunteerLocation, 15000);
      return () => clearInterval(interval);
    }
  }, [activeHelp?.volunteer_id]);

  const loadActiveHelp = async () => {
    try {
      await getActiveRequests();
      const assignments = await getRequestVolunteerAssignments();
      
      const activeAssignment = assignments?.find((assignment: any) => 
        assignment.pilgrim_id === user?.id &&
        assignment.status === 'in_progress'
      );
      
      if (activeAssignment) {
        setActiveHelp(activeAssignment);
      } else {
        setActiveHelp(null);
      }
    } catch (error) {
      console.error('Error loading active help:', error);
    }
  };

  const loadVolunteerLocation = async () => {
    if (!activeHelp?.volunteer_id) return;
    
    try {
      const location = await secureMapService.getLastKnownLocation(activeHelp.volunteer_id);
      setVolunteerLocation(location);
    } catch (error) {
      console.error('Error loading volunteer location:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation();
    await loadActiveHelp();
    setRefreshing(false);
  };

  const handleCreateRequest = (type: string) => {
    navigation.navigate('CreateRequest', { 
      initialType: type,
      isQuickRequest: true 
    });
  };

  const navigateToRequests = () => {
    navigation.navigate('MyRequests');
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  const navigateToHelp = () => {
    navigation.navigate('Help');
  };

  const navigateToDocuments = () => {
    navigation.navigate('Documents');
  };

  const navigateToPrivacy = () => {
    navigation.navigate('Privacy');
  };

  const navigateToMap = () => {
    navigation.navigate('MapView');
  };

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: theme.background,
    }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 100 // Extra padding for bottom tab bar
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24,
          paddingHorizontal: 4,
        }}>
          <View>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: theme.textPrimary,
              marginBottom: 4,
            }}>
              Welcome, {user?.user_metadata?.first_name || 'Pilgrim'}!
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: theme.textSecondary,
            }}>
              How can we help you today?
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={navigateToProfile}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="person-circle-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>

        {/* Status Card - Currently Getting Help */}
        {activeHelp && (
          <Card style={{ 
            marginBottom: 24, 
            backgroundColor: '#f0f9ff',
            borderColor: '#0ea5e9',
            borderWidth: 1,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: '#0ea5e9',
                borderRadius: 20,
                padding: 8,
                marginRight: 12,
              }}>
                <Ionicons name="shield-checkmark" size={28} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  color: '#0c4a6e',
                  marginBottom: 4,
                }}>
                  Help is on the way!
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: '#075985',
                }}>
                  {activeHelp.volunteer_name} is coming to assist you
                </Text>
              </View>
            </View>

            {/* Volunteer Tracking Minimap */}
            {activeHelp.volunteer_id && (
              <VolunteerTrackingMinimap
                volunteerId={activeHelp.volunteer_id}
                pilgrimLocation={location}
                variant="dashboard"
                refreshInterval={15000}
              />
            )}
          </Card>
        )}

        {/* Quick Request Actions */}
        <Card style={{ marginBottom: 24, backgroundColor: theme.surface }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 16 }}>Need Help?</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {REQUEST_TYPES.map((type, index) => {
              // Create a beautiful color palette for different request types
              const colors = [
                { bg: '#fef3c7', icon: '#d97706', text: '#92400e' }, // amber
                { bg: '#dbeafe', icon: '#2563eb', text: '#1e40af' }, // blue
                { bg: '#dcfce7', icon: '#16a34a', text: '#15803d' }, // green
                { bg: '#fce7f3', icon: '#db2777', text: '#be185d' }, // pink
                { bg: '#f3e8ff', icon: '#9333ea', text: '#7c3aed' }, // purple
                { bg: '#ecfdf5', icon: '#10b981', text: '#059669' }, // emerald
              ];
              
              const colorScheme = colors[index % colors.length];
              
              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleCreateRequest(type.id)}
                  style={{
                    width: '48%',
                    backgroundColor: colorScheme.bg,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    borderRadius: 8,
                    padding: 8,
                    marginRight: 12,
                  }}>
                    <Ionicons name={type.icon as any} size={24} color={colorScheme.icon} />
                  </View>
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: '600', 
                    color: colorScheme.text,
                    flex: 1,
                  }}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* My Requests */}
        <Card style={{ marginBottom: 24, backgroundColor: theme.surface }}>
          <TouchableOpacity 
            onPress={navigateToRequests}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{
                backgroundColor: theme.info,
                borderRadius: 12,
                padding: 12,
                marginRight: 16,
              }}>
                <Ionicons name="list" size={24} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary }}>My Requests</Text>
                <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 2 }}>
                  View and manage your requests
                </Text>
                {userRequests && userRequests.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                    <Text style={{ fontSize: 12, color: theme.success, marginLeft: 4 }}>
                      {userRequests.length} active request{userRequests.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </div>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Quick Actions Grid */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: theme.textPrimary, 
            marginBottom: 16,
            paddingHorizontal: 4,
          }}>
            Quick Actions
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {/* Create Request */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('CreateRequest')}
              style={{
                width: '48%',
                backgroundColor: theme.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View style={{
                backgroundColor: theme.secondary,
                borderRadius: 10,
                padding: 10,
                marginRight: 12,
              }}>
                <Ionicons name="add-circle" size={24} color={theme.secondary} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, flex: 1 }}>New Request</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* Map View */}
            <TouchableOpacity 
              onPress={navigateToMap}
              style={{
                width: '48%',
                backgroundColor: theme.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View style={{
                backgroundColor: theme.info,
                borderRadius: 10,
                padding: 10,
                marginRight: 12,
              }}>
                <Ionicons name="list" size={24} color={theme.info} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, flex: 1 }}>My Requests</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* Map View */}
            <TouchableOpacity 
              onPress={navigateToMap}
              style={{
                width: '48%',
                backgroundColor: theme.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View style={{
                backgroundColor: theme.info,
                borderRadius: 10,
                padding: 10,
                marginRight: 12,
              }}>
                <Ionicons name="map" size={24} color={theme.info} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, flex: 1 }}>Map View</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & Information */}
        <Card style={{ backgroundColor: theme.surface }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: theme.textPrimary, 
            marginBottom: 16,
          }}>
            Support & Information
          </Text>
          
          {/* Help & Support */}
          <TouchableOpacity 
            onPress={navigateToHelp}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <View style={{
              backgroundColor: theme.error,
              borderRadius: 8,
              padding: 8,
              marginRight: 16,
            }}>
              <Ionicons name="help-circle-outline" size={24} color={theme.error} />
            </View>
            <Text style={{ fontSize: 16, color: theme.textPrimary, flex: 1 }}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          {/* Documents */}
          <TouchableOpacity 
            onPress={navigateToDocuments}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <View style={{
              backgroundColor: theme.amber,
              borderRadius: 8,
              padding: 8,
              marginRight: 16,
            }}>
              <Ionicons name="document-text-outline" size={24} color={theme.amber} />
            </View>
            <Text style={{ fontSize: 16, color: theme.textPrimary, flex: 1 }}>Documents</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity 
            onPress={navigateToPrivacy}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 12,
            }}
          >
            <View style={{
              backgroundColor: theme.teal,
              borderRadius: 8,
              padding: 8,
              marginRight: 16,
            }}>
              <Ionicons name="shield-checkmark-outline" size={24} color={theme.teal} />
            </View>
            <Text style={{ fontSize: 16, color: theme.textPrimary, flex: 1 }}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </Card>

      </View>
    </ScrollView>
  </SafeAreaView>
);
};

export default PilgrimDashboard;
