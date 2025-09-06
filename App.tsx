import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { RequestProvider } from './src/context/RequestContext';
import LocationProvider from './src/context/LocationContext';
import { MapProvider } from './src/context/MapContext';
import { SecureLocationProvider } from './src/context/SecureLocationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationService } from './src/services/notificationService';
import { LocationWrapper } from './src/components/LocationWrapper';
import { ErrorBoundaryWrapper } from './src/components/ui/EnhancedErrorBoundary';
import { ToastProvider } from './src/components/ui/Toast';
import { ThemeProvider } from './src/theme/ThemeContext';

// Temporarily disable error overlays to see our custom error UI
if (__DEV__) {
  LogBox.ignoreAllLogs(true);
}

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
    <ErrorBoundaryWrapper>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SecureLocationProvider>
              <RequestProvider>
                <LocationProvider>
                  <MapProvider>
                    <LocationWrapper>
                      <AppNavigator />
                      <StatusBar style="auto" />
                    </LocationWrapper>
                  </MapProvider>
                </LocationProvider>
              </RequestProvider>
            </SecureLocationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundaryWrapper>
  );
}
