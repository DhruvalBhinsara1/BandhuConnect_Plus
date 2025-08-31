import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Logger } from '../../utils/logger';
import { User } from '../../types';

const PilgrimManagement: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [pilgrims, setPilgrims] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pilgrims' | 'requests'>('pilgrims');

  useEffect(() => {
    loadPilgrims();
    loadRequests();
  }, []);

  const loadPilgrims = async () => {
    try {
      console.log('Loading pilgrims...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'pilgrim')
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        console.log('Setting pilgrims from database:', data.length);
        setPilgrims(data);
      } else {
        console.log('❌ No pilgrims found in database!');
        console.log('Error details:', error);
        setPilgrims([]);
      }
    } catch (error) {
      console.error('Error loading pilgrims:', error);
      Logger.error('Failed to load pilgrims', error as Error);
      setPilgrims([]);
    }
  };

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        // Get pilgrim details separately to avoid foreign key issues
        const requestsWithPilgrims = await Promise.all(
          data.map(async (request) => {
            const { data: pilgrim } = await supabase
              .from('profiles')
              .select('id, name, email, phone')
              .eq('id', request.pilgrim_id)
              .single();
            
            return {
              ...request,
              pilgrim: pilgrim
            };
          })
        );
        
        setRequests(requestsWithPilgrims);
      } else {
        console.error('Error loading requests:', error);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      setRequests([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPilgrims();
    await loadRequests();
    setRefreshing(false);
  };

  const getFilteredPilgrims = () => {
    switch (filter) {
      case 'active':
        return pilgrims.filter(p => p.is_active === true);
      case 'inactive':
        return pilgrims.filter(p => p.is_active === false);
      default:
        return pilgrims;
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? '#10b981' : '#ef4444';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const renderPilgrimItem = ({ item }: { item: User }) => (
    <View style={styles.pilgrimCard}>
      <View style={styles.pilgrimInfo}>
        <Text style={styles.pilgrimName}>{item.name || 'Unknown Pilgrim'}</Text>
        <Text style={styles.pilgrimEmail}>📧 {item.email}</Text>
        <Text style={styles.pilgrimPhone}>📱 {item.phone || 'No phone'}</Text>
        <Text style={styles.pilgrimJoined}>🗓️ Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
        
        <View style={styles.pilgrimStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>📋 Requests:</Text>
            <Text style={styles.statValue}>{requests.filter(r => r.pilgrim_id === item.id).length}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.pilgrimActions}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(item.is_active) }]}>
          <Text style={styles.statusText}>{getStatusText(item.is_active)}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => {
            // Navigate to pilgrim profile or show details
            Alert.alert('Pilgrim Profile', `View details for ${item.name}`);
          }}
        >
          <Text style={styles.viewButtonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestInfo}>
        <Text style={styles.requestTitle}>{item.title}</Text>
        <Text style={styles.requestPilgrim}>👤 {item.pilgrim?.name || 'Unknown'}</Text>
        <Text style={styles.requestDescription}>{item.description}</Text>
        <Text style={styles.requestDate}>📅 {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      
      <View style={styles.requestActions}>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'pending' ? '#f59e0b' : '#10b981' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Pilgrim Management</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pilgrims' && styles.activeTab]}
          onPress={() => setActiveTab('pilgrims')}
        >
          <Text style={[styles.tabText, activeTab === 'pilgrims' && styles.activeTabText]}>
            Pilgrims ({pilgrims.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({requests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pilgrims' && (
        <>
          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            {['all', 'active', 'inactive'].map((filterType) => (
              <TouchableOpacity
                key={filterType}
                style={[
                  styles.filterButton,
                  filter === filterType && styles.activeFilterButton
                ]}
                onPress={() => setFilter(filterType as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === filterType && styles.activeFilterButtonText
                ]}>
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pilgrims List */}
          <FlatList
            data={getFilteredPilgrims()}
            renderItem={renderPilgrimItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeFilterButton: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
  },
  pilgrimCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pilgrimInfo: {
    marginBottom: 12,
  },
  pilgrimName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  pilgrimEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  pilgrimPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  pilgrimJoined: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  pilgrimStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pilgrimActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  viewButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestInfo: {
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  requestPilgrim: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  requestActions: {
    alignItems: 'flex-end',
  },
});

export default PilgrimManagement;
