import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BandhuConnect+</Text>
      <Text style={styles.subtitle}>
        Connecting volunteers, admins, and pilgrims for seamless assistance and coordination during large events.
      </Text>

      <Link href="/admin-login" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Admin Login</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/volunteer-login" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Volunteer Login</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/pilgrim-login" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Pilgrim Login</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
    color: '#B3B3B3',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
