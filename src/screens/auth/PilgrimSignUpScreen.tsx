import React, { useState, useRef } from 'react';
import { View, Text, SafeAreaView, Alert, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ControlledInput from '../../components/common/ControlledInput';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants';

const PilgrimSignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    console.log('[PilgrimSignUp] handleSignUp called');
    if (!validateForm()) {
      console.log('[PilgrimSignUp] Validation failed');
      return;
    }

    setLoading(true);
    console.log('[PilgrimSignUp] Starting signup process');
    try {
      const result = await signUp(formData.email, formData.password, {
        name: formData.name,
        phone: formData.phone,
        role: 'pilgrim'
      });
      
      if (result.error) {
        console.log('[PilgrimSignUp] Signup error:', result.error);
        Alert.alert('Error', result.error.message || 'Failed to create account');
      } else if (result.data?.phoneOtpRequired) {
        console.log('[PilgrimSignUp] Phone OTP required');
        Alert.alert(
          'Verify Your Phone', 
          `We sent an OTP to ${result.data.phone}. Please enter the code to complete your registration.`,
          [{ text: 'OK', onPress: () => navigation.navigate('OtpVerification', { 
            phone: result.data.phone, 
            pendingUserData: result.data.pendingUserData,
            fromSignup: true 
          }) }]
        );
      } else if (result.data?.emailConfirmationRequired) {
        console.log('[PilgrimSignUp] Email confirmation required');
        // Save pending user data for profile creation after email confirmation
        await AsyncStorage.setItem('pendingUserData', JSON.stringify(result.data.pendingUserData));
        Alert.alert(
          'Check Your Email', 
          'We sent you a confirmation email. Please click the link to verify your account, then return to sign in.',
          [{ text: 'OK', onPress: () => navigation.navigate('PilgrimLogin') }]
        );
      } else {
        console.log('[PilgrimSignUp] Signup successful, navigating...');
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          }) }
        ]);
      }
    } catch (error: any) {
      console.log('[PilgrimSignUp] Signup error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join as Pilgrim</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        keyboardDismissMode="none"
        automaticallyAdjustKeyboardInsets={false}
      >
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome to BandhuConnect+</Text>
            <Text style={styles.subtitle}>Create your pilgrim account to get assistance</Text>
          </View>

          <View style={styles.formContainer}>
            <ControlledInput
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              leftIcon="person-outline"
              error={errors.name}
            />

            <ControlledInput
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              leftIcon="mail-outline"
              error={errors.email}
            />

            <ControlledInput
              label="Phone Number"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              leftIcon="call-outline"
              error={errors.phone}
            />

            <ControlledInput
              label="Address (Optional)"
              placeholder="Enter your address"
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              leftIcon="location-outline"
              error={errors.address}
            />

            <ControlledInput
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <ControlledInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
            />
          </View>

          <Button
            title="Create Pilgrim Account"
            onPress={handleSignUp}
            loading={loading}
            style={styles.createButton}
          />

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PilgrimLogin')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  createButton: {
    marginBottom: 16,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  signInText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signInLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default PilgrimSignUpScreen;
