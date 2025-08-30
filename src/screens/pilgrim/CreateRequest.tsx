import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
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
        const { data, error } = await storageService.uploadImage(
          formData.photo.uri,
          'request-photos'
        );
        
        if (error) {
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
          return;
        }
        
        photoUrl = data || '';
        setImageLoading(false);
      }

      const { error } = await createRequest({
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
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

  const showImagePicker = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleTakePhoto },
        { text: 'Gallery', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getRequestTypeLabel = (type: RequestType) => {
    const requestType = REQUEST_TYPES.find(t => t.value === type);
    return requestType?.label || type;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 ml-4">Create Request</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Request Details</Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">Request Type</Text>
            <View className="border border-gray-300 rounded-lg">
              <Picker
                selectedValue={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                style={{ height: 50 }}
              >
                {REQUEST_TYPES.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          <Input
            label="Title"
            placeholder="Brief description of your request"
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            error={errors.title}
          />

          <Input
            label="Description"
            placeholder="Provide detailed information about your request"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top' }}
            error={errors.description}
          />

          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">Priority Level</Text>
            <View className="flex-row">
              {PRIORITY_LEVELS.map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  onPress={() => setFormData(prev => ({ ...prev, priority: priority.value as Priority }))}
                  className={`mr-3 px-4 py-2 rounded-full border ${
                    formData.priority === priority.value
                      ? 'border-2'
                      : 'border-gray-300'
                  }`}
                  style={{
                    borderColor: formData.priority === priority.value ? priority.color : '#d1d5db',
                    backgroundColor: formData.priority === priority.value ? priority.color + '20' : 'white'
                  }}
                >
                  <Text className={`text-sm font-medium ${
                    formData.priority === priority.value ? 'font-bold' : ''
                  }`} style={{ color: priority.color }}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Photo Upload */}
        <Card style={{ marginBottom: 16 }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Add Photo (Optional)</Text>
            <TouchableOpacity onPress={showImagePicker}>
              <Ionicons name="camera" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {formData.photo ? (
            <View className="relative">
              <Image
                source={{ uri: formData.photo.uri }}
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setFormData(prev => ({ ...prev, photo: null }))}
                className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={showImagePicker}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center"
            >
              <Ionicons name="camera-outline" size={32} color={COLORS.textSecondary} />
              <Text className="text-gray-500 mt-2">Tap to add photo</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Location Info */}
        <Card style={{ marginBottom: 16 }}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-bold text-gray-900">Location</Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {currentLocation ? (
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="location" size={16} color={COLORS.success} />
                <Text className="text-gray-600 ml-2">Current location detected</Text>
              </View>
              <Text className="text-gray-500 text-sm">
                Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          ) : (
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={16} color={COLORS.error} />
                <Text className="text-red-600 ml-2">Location not available</Text>
              </View>
              <Text className="text-gray-500 text-sm">
                Please enable location services to submit your request
              </Text>
              {errors.location && (
                <Text className="text-red-500 text-sm mt-1">{errors.location}</Text>
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
          style={{ marginBottom: 32 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateRequest;
