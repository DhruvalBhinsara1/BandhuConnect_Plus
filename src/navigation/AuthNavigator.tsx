import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import VolunteerLoginScreen from '../screens/auth/VolunteerLoginScreen';
import PilgrimLoginScreen from '../screens/auth/PilgrimLoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import PilgrimSignUpScreen from '../screens/auth/PilgrimSignUpScreen';
import VolunteerSignUpScreen from '../screens/auth/VolunteerSignUpScreen';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import ProfileCompletionScreen from '../screens/auth/ProfileCompletionScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="VolunteerLogin" component={VolunteerLoginScreen} />
      <Stack.Screen name="PilgrimLogin" component={PilgrimLoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="PilgrimSignUp" component={PilgrimSignUpScreen} />
      <Stack.Screen name="VolunteerSignUp" component={VolunteerSignUpScreen} />
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
