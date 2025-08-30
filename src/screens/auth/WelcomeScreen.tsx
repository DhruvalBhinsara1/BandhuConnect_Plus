import React from 'react';
import { View, Text, Image, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import { APP_CONFIG } from '../../constants';

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-600 to-blue-800">
      <View className="flex-1 justify-center items-center px-6">
        {/* Logo/Icon */}
        <View className="bg-white rounded-full p-6 mb-8 shadow-lg">
          <Text className="text-4xl">🤝</Text>
        </View>

        {/* App Title */}
        <Text className="text-white text-4xl font-bold text-center mb-4">
          {APP_CONFIG.NAME}
        </Text>

        {/* Subtitle */}
        <Text className="text-blue-100 text-lg text-center mb-12 px-4">
          Connecting communities, one request at a time
        </Text>

        {/* Features */}
        <View className="mb-12">
          <View className="flex-row items-center mb-4">
            <Text className="text-blue-100 text-2xl mr-3">✓</Text>
            <Text className="text-blue-100 text-lg">Real-time assistance requests</Text>
          </View>
          <View className="flex-row items-center mb-4">
            <Text className="text-blue-100 text-2xl mr-3">✓</Text>
            <Text className="text-blue-100 text-lg">Live volunteer tracking</Text>
          </View>
          <View className="flex-row items-center mb-4">
            <Text className="text-blue-100 text-2xl mr-3">✓</Text>
            <Text className="text-blue-100 text-lg">Instant communication</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="w-full max-w-sm">
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('SignUp')}
            style={{ marginBottom: 16 }}
          />
          
          <Button
            title="Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'white' }}
            textStyle={{ color: 'white' }}
          />
        </View>

        {/* Version */}
        <Text className="text-blue-200 text-sm mt-8">
          Version {APP_CONFIG.VERSION}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
