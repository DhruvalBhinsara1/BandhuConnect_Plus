import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../services/supabase';

interface AuthDebugInfo {
  authUserId: string | null;
  authEmail: string | null;
  profileData: any;
  userTableData: any;
  locationData: any;
  error: string | null;
}

export const AuthDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo>({
    authUserId: null,
    authEmail: null,
    profileData: null,
    userTableData: null,
    locationData: null,
    error: null
  });

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // 1. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setDebugInfo(prev => ({ ...prev, error: `Auth error: ${authError.message}` }));
          return;
        }

        const authUserId = user?.id || null;
        const authEmail = user?.email || null;

        let profileData = null;
        let userTableData = null;
        let locationData = null;

        if (authUserId) {
          // 2. Get profile data
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUserId)
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
              .eq('id', authUserId)
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
              .eq('user_id', authUserId)
              .order('last_updated', { ascending: false })
              .limit(1)
              .single();
            locationData = location;
          } catch (error) {
            console.log('No location data found');
          }
        }

        setDebugInfo({
          authUserId,
          authEmail,
          profileData,
          userTableData,
          locationData,
          error: null
        });

      } catch (error) {
        setDebugInfo(prev => ({ 
          ...prev, 
          error: `Debug error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }));
      }
    };

    fetchDebugInfo();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Authentication Debug Info</Text>
      
      {debugInfo.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{debugInfo.error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authenticated User</Text>
        <Text style={styles.text}>User ID: {debugInfo.authUserId || 'None'}</Text>
        <Text style={styles.text}>Email: {debugInfo.authEmail || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Data</Text>
        <Text style={styles.text}>
          {debugInfo.profileData ? JSON.stringify(debugInfo.profileData, null, 2) : 'No profile data'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users Table Data</Text>
        <Text style={styles.text}>
          {debugInfo.userTableData ? JSON.stringify(debugInfo.userTableData, null, 2) : 'No users table data'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Data</Text>
        <Text style={styles.text}>
          {debugInfo.locationData ? JSON.stringify(debugInfo.locationData, null, 2) : 'No location data'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  text: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
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
});
