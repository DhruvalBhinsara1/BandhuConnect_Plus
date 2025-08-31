import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const OtpVerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { verifyOtp, signInWithPhone } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');

  const phone = route.params?.phone || '';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const pendingUserData = route.params?.pendingUserData;
      const fromSignup = route.params?.fromSignup;
      
      const { data, error } = await verifyOtp(phone, otp.trim(), pendingUserData);
      
      if (error) {
        setError(error.message || 'Invalid verification code. Please try again.');
      } else if (data) {
        if (fromSignup) {
          Alert.alert('Success', 'Account created and verified successfully!', [
            { text: 'OK', onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            }) }
          ]);
        } else {
          // Regular OTP login flow
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    setResendLoading(true);
    try {
      const { error } = await signInWithPhone(phone);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to resend OTP. Please try again.');
      } else {
        setTimer(60);
        Alert.alert('Success', 'Verification code sent successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-6">
        <Card style={{ maxWidth: 400, alignSelf: 'center', width: '100%' }}>
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Verify Phone</Text>
            <Text className="text-gray-600 text-center mb-2">
              Enter the 6-digit code sent to
            </Text>
            <Text className="text-gray-900 font-semibold">{phone}</Text>
          </View>

          <Input
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            leftIcon="keypad-outline"
            error={error}
          />

          <Button
            title="Verify Code"
            onPress={handleVerifyOtp}
            loading={loading}
            style={{ marginTop: 8, marginBottom: 16 }}
          />

          <View className="items-center">
            <Text className="text-gray-600 mb-2">Didn't receive the code?</Text>
            
            {timer > 0 ? (
              <Text className="text-gray-500">
                Resend code in {timer} seconds
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading}>
                <Text className="text-blue-600 font-semibold">
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row justify-center items-center mt-6">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text className="text-blue-600 font-semibold">Change Phone Number</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};

export default OtpVerificationScreen;
