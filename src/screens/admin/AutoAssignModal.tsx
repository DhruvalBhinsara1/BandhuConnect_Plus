import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { Logger } from '../../utils/logger';

interface AutoAssignModalProps {
  visible: boolean;
  onClose: () => void;
  selectedVolunteer: any;
  onAssignmentComplete: () => void;
}

const AutoAssignModal: React.FC<AutoAssignModalProps> = ({
  visible,
  onClose,
  selectedVolunteer,
  onAssignmentComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [bestMatches, setBestMatches] = useState<any[]>([]);

  useEffect(() => {
    if (visible && selectedVolunteer) {
      loadPendingRequests();
    }
  }, [visible, selectedVolunteer]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const { data: requestsData } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (requestsData) {
        setRequests(requestsData);
        calculateMatches(requestsData);
      }
    } catch (error) {
      Logger.error('Failed to load pending requests', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMatches = (pendingRequests: any[]) => {
    if (!selectedVolunteer?.skills) {
      setBestMatches([]);
      return;
    }

    const matches = pendingRequests.map(request => {
      const requiredSkills = getRequiredSkills(request.type);
      const skillMatch = calculateSkillMatch(selectedVolunteer.skills, requiredSkills);
      const priorityScore = getPriorityScore(request.priority);
      
      return {
        ...request,
        matchScore: skillMatch * 0.7 + priorityScore * 0.3,
        skillMatch,
        priorityScore,
        requiredSkills
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    setBestMatches(matches);
  };

  const getRequiredSkills = (requestType: string) => {
    switch (requestType) {
      case 'lost_person': return ['search_rescue', 'crowd_management', 'communication', 'local_knowledge'];
      case 'medical': return ['medical', 'first_aid', 'healthcare', 'emergency'];
      case 'guidance': return ['local_knowledge', 'tour_guide', 'navigation', 'language'];
      case 'sanitation': return ['cleaning', 'sanitation', 'maintenance', 'hygiene'];
      case 'general': return ['general', 'assistance', 'support'];
      default: return ['general', 'assistance', 'support'];
    }
  };

  const calculateSkillMatch = (volunteerSkills: string[], requiredSkills: string[]) => {
    if (!volunteerSkills || volunteerSkills.length === 0) return 0.3;
    
    const matchingSkills = volunteerSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return Math.min(1.0, matchingSkills.length / requiredSkills.length + 0.3);
  };

  const getPriorityScore = (priority: string) => {
    switch (priority) {
      case 'high': return 1.0;
      case 'medium': return 0.7;
      case 'low': return 0.4;
      default: return 0.5;
    }
  };

  const handleAutoAssign = async (request: any) => {
    try {
      setLoading(true);
      Logger.autoAssignment.requestProcessing(request, 0, 1);

      const { data, error } = await supabase.rpc('auto_assign_request_enhanced', {
        p_request_id: request.id,
        p_volunteer_id: selectedVolunteer.id,
        p_min_match_score: 0.4 // Lower threshold for manual selection
      });

      if (error) {
        Logger.autoAssignment.error(error, 'manual volunteer assignment');
        Alert.alert('Assignment Failed', `Could not assign task: ${error.message}`);
        return;
      }

      if (data && data.success) {
        Logger.autoAssignment.matchResult(true, selectedVolunteer.name, data.match_score);
        Alert.alert(
          'Assignment Successful',
          `Task "${request.title}" has been assigned to ${selectedVolunteer.name}`,
          [{ text: 'OK', onPress: () => {
            onAssignmentComplete();
            onClose();
          }}]
        );
      } else {
        Logger.autoAssignment.matchResult(false, undefined, undefined, data?.message || 'Unknown error');
        Alert.alert('Assignment Failed', data?.message || 'Could not assign task to this volunteer');
      }
    } catch (error) {
      Logger.autoAssignment.error(error, 'manual volunteer assignment');
      Alert.alert('Error', 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getMatchLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Fair Match';
    return 'Poor Match';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Auto-Assign Task</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.volunteerInfo}>
            <Text style={styles.volunteerName}>{selectedVolunteer?.name}</Text>
            <Text style={styles.volunteerSkills}>
              Skills: {selectedVolunteer?.skills?.join(', ') || 'No skills listed'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Best Matching Requests</Text>

          <ScrollView style={styles.requestsList}>
            {loading ? (
              <Text style={styles.loadingText}>Finding best matches...</Text>
            ) : bestMatches.length > 0 ? (
              bestMatches.slice(0, 5).map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestTitle}>{request.title}</Text>
                    <View style={[styles.matchBadge, { backgroundColor: getMatchColor(request.matchScore) + '20' }]}>
                      <Text style={[styles.matchText, { color: getMatchColor(request.matchScore) }]}>
                        {Math.round(request.matchScore * 100)}%
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.requestDescription}>{request.description}</Text>
                  
                  <View style={styles.requestMeta}>
                    <Text style={styles.requestType}>{request.type}</Text>
                    <Text style={styles.requestPriority}>{request.priority} priority</Text>
                  </View>

                  <Text style={styles.matchLabel}>{getMatchLabel(request.matchScore)}</Text>

                  <TouchableOpacity
                    style={[styles.assignButton, { opacity: loading ? 0.5 : 1 }]}
                    onPress={() => handleAutoAssign(request)}
                    disabled={loading}
                  >
                    <Text style={styles.assignButtonText}>Assign This Task</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No pending requests found</Text>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  volunteerInfo: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  volunteerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  volunteerSkills: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  requestsList: {
    maxHeight: 400,
  },
  requestCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requestType: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  requestPriority: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  matchLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  assignButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  assignButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    paddingVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    paddingVertical: 20,
  },
});

export default AutoAssignModal;
