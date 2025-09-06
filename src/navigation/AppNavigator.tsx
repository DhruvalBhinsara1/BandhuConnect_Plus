import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('[AppNavigator] Rendering with:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    userRole: user?.role,
    needsProfileCompletion: user?.needsProfileCompletion,
    loading 
  });

  // Show loading screen only during initial app authentication check
  if (loading) {
    console.log('[AppNavigator] Showing loading screen');
    return <LoadingScreen />;
  }

  const shouldShowMain = user && !user.needsProfileCompletion;
  console.log('[AppNavigator] Navigation decision:', { shouldShowMain });

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowMain ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
