import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { setUserRole } = useAuth();

  const handleRoleSelection = (role: 'admin' | 'volunteer' | 'pilgrim') => {
    // Set the user role and navigate to appropriate login screen
    setUserRole(role);
    
    switch (role) {
      case 'admin':
        navigation.navigate('AdminLogin');
        break;
      case 'volunteer':
        navigation.navigate('VolunteerLogin');
        break;
      case 'pilgrim':
        navigation.navigate('PilgrimLogin');
        break;
      default:
        navigation.navigate('Login', { role });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>BandhuConnect+</Text>
        <Text style={styles.subtitle}>Community Assistance Platform</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.adminButton]}
            onPress={() => handleRoleSelection('admin')}
          >
            <Text style={styles.buttonText}>Admin Portal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.volunteerButton]}
            onPress={() => handleRoleSelection('volunteer')}
          >
            <Text style={styles.buttonText}>Volunteer Portal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.pilgrimButton]}
            onPress={() => handleRoleSelection('pilgrim')}
          >
            <Text style={styles.buttonText}>Pilgrim Portal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2332',
  },
  content: {
    flex: 1,
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

export default RoleSelectionScreen;
