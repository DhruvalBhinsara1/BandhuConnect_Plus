import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';

export default function LocationUpdateWebScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Location Update</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.webNotice}>
        <Text style={styles.webNoticeTitle}>📱 Mobile Feature</Text>
        <Text style={styles.webNoticeText}>
          Location updates with maps are available on mobile devices. 
          Please use the Expo Go app on your phone to test this feature.
        </Text>
        <Text style={styles.webNoticeSubtext}>
          Scan the QR code in your terminal with Expo Go to access full functionality.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1E1E1E',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007BFF',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 60,
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
    marginBottom: 10,
  },
  webNoticeSubtext: {
    fontSize: 14,
    color: '#007BFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
