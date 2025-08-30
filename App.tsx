import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { RequestProvider } from './src/context/RequestContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <RequestProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </RequestProvider>
    </AuthProvider>
  );
}
