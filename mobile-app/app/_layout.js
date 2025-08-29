import { Stack } from 'expo-router';
import { SessionProvider } from '../context/SessionProvider';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="admin-login" options={{ headerShown: true, title: '', headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#FFFFFF', headerShadowVisible: false }} />
        <Stack.Screen name="volunteer-login" options={{ headerShown: true, title: '', headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#FFFFFF', headerShadowVisible: false }} />
        <Stack.Screen name="pilgrim-login" options={{ headerShown: true, title: '', headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#FFFFFF', headerShadowVisible: false }} />
        <Stack.Screen name="volunteer-signup" options={{ headerShown: true, title: '', headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#FFFFFF', headerShadowVisible: false }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SessionProvider>
  );
}
