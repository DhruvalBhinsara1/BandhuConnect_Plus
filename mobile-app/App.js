import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const handlePress = (type) => {
    Alert.alert('Coming Soon', `${type} functionality will be available soon!`);
  };

  const { width, height } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 768;

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={[styles.appWrapper, isWeb && isLargeScreen && styles.webContainer]}>
          {/* Background image area */}
          <View style={styles.imageBackgroundContainer}>
            <Image 
              source={require('./assets/3900483.jpg')}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          </View>

          {/* Main content area */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>BandhuConnect+</Text>
            <Text style={styles.subtitle}>
              Connecting volunteers and pilgrims for seamless assistance and coordination during large events.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => handlePress('Admin Login')}
              >
                <Text style={styles.buttonText}>Admin Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => handlePress('Volunteer Login')}
              >
                <Text style={styles.buttonText}>Volunteer Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => handlePress('Pilgrim Login')}
              >
                <Text style={styles.buttonText}>Pilgrim Login</Text>
              </TouchableOpacity>
            </View>

            {/* Language selector */}
            <TouchableOpacity style={styles.languageContainer}>
              <Text style={styles.languageIcon}>🌐</Text>
              <Text style={styles.languageText}>Language</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2332',
    alignItems: 'center', // Center content horizontally for web
    justifyContent: 'center', // Center content vertically for web
  },
  appWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: '100%', // Full width on mobile
    height: '100%',
  },
  webContainer: {
    maxWidth: 480, // Limit width on web to mobile-like experience
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: Platform.OS === 'web' ? 0 : 0, // Remove border radius to fix corner issue
    overflow: 'hidden',
  },
  illustrationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    paddingTop: 60,
    paddingBottom: 20,
    height: '50%',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  imageBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#F5F5DC',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A2332',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 20,
    minHeight: '50%',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A9BAE',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 0,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    maxWidth: 400, // Limit button width on larger screens
    alignSelf: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 'auto',
  },
  languageIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#8A9BAE',
  },
  languageText: {
    color: '#8A9BAE',
    fontSize: 16,
    fontWeight: '500',
  },
});
