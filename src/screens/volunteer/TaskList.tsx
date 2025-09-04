import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import { COLORS, STATUS_COLORS } from '../../constants';
import { Assignment } from '../../types';

const TaskList: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { assignments, getAssignments } = useRequest();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    await getAssignments({ volunteerId: user.id });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case 'active':
        return assignments.filter(a => ['assigned', 'accepted', 'on_duty'].includes(a.status));
      case 'completed':
        return assignments.filter(a => a.status === 'completed');
      default:
        return assignments;
    }
  };

  const renderTaskItem = ({ item }: { item: Assignment }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TaskDetails', { assignmentId: item.id })}
      style={styles.taskItemContainer}
    >
      <Card style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>
              {item.request?.type ? `${item.request.type.charAt(0).toUpperCase() + item.request.type.slice(1)} Assistance` : 'Task'}
            </Text>
            <Text style={styles.taskDescription}>
              {item.request?.description || 'No description available'}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}
          >
            <Text
              style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}
            >
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {new Date(item.assigned_at).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {item.request?.location 
                ? (typeof item.request.location === 'string' ? item.request.location : 'Location available')
                : (item as any).request?.user?.name 
                ? `Pilgrim: ${(item as any).request.user.name}`
                : 'Location pending'
              }
            </Text>
          </View>
        </View>

        {item.request?.priority && (
          <View style={styles.priorityContainer}>
            <Ionicons 
              name="flag" 
              size={16} 
              color={item.request.priority === 'high' ? COLORS.error : COLORS.warning} 
            />
            <Text style={[styles.priorityText, { 
              color: item.request.priority === 'high' ? COLORS.error : COLORS.warning 
            }]}>
              {item.request.priority} Priority
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const filteredTasks = getFilteredTasks();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key as any)}
              style={[styles.filterTab, filter === tab.key && styles.activeFilterTab]}
            >
              <Text style={[styles.filterTabText, filter === tab.key && styles.activeFilterTabText]}>
                {tab.label} ({
                  tab.key === 'all' ? assignments.length :
                  tab.key === 'active' ? assignments.filter(a => ['assigned', 'accepted', 'on_duty'].includes(a.status)).length :
                  assignments.filter(a => a.status === 'completed').length
                })
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'active' 
                ? 'You have no active tasks at the moment'
                : filter === 'completed'
                ? 'No completed tasks yet'
                : 'Tasks will appear here when assigned'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterTabs: {
    flexDirection: 'row',
    marginTop: 16,
  },
  filterTab: {
    marginRight: 16,
    paddingBottom: 8,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  filterTabText: {
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterTabText: {
    color: '#2563eb',
  },
  listContainer: {
    padding: 16,
  },
  taskItemContainer: {
    marginBottom: 12,
  },
  taskCard: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontWeight: 'bold',
    color: '#111827',
    fontSize: 18,
    marginBottom: 4,
  },
  taskDescription: {
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#6b7280',
    fontSize: 14,
    marginLeft: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priorityText: {
    fontSize: 14,
    marginLeft: 4,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#6b7280',
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TaskList;
