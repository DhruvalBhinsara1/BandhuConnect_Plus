import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS, STATUS_COLORS, REQUEST_TYPES } from '../../constants';

const PilgrimDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { requests, getRequests } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    await getRequests({ userId: user.id });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const myRequests = requests.filter(r => r.user_id === user?.id);
  const activeRequests = myRequests.filter(r => 
    ['pending', 'assigned', 'in_progress'].includes(r.status)
  );
  const completedRequests = myRequests.filter(r => r.status === 'completed');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={{ backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Welcome,</Text>
              <Text style={{ color: '#bbf7d0', fontSize: 18 }}>{user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle-outline" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, flex: 1, marginRight: 8 }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{activeRequests.length}</Text>
              <Text style={{ color: '#bbf7d0', fontSize: 12 }}>Active Requests</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, flex: 1, marginLeft: 8 }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{completedRequests.length}</Text>
              <Text style={{ color: '#bbf7d0', fontSize: 12 }}>Completed</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Quick Request Actions */}
          <Card style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Need Help?</Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {REQUEST_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => navigation.navigate('CreateRequest', { type: type.value })}
                  style={{ alignItems: 'center', width: '30%', marginBottom: 16 }}
                >
                  <View style={{ backgroundColor: '#dcfce7', padding: 16, borderRadius: 50, marginBottom: 8 }}>
                    <Ionicons name={type.icon as any} size={24} color={COLORS.secondary} />
                  </View>
                  <Text style={{ color: '#374151', fontSize: 10, textAlign: 'center' }}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

          </Card>

          {/* Active Requests */}
          {activeRequests.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Active Requests</Text>
                <TouchableOpacity onPress={() => navigation.navigate('RequestStatus')}>
                  <Text style={{ color: '#059669', fontWeight: '600' }}>View All</Text>
                </TouchableOpacity>
              </View>

              {activeRequests.slice(0, 3).map((request) => (
                <TouchableOpacity
                  key={request.id}
                  onPress={() => navigation.navigate('RequestStatus', { requestId: request.id })}
                  style={{ borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 12 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                        {request.title}
                      </Text>
                      <Text style={{ color: '#4b5563', fontSize: 12, marginBottom: 8 }}>
                        {request.description}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{ 
                            paddingHorizontal: 8, 
                            paddingVertical: 4, 
                            borderRadius: 50, 
                            marginRight: 8,
                            backgroundColor: STATUS_COLORS[request.status] + '20' 
                          }}
                        >
                          <Text
                            style={{ 
                              fontSize: 10, 
                              fontWeight: '500', 
                              textTransform: 'capitalize',
                              color: STATUS_COLORS[request.status] 
                            }}
                          >
                            {request.status.replace('_', ' ')}
                          </Text>
                        </View>
                        <Text style={{ color: '#6b7280', fontSize: 10 }}>
                          {new Date(request.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Recent Activity */}
          {completedRequests.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Recent Activity</Text>
              
              {completedRequests.slice(0, 2).map((request) => (
                <View
                  key={request.id}
                  className="border-b border-gray-200 py-3 last:border-b-0"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontWeight: '500', color: '#111827' }}>
                        {request.title}
                      </Text>
                      <Text style={{ color: '#6b7280', fontSize: 12 }}>
                        Completed on {new Date(request.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Quick Actions</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateRequest')}
                className="items-center flex-1"
              >
                <View style={{ backgroundColor: '#dcfce7', padding: 12, borderRadius: 50, marginBottom: 8 }}>
                  <Ionicons name="add-circle" size={24} color={COLORS.secondary} />
                </View>
                <Text style={{ color: '#374151', fontSize: 12, textAlign: 'center' }}>New Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('RequestStatus')}
                className="items-center flex-1"
              >
                <View style={{ backgroundColor: '#dbeafe', padding: 12, borderRadius: 50, marginBottom: 8 }}>
                  <Ionicons name="list" size={24} color={COLORS.primary} />
                </View>
                <Text style={{ color: '#374151', fontSize: 12, textAlign: 'center' }}>My Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Map')}
                className="items-center flex-1"
              >
                <View style={{ backgroundColor: '#ede9fe', padding: 12, borderRadius: 50, marginBottom: 8 }}>
                  <Ionicons name="map" size={24} color="#8b5cf6" />
                </View>
                <Text style={{ color: '#374151', fontSize: 12, textAlign: 'center' }}>Find Help</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Emergency Contact */}
          <Card style={{ marginTop: 16, backgroundColor: '#fef2f2' }}>
            <View className="flex-row items-center">
              <Ionicons name="warning" size={24} color={COLORS.error} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: 'bold', color: '#991b1b' }}>Emergency?</Text>
                <Text style={{ color: '#dc2626', fontSize: 12 }}>
                  For immediate assistance, call emergency services
                </Text>
              </View>
              <Button
                title="Call 911"
                onPress={() => {/* Handle emergency call */}}
                variant="danger"
                size="small"
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PilgrimDashboard;
