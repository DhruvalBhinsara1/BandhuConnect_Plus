import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { RequestProvider } from './src/context/RequestContext';
import { LocationProvider } from './src/context/LocationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Initialize notification service
    const initializeNotifications = async () => {
      await NotificationService.registerForPushNotifications();
      const subscriptions = NotificationService.setupNotificationListeners();
      
      return () => {
        subscriptions.foregroundSubscription.remove();
        subscriptions.responseSubscription.remove();
      };
    };

    initializeNotifications();
  }, []);

  return (
    <AuthProvider>
      <RequestProvider>
        <LocationProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </LocationProvider>
      </RequestProvider>
    </AuthProvider>
  );
}
