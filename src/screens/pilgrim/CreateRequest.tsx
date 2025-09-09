import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Image, Alert, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { CustomSelector } from '../../components/CustomSelector';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { useLocation } from '../../context/LocationContext';
import { useToast } from '../../components/ui/Toast';
import { storageService } from '../../services/storageService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import VolunteerTrackingMinimap from '../../components/common/VolunteerTrackingMinimap';
import { useTheme } from '../../theme';
import { REQUEST_TYPES, PRIORITY_LEVELS, STATUS_COLORS } from '../../constants';
import { RequestType, Priority } from '../../types';
import { secureMapService, UserLocationData } from '../../services/secureMapService';
import { RequestService } from '../../services/requestService';
import { locationService } from '../../services/locationService';

const requestService = new RequestService();
const CreateRequest: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { createRequest } = useRequest();
  const { currentLocation, getCurrentLocation } = useLocation();
  const toast = useToast();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    type: (route.params?.type as RequestType) || 'general',
    title: '',
    description: '',
    priority: 'medium' as Priority,
    photo: null as any,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // New state for volunteer tracking
  const [helpOnWay, setHelpOnWay] = useState(false);
  const [volunteerLocation, setVolunteerLocation] = useState<UserLocationData | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<any>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);

  useEffect(() => {
    // Get current location when component mounts
    if (!currentLocation) {
      getCurrentLocation();
    }
    
    // Check if user has active requests with assigned volunteers
    checkForActiveHelp();
  }, []);

  // Check for active help assignments
  const checkForActiveHelp = async () => {
    try {
      const assignmentStatus = await secureMapService.getAssignmentStatus();
      // Fetch latest requests for the user
      const { data: userRequests } = await requestService.getRequests({ userId: user?.id });
      // Find any active request (not completed/cancelled)
      const activeRequest = userRequests?.find(
        (r) => r.status !== 'completed' && r.status !== 'cancelled'
      );
      // Only set helpOnWay to true if assignment is truly active and request is not completed/cancelled
      if (
        assignmentStatus.hasAssignment &&
        assignmentStatus.isActive &&
        activeRequest
      ) {
        setHelpOnWay(true);
        setAssignmentStatus(assignmentStatus);
        // Get volunteer location
        const volunteerLoc = await secureMapService.getCounterpartLocation();
        setVolunteerLocation(volunteerLoc);
        // Calculate distance and ETA
        if (currentLocation && volunteerLoc) {
          const distance = locationService.calculateDistance(
            currentLocation,
            volunteerLoc
          );
          setCalculatedDistance(distance);
          // Estimate arrival time (assuming 5 km/h walking speed)
          const walkingSpeedKmh = 5;
          const timeHours = distance / walkingSpeedKmh;
          const timeMinutes = Math.round(timeHours * 60);
          setEstimatedArrival(timeMinutes > 0 ? `~${timeMinutes}m` : '~0m');
        }
      } else {
        setHelpOnWay(false);
        setAssignmentStatus(null);
        setVolunteerLocation(null);
        setCalculatedDistance(null);
        setEstimatedArrival(null);
      }
    } catch (error) {
      console.error('Error checking for active help:', error);
    }
  };

  // Pull to refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh location
      await getCurrentLocation();
      // Check for active help
      await checkForActiveHelp();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh volunteer location periodically when help is on the way
  useEffect(() => {
    if (!helpOnWay) return;
    
    const interval = setInterval(checkForActiveHelp, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [helpOnWay, currentLocation]);

  // Helper functions for formatting
  const formatDistance = (distanceKm: number | null) => {
    if (distanceKm === null) return 'Unknown';
    
    if (distanceKm < 1) {
      return `${(distanceKm * 1000).toFixed(0)} meters`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(2)} km`;
    } else {
      return `${distanceKm.toFixed(1)} km`;
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!currentLocation) {
      newErrors.location = 'Location is required. Please enable location services.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let photoUrl = '';
      
      // Upload photo if selected
      if (formData.photo) {
        setImageLoading(true);
        const uploadResult = await storageService.uploadImage(
          formData.photo.uri,
          'request-photos',
          `request_${Date.now()}.jpg`
        );
        
        if (uploadResult.error) {
          toast.showError('Error', 'Failed to upload photo. Please try again.');
          return;
        }
        
        photoUrl = uploadResult.data || '';
        setImageLoading(false);
      }

      const requestType = REQUEST_TYPES.find(t => t.value === formData.type);
      const { error } = await createRequest({
        type: formData.type,
        title: requestType?.label || formData.type,
        description: formData.description.trim() || `Help needed: ${requestType?.label}`,
        priority: formData.priority,
        location: currentLocation!,
        photo_url: photoUrl,
      });

      if (error) {
        toast.showError('Error', 'Failed to create request. Please try again.');
      } else {
        toast.showSuccess('Success', 'Your request has been submitted successfully!');
        // Force refresh assignment status after submitting request
        await checkForActiveHelp();
        navigation.goBack();
      }
    } finally {
      setLoading(false);
      setImageLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    const { data, error } = await storageService.takePhoto();
    if (data && !error) {
      setFormData(prev => ({ ...prev, photo: data }));
    } else if (error) {
      toast.showError('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickImage = async () => {
    const { data, error } = await storageService.pickImage();
    if (data && !error) {
      setFormData(prev => ({ ...prev, photo: data }));
    } else if (error) {
      toast.showError('Error', 'Failed to select image. Please try again.');
    }
  };

  const showImagePicker = async () => {
    // Request permissions first
    const permissions = await storageService.requestPermissions();
    
    if (!permissions.camera && !permissions.mediaLibrary) {
      toast.showWarning(
        'Permissions Required',
        'Please enable camera and photo library permissions to add photos.'
      );
      return;
    }

    // Show action sheet with options
    if (permissions.camera && permissions.mediaLibrary) {
      Alert.alert(
        'Add Photo',
        'Choose how you want to add a photo',
        [
          {
            text: 'Take Photo',
            onPress: handleTakePhoto,
          },
          {
            text: 'Choose from Gallery',
            onPress: handlePickImage,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } else if (permissions.camera) {
      handleTakePhoto();
    } else if (permissions.mediaLibrary) {
      handlePickImage();
    }
  };

  const getRequestTypeLabel = (type: RequestType) => {
    const requestType = REQUEST_TYPES.find(t => t.value === type);
    return requestType?.label || type;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: theme.surface,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        shadowColor: theme.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: theme.primary + '15',
              borderRadius: 12,
              padding: 8,
              marginRight: 12,
            }}>
              <Ionicons name="hand-right" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold', 
                color: theme.textPrimary,
                marginBottom: 4,
              }}>
                Request Help
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: theme.textSecondary,
                lineHeight: 20,
              }}>
                {helpOnWay ? 
                  "Help is on the way! Your request is being handled." : 
                  "Describe your situation and get assistance from nearby volunteers"
                }
              </Text>
            </View>
          </View>
          <View style={{ 
            backgroundColor: helpOnWay ? '#dcfce7' : theme.primary + '20',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '600',
              color: helpOnWay ? '#16a34a' : theme.primary,
            }}>
              {helpOnWay ? 'ACTIVE' : 'NEW REQUEST'}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="none"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
        {/* Help Status Card - Shows when volunteer is assigned */}
        {helpOnWay && (
          <Card style={{ 
            marginBottom: 24, // Increased for better separation from form
            padding: 20, 
            backgroundColor: '#f0f9ff', // Blue theme like dashboard
            borderColor: '#0ea5e9',
            borderWidth: 1,
          }}>
            {/* Header Section */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 20, // Increased breathing room
              paddingBottom: 4, // Subtle visual separation
            }}>
              <View style={{
                backgroundColor: '#0ea5e9',
                borderRadius: 20,
                padding: 8,
                marginRight: 12,
              }}>
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#0c4a6e', // Blue text to match dashboard
                marginLeft: 12,
                flex: 1, // Better text alignment
              }}>
                🚨 Help is On The Way!
              </Text>
            </View>
            
            {/* Volunteer Tracking Minimap */}
            <VolunteerTrackingMinimap
              currentLocation={currentLocation}
              volunteerLocation={volunteerLocation}
              calculatedDistance={calculatedDistance}
              estimatedArrival={estimatedArrival}
              formatDistance={formatDistance}
              variant="request"
            />
            
            {/* Legend */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: '#f0fdf4',
              borderRadius: 12,
              marginBottom: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
                <View style={{ 
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  backgroundColor: '#ef4444',
                  marginRight: 8,
                }} />
                <Text style={{ fontSize: 13, color: '#166534', fontWeight: '500' }}>You</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  backgroundColor: '#16a34a',
                  marginRight: 8,
                }} />
                <Text style={{ fontSize: 13, color: '#166534', fontWeight: '500' }}>Volunteer</Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={{ marginBottom: 20, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 20 }}>Request Details</Text>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Additional Details (Optional)</Text>
            <TextInput
              style={{
                borderWidth: 2,
                borderColor: helpOnWay ? '#d1d5db' : theme.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: helpOnWay ? '#f3f4f6' : theme.surface,
                color: helpOnWay ? '#9ca3af' : theme.textPrimary,
                minHeight: 100,
                textAlignVertical: 'top',
                shadowColor: theme.textPrimary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
              placeholder={helpOnWay ? "Form disabled - Help is on the way" : "Any specific details about your request"}
              placeholderTextColor={helpOnWay ? '#9ca3af' : theme.textTertiary}
              value={formData.description}
              onChangeText={helpOnWay ? undefined : (text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
              blurOnSubmit={false}
              returnKeyType="default"
              textBreakStrategy="simple"
              editable={!helpOnWay}
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Request Type</Text>
            <View style={{ opacity: helpOnWay ? 0.5 : 1 }}>
              <CustomSelector
                options={REQUEST_TYPES}
                value={formData.type}
                onSelect={helpOnWay ? undefined : (value) => setFormData(prev => ({ ...prev, type: value as RequestType }))}
                placeholder="Select request type"
              />
            </View>
            {helpOnWay && (
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                Form disabled - Help is already on the way
              </Text>
            )}
          </View>


          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Priority Level</Text>
            <View style={{ opacity: helpOnWay ? 0.5 : 1 }}>
              <CustomSelector
                options={PRIORITY_LEVELS}
                value={formData.priority}
                onSelect={helpOnWay ? undefined : (value) => setFormData(prev => ({ ...prev, priority: value as Priority }))}
                placeholder="Select priority level"
              />
            </View>
          </View>
        </Card>

        {/* Photo Upload */}
        <Card style={{ marginBottom: 20, padding: 20, opacity: helpOnWay ? 0.5 : 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary }}>Add Photo (Optional)</Text>
            <TouchableOpacity onPress={helpOnWay ? undefined : showImagePicker} disabled={helpOnWay}>
              <Ionicons name="camera" size={24} color={helpOnWay ? '#9ca3af' : theme.primary} />
            </TouchableOpacity>
          </View>

          {formData.photo ? (
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: formData.photo.uri }}
                style={{ width: '100%', height: 192, borderRadius: 8 }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={helpOnWay ? undefined : () => setFormData(prev => ({ ...prev, photo: null }))}
                style={{ position: 'absolute', top: 8, right: 8, backgroundColor: theme.error, borderRadius: 50, padding: 4 }}
                disabled={helpOnWay}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={helpOnWay ? undefined : showImagePicker}
              style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: theme.border, borderRadius: 8, padding: 32, alignItems: 'center' }}
              disabled={helpOnWay}
            >
              <Ionicons name="camera-outline" size={32} color={helpOnWay ? '#9ca3af' : theme.textSecondary} />
              <Text style={{ color: helpOnWay ? '#9ca3af' : theme.textSecondary, marginTop: 8 }}>
                {helpOnWay ? 'Photo upload disabled' : 'Tap to add photo'}
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Location Info */}
        <Card style={{ marginBottom: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary }}>Location</Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Ionicons name="refresh" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {currentLocation ? (
            <View>
              {/* Show only simple location confirmation when help is on the way, detailed map when not */}
              {helpOnWay ? (
                // Simple location confirmation when help is active (detailed tracking is shown above)
                <View style={{
                  backgroundColor: '#f0f9ff',
                  padding: 12,
                  borderRadius: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="location" size={16} color="#0369a1" />
                    <Text style={{ 
                      color: '#0369a1', 
                      fontWeight: '600', 
                      marginLeft: 6,
                      fontSize: 13,
                    }}>
                      Location Confirmed
                    </Text>
                  </View>
                  <Text style={{ 
                    color: '#0369a1', 
                    fontSize: 11,
                    opacity: 0.8,
                  }}>
                    � {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              ) : (
                // Show user location only when no help assigned
                <View>
                  <View style={{
                    height: 200, // Even larger for better visibility
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 8, // Reduced margin since info is more compact
                  }}>
                    <MapView
                      provider={PROVIDER_GOOGLE}
                      style={{ flex: 1 }}
                      region={{
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                        latitudeDelta: 0.005, // Zomato-style zoom (250-300 meters) for good street context
                        longitudeDelta: 0.005, // Zomato-style zoom (250-300 meters) for good street context
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      rotateEnabled={false}
                      pitchEnabled={false}
                    >
                      <Marker
                        coordinate={{
                          latitude: currentLocation.latitude,
                          longitude: currentLocation.longitude,
                        }}
                        title="Your Location"
                        pinColor="#ef4444"
                      />
                    </MapView>
                  </View>
                  
                  <View style={{
                    backgroundColor: '#f0f9ff',
                    padding: 8, // Reduced padding
                    borderRadius: 6,
                    marginBottom: 6,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Ionicons name="location" size={14} color="#0369a1" />
                      <Text style={{ 
                        color: '#0369a1', 
                        fontWeight: '600', 
                        marginLeft: 4,
                        fontSize: 12, // Smaller text
                      }}>
                        Location Confirmed
                      </Text>
                    </View>
                    <Text style={{ 
                      color: '#0369a1', 
                      fontSize: 10, // Much smaller coordinates
                      opacity: 0.8,
                    }}>
                      📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                    </Text>
                  </View>
                  
                  <Text style={{ 
                    color: '#6b7280',
                    fontSize: 12, // Smaller helper text
                    textAlign: 'center',
                    fontStyle: 'italic',
                    lineHeight: 16,
                  }}>
                    Submit your request to get help from nearby volunteers
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="location-outline" size={16} color={theme.error} />
                <Text style={{ color: theme.error, marginLeft: 8 }}>Location not available</Text>
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                Please enable location services to submit your request
              </Text>
              {errors.location && (
                <Text style={{ color: theme.error, fontSize: 12, marginTop: 4 }}>{errors.location}</Text>
              )}
            </View>
          )}
        </Card>

        {/* Submit Button */}
        {helpOnWay ? (
          <Button
            title="Help is On The Way! 🚑"
            onPress={() => navigation.navigate('Map')}
            variant="outline"
            style={{ 
              marginBottom: 40,
              marginTop: 10,
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: '#dcfce7',
              borderColor: '#16a34a'
            }}
          />
        ) : (
          <Button
            title={imageLoading ? "Uploading Photo..." : "Submit Request"}
            onPress={handleSubmit}
            loading={loading || imageLoading}
            disabled={!currentLocation}
            style={{ 
              marginBottom: 40,
              marginTop: 10,
              paddingVertical: 16,
              borderRadius: 12
            }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
};

export default CreateRequest;
