import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { useLocation } from '../../context/LocationContext';
import { storageService } from '../../services/storageService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { COLORS, REQUEST_TYPES, PRIORITY_LEVELS } from '../../constants';
import { RequestType, Priority } from '../../types';
import { LocationPreview } from '../../components/LocationPreview';

const CreateRequest: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { createRequest } = useRequest();
  const { currentLocation, getCurrentLocation } = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: (route.params?.type as RequestType) || 'general',
    title: '',
    description: '',
    priority: 'medium' as Priority,
    photo: null as any,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Get current location when component mounts
    if (!currentLocation) {
      getCurrentLocation();
    }
  }, []);

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
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
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
        Alert.alert('Error', 'Failed to create request. Please try again.');
      } else {
        Alert.alert(
          'Success',
          'Your request has been submitted successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
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
    }
  };

  const handlePickImage = async () => {
    const { data, error } = await storageService.pickImage();
    if (data && !error) {
      setFormData(prev => ({ ...prev, photo: data }));
    }
  };

  const showImagePicker = async () => {
    // Request permissions first
    const permissions = await storageService.requestPermissions();
    
    if (!permissions.camera && !permissions.mediaLibrary) {
      Alert.alert(
        'Permissions Required',
        'Please enable camera and photo library permissions to add photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { 
          text: 'Camera', 
          onPress: handleTakePhoto,
          style: permissions.camera ? 'default' : 'destructive'
        },
        { 
          text: 'Gallery', 
          onPress: handlePickImage,
          style: permissions.mediaLibrary ? 'default' : 'destructive'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getRequestTypeLabel = (type: RequestType) => {
    const requestType = REQUEST_TYPES.find(t => t.value === type);
    return requestType?.label || type;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
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
        >
        <Card style={{ marginBottom: 20, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>Request Details</Text>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Additional Details (Optional)</Text>
            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: '#d1d5db',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: '#ffffff',
                minHeight: 100,
                textAlignVertical: 'top',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
              placeholder="Any specific details about your request"
              placeholderTextColor="#9ca3af"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
              blurOnSubmit={false}
              returnKeyType="default"
              textBreakStrategy="simple"
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Request Type</Text>
            <View style={{ 
              borderWidth: 1.5, 
              borderColor: '#d1d5db', 
              borderRadius: 12, 
              backgroundColor: '#ffffff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1
            }}>
              <Picker
                selectedValue={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                style={{ height: 56 }}
              >
                {REQUEST_TYPES.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>


          <View style={{ marginBottom: 0 }}>
            <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Priority Level</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {PRIORITY_LEVELS.map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  onPress={() => setFormData(prev => ({ ...prev, priority: priority.value as Priority }))}
                  style={{
                    marginRight: 12,
                    marginBottom: 8,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 25,
                    borderWidth: formData.priority === priority.value ? 2 : 1.5,
                    borderColor: formData.priority === priority.value ? priority.color : '#e5e7eb',
                    backgroundColor: formData.priority === priority.value ? priority.color + '15' : '#ffffff',
                    shadowColor: formData.priority === priority.value ? priority.color : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: formData.priority === priority.value ? 0.2 : 0.05,
                    shadowRadius: 3,
                    elevation: formData.priority === priority.value ? 3 : 1
                  }}
                >
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: formData.priority === priority.value ? '700' : '600',
                    color: formData.priority === priority.value ? priority.color : '#6b7280'
                  }}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Photo Upload */}
        <Card style={{ marginBottom: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Add Photo (Optional)</Text>
            <TouchableOpacity onPress={showImagePicker}>
              <Ionicons name="camera" size={24} color={COLORS.primary} />
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
                onPress={() => setFormData(prev => ({ ...prev, photo: null }))}
                style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#ef4444', borderRadius: 50, padding: 4 }}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={showImagePicker}
              style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 8, padding: 32, alignItems: 'center' }}
            >
              <Ionicons name="camera-outline" size={32} color={COLORS.textSecondary} />
              <Text style={{ color: '#6b7280', marginTop: 8 }}>Tap to add photo</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Location Info */}
        <Card style={{ marginBottom: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Location</Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {currentLocation ? (
            <LocationPreview
              latitude={currentLocation.latitude}
              longitude={currentLocation.longitude}
            />
          ) : (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="location-outline" size={16} color={COLORS.error} />
                <Text style={{ color: '#dc2626', marginLeft: 8 }}>Location not available</Text>
              </View>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>
                Please enable location services to submit your request
              </Text>
              {errors.location && (
                <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.location}</Text>
              )}
            </View>
          )}
        </Card>

        {/* Submit Button */}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateRequest;
