import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { router } from 'expo-router';

export default function EmergencyContactScreen() {
  const [calling, setCalling] = useState(false);

  const emergencyContacts = [
    {
      title: 'Police Emergency',
      number: '100',
      description: 'For immediate police assistance',
      color: '#f44336',
      icon: '🚔'
    },
    {
      title: 'Medical Emergency',
      number: '108',
      description: 'For ambulance and medical help',
      color: '#FF5722',
      icon: '🚑'
    },
    {
      title: 'Fire Emergency',
      number: '101',
      description: 'For fire department assistance',
      color: '#FF9800',
      icon: '🚒'
    },
    {
      title: 'Admin Control Room',
      number: '+91-9913238080',
      description: 'BandhuConnect+ emergency support',
      color: '#007BFF',
      icon: '📞'
    }
  ];

  const makeCall = async (number, title) => {
    try {
      setCalling(true);
      const phoneNumber = `tel:${number}`;
      const canCall = await Linking.canOpenURL(phoneNumber);
      
      if (canCall) {
        Alert.alert(
          'Emergency Call',
          `Calling ${title} (${number})`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Call Now', 
              onPress: () => Linking.openURL(phoneNumber),
              style: 'destructive'
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Unable to make phone calls on this device');
      }
    } catch (error) {
      console.error('Error making call:', error);
      Alert.alert('Error', 'Failed to initiate call');
    } finally {
      setCalling(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Contacts</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.warningContainer}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          Use these contacts only for genuine emergencies
        </Text>
      </View>

      <View style={styles.contactsList}>
        {emergencyContacts.map((contact, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.contactCard, { borderLeftColor: contact.color }]}
            onPress={() => makeCall(contact.number, contact.title)}
            disabled={calling}
          >
            <View style={styles.contactHeader}>
              <Text style={styles.contactIcon}>{contact.icon}</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{contact.title}</Text>
                <Text style={styles.contactNumber}>{contact.number}</Text>
              </View>
              <View style={[styles.callButton, { backgroundColor: contact.color }]}>
                <Text style={styles.callButtonText}>📞</Text>
              </View>
            </View>
            <Text style={styles.contactDescription}>{contact.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Emergency Guidelines</Text>
        <View style={styles.instruction}>
          <Text style={styles.instructionNumber}>1.</Text>
          <Text style={styles.instructionText}>Stay calm and assess the situation</Text>
        </View>
        <View style={styles.instruction}>
          <Text style={styles.instructionNumber}>2.</Text>
          <Text style={styles.instructionText}>Call the appropriate emergency service</Text>
        </View>
        <View style={styles.instruction}>
          <Text style={styles.instructionNumber}>3.</Text>
          <Text style={styles.instructionText}>Provide clear location and details</Text>
        </View>
        <View style={styles.instruction}>
          <Text style={styles.instructionNumber}>4.</Text>
          <Text style={styles.instructionText}>Follow dispatcher instructions</Text>
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  contactsList: {
    padding: 20,
    paddingTop: 0,
  },
  contactCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  contactNumber: {
    color: '#B3B3B3',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 16,
  },
  contactDescription: {
    color: '#B3B3B3',
    fontSize: 14,
    marginLeft: 36,
  },
  instructionsContainer: {
    margin: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  instructionNumber: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 20,
  },
  instructionText: {
    color: '#B3B3B3',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
