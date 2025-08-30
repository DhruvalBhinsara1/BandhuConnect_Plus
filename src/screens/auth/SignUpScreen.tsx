import React, { useState } from 'react';
import { View, Text, SafeAreaView, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { UserRole, VOLUNTEER_SKILLS } from '../../types';

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'pilgrim' as UserRole,
    age: '',
    skills: [] as string[],
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.role === 'volunteer' && formData.skills.length === 0) {
      newErrors.skills = 'Please select at least one skill';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        skills: formData.role === 'volunteer' ? formData.skills : [],
        age: formData.age ? parseInt(formData.age) : undefined,
      };

      const { error } = await signUp(formData.email.trim(), formData.password, userData);
      
      if (error) {
        Alert.alert('Sign Up Failed', error.message || 'Please try again.');
      } else {
        Alert.alert('Success', 'Account created successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 py-4">
        <Card style={{ maxWidth: 400, alignSelf: 'center', width: '100%' }}>
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
            <Text className="text-gray-600 text-center">Join our community platform</Text>
          </View>

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            leftIcon="person-outline"
            error={errors.name}
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />

          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
            leftIcon="call-outline"
            error={errors.phone}
          />

          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">Role</Text>
            <View className="border border-gray-300 rounded-lg">
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                style={{ height: 50 }}
              >
                <Picker.Item label="Pilgrim/Attendee" value="pilgrim" />
                <Picker.Item label="Volunteer" value="volunteer" />
                <Picker.Item label="Admin" value="admin" />
              </Picker>
            </View>
          </View>

          {formData.role === 'volunteer' && (
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">Skills</Text>
              <View className="flex-row flex-wrap">
                {VOLUNTEER_SKILLS.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    onPress={() => toggleSkill(skill)}
                    className={`mr-2 mb-2 px-3 py-2 rounded-full border ${
                      formData.skills.includes(skill)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text className={`text-sm ${
                      formData.skills.includes(skill) ? 'text-white' : 'text-gray-700'
                    }`}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.skills && (
                <Text className="text-red-500 text-sm mt-1">{errors.skills}</Text>
              )}
            </View>
          )}

          <Input
            label="Age (Optional)"
            placeholder="Enter your age"
            value={formData.age}
            onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
            keyboardType="numeric"
            leftIcon="calendar-outline"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            style={{ marginTop: 8, marginBottom: 16 }}
          />

          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-blue-600 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
