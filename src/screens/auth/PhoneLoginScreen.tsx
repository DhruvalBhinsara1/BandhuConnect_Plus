import React, { useState } from 'react';
import { View, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const PhoneLoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signInWithPhone } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = () => {
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    if (!/^\+?[\d\s-()]+$/.test(phone)) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validatePhone()) return;

    setLoading(true);
    try {
      const { error } = await signInWithPhone(phone.trim());
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
      } else {
        navigation.navigate('OtpVerification', { phone: phone.trim() });
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-6">
        <Card style={{ maxWidth: 400, alignSelf: 'center', width: '100%' }}>
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Pilgrim Sign In</Text>
            <Text className="text-gray-600 text-center">
              Sign in with your phone number
            </Text>
          </View>

          <Input
            label="Phone Number"
            placeholder="+1 234 567 8900"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
            error={error}
          />

          <Button
            title="Send Verification Code"
            onPress={handleSendOtp}
            loading={loading}
            style={{ marginTop: 8, marginBottom: 16 }}
          />

          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600">Prefer email? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-blue-600 font-semibold">Sign in with Email</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};

export default PhoneLoginScreen;
