import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileWebScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.webNotice}>
        <Text style={styles.webNoticeTitle}>📱 Mobile Feature</Text>
        <Text style={styles.webNoticeText}>
          Profile management is available on mobile devices. 
          Use Expo Go on your phone to access this feature.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  webNotice: {
    margin: 20,
    padding: 30,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    alignItems: 'center',
  },
  webNoticeTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  webNoticeText: {
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
    lineHeight: 24,
  },
});
