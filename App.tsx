import React, { useEffect, useState } from 'react';
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
// Simple theme system - back to the sweet spot
import { ThemeProvider } from './src/theme';
import LoadingScreen from './src/screens/auth/LoadingScreen';

// Temporarily disable error overlays to see our custom error UI
if (__DEV__) {
  LogBox.ignoreAllLogs(true);
}

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

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

    // Simulate initialization (replace with real checks as needed)
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 2200); // Show loading for at least 2.2s

    initializeNotifications();

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <ThemeProvider>
      {!isAppReady ? (
        <LoadingScreen />
      ) : (
        <ErrorBoundaryWrapper>
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
        </ErrorBoundaryWrapper>
      )}
    </ThemeProvider>
  );
}
