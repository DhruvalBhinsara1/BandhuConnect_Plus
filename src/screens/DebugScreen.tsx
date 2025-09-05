import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { secureMapService } from '../services/secureMapService';

interface DebugData {
  authUser: any;
  profileData: any;
  userTableData: any;
  locationData: any;
  assignmentData: any;
  counterpartData: any;
  ownLocationData: any;
  allLocations: any[];
  error: string | null;
}

export default function DebugScreen() {
  const [debugData, setDebugData] = useState<DebugData>({
    authUser: null,
    profileData: null,
    userTableData: null,
    locationData: null,
    assignmentData: null,
    counterpartData: null,
    ownLocationData: null,
    allLocations: [],
    error: null
  });
  const [loading, setLoading] = useState(true);

  const fetchAllDebugData = async () => {
    try {
      setLoading(true);
      
      // 1. Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setDebugData(prev => ({ ...prev, error: `Auth error: ${authError.message}` }));
        return;
      }

      const authUser = user;
      let profileData = null;
      let userTableData = null;
      let locationData = null;
      let assignmentData = null;
      let counterpartData = null;
      let ownLocationData = null;
      let allLocations = [];

      if (authUser?.id) {
        // 2. Get profile data
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          profileData = profile;
        } catch (error) {
          console.log('No profile found');
        }

        // 3. Get user table data (for pilgrims)
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
          userTableData = userData;
        } catch (error) {
          console.log('No user table data found');
        }

        // 4. Get location data
        try {
          const { data: location } = await supabase
            .from('user_locations')
            .select('*')
            .eq('user_id', authUser.id)
            .order('last_updated', { ascending: false })
            .limit(1)
            .single();
          locationData = location;
        } catch (error) {
          console.log('No location data found');
        }

        // 5. Get assignment data
        try {
          assignmentData = await secureMapService.getMyAssignment();
        } catch (error) {
          console.log('No assignment data found');
        }

        // 6. Get counterpart location
        try {
          counterpartData = await secureMapService.getCounterpartLocation();
        } catch (error) {
          console.log('No counterpart data found');
        }

        // 7. Get own location from service
        try {
          ownLocationData = await secureMapService.getOwnLocation();
        } catch (error) {
          console.log('Own location service failed');
        }

        // 8. Get all locations
        try {
          allLocations = await secureMapService.getAllRelevantLocations();
        } catch (error) {
          console.log('All locations failed');
        }
      }

      setDebugData({
        authUser,
        profileData,
        userTableData,
        locationData,
        assignmentData,
        counterpartData,
        ownLocationData,
        allLocations,
        error: null
      });

    } catch (error) {
      setDebugData(prev => ({ 
        ...prev, 
        error: `Debug error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDebugData();
  }, []);

  const copyToClipboard = (data: any, label: string) => {
    const text = JSON.stringify(data, null, 2);
    Alert.alert('Debug Data', `${label}:\n\n${text}`, [
      { text: 'Copy All Debug Data', onPress: () => copyAllData() },
      { text: 'OK', style: 'cancel' }
    ]);
  };

  const copyAllData = () => {
    const allData = {
      timestamp: new Date().toISOString(),
      authUser: debugData.authUser,
      profileData: debugData.profileData,
      userTableData: debugData.userTableData,
      locationData: debugData.locationData,
      assignmentData: debugData.assignmentData,
      counterpartData: debugData.counterpartData,
      ownLocationData: debugData.ownLocationData,
      allLocations: debugData.allLocations,
      error: debugData.error
    };
    
    const text = JSON.stringify(allData, null, 2);
    Alert.alert('All Debug Data', text.substring(0, 2000) + '\n\n[Data truncated - full data logged to console]');
    console.log('=== FULL DEBUG DATA ===');
    console.log(text);
    console.log('=== END DEBUG DATA ===');
  };

  const renderSection = (title: string, data: any, key: string) => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => copyToClipboard(data, title)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.tapHint}>Tap to view full data</Text>
      </TouchableOpacity>
      <Text style={styles.preview}>
        {data ? JSON.stringify(data, null, 2).substring(0, 200) + '...' : 'No data'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading debug data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>BandhuConnect+ Debug Console</Text>
      
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchAllDebugData}
      >
        <Text style={styles.refreshText}>🔄 Refresh All Data</Text>
      </TouchableOpacity>

      {debugData.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{debugData.error}</Text>
        </View>
      )}

      {renderSection('1. Authenticated User', debugData.authUser, 'authUser')}
      {renderSection('2. Profile Data (profiles table)', debugData.profileData, 'profileData')}
      {renderSection('3. User Data (users table)', debugData.userTableData, 'userTableData')}
      {renderSection('4. Location Data (user_locations)', debugData.locationData, 'locationData')}
      {renderSection('5. Assignment Data (get_my_assignment)', debugData.assignmentData, 'assignmentData')}
      {renderSection('6. Counterpart Location', debugData.counterpartData, 'counterpartData')}
      {renderSection('7. Own Location (service)', debugData.ownLocationData, 'ownLocationData')}
      {renderSection('8. All Relevant Locations', debugData.allLocations, 'allLocations')}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Quick Summary:</Text>
        <Text style={styles.summaryText}>
          • Auth User: {debugData.authUser?.email || 'None'}
        </Text>
        <Text style={styles.summaryText}>
          • Profile Name: {debugData.profileData?.name || 'None'}
        </Text>
        <Text style={styles.summaryText}>
          • User Name: {debugData.userTableData?.name || 'None'}
        </Text>
        <Text style={styles.summaryText}>
          • Role: {debugData.profileData?.role || 'None'}
        </Text>
        <Text style={styles.summaryText}>
          • Assignment: {debugData.assignmentData ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.summaryText}>
          • Own Location: {debugData.ownLocationData ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.summaryText}>
          • Total Locations: {debugData.allLocations?.length || 0}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  preview: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  summary: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});
