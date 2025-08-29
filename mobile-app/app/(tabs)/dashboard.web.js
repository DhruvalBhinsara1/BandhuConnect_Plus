import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DashboardWebScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BandhuConnect+ Volunteer</Text>
      </View>

      <View style={styles.webNotice}>
        <Text style={styles.webNoticeTitle}>📱 Mobile App Required</Text>
        <Text style={styles.webNoticeText}>
          The BandhuConnect+ Volunteer app is designed for mobile devices. 
          Please use the Expo Go app on your phone for the full experience.
        </Text>
        <Text style={styles.webNoticeSubtext}>
          Scan the QR code in your terminal with Expo Go to access:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>✅ Volunteer Dashboard</Text>
          <Text style={styles.feature}>✅ Request Management</Text>
          <Text style={styles.feature}>✅ GPS Location Updates</Text>
          <Text style={styles.feature}>✅ Emergency Contacts</Text>
          <Text style={styles.feature}>✅ Profile Management</Text>
        </View>
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
    fontSize: 24,
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
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  webNoticeText: {
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  webNoticeSubtext: {
    fontSize: 14,
    color: '#007BFF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  featureList: {
    alignItems: 'flex-start',
  },
  feature: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 8,
  },
});
