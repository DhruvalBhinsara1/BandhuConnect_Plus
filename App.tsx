import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BandhuConnect+</Text>
      <Text style={styles.subtitle}>Community Assistance Platform</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.adminButton]}>
          <Text style={styles.buttonText}>Admin Portal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.volunteerButton]}>
          <Text style={styles.buttonText}>Volunteer Portal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.pilgrimButton]}>
          <Text style={styles.buttonText}>Pilgrim Portal</Text>
        </TouchableOpacity>
      </View>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2332',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: '#DC2626',
  },
  volunteerButton: {
    backgroundColor: '#059669',
  },
  pilgrimButton: {
    backgroundColor: '#2563EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
