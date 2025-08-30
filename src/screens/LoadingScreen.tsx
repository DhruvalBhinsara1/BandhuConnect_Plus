import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../constants';

const LoadingScreen: React.FC = () => {
  return (
    <View className="flex-1 bg-white justify-center items-center">
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text className="text-gray-600 text-lg mt-4">Loading...</Text>
    </View>
  );
};

export default LoadingScreen;
