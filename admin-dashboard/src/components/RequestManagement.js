import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function RequestManagement() {
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [notification, setNotification] = useState(null);
  const [autoAssigning, setAutoAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRequests(), fetchVolunteers()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .select(`
          *,
          pilgrim:profiles!assistance_requests_pilgrim_id_fkey(name, phone),
          assignments(
            id,
            status,
            volunteer:profiles!assignments_volunteer_id_fkey(name, phone)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showNotification('Error loading requests', 'error');
    }
  };

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, volunteer_status, duty_status, skills')
        .eq('role', 'volunteer')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  const handleAssignVolunteer = async () => {
    if (!selectedRequest || !selectedVolunteer) {
      showNotification('Please select a volunteer', 'error');
      return;
    }

    try {
      console.log('🔄 Creating assignment via RPC function...');
      
      // Call the create_assignment_safe RPC function
      const { data: assignmentId, error: rpcError } = await supabase
        .rpc('create_assignment_safe', {
          p_request_id: selectedRequest.id,
          p_volunteer_id: selectedVolunteer,
          p_status: 'pending'
        });

      if (rpcError) {
        console.error('❌ RPC create_assignment failed:', rpcError);
        
        // Fallback: Try direct insert
        const { data, error } = await supabase
          .from('assignments')
          .insert({
            request_id: selectedRequest.id,
            volunteer_id: selectedVolunteer,
            status: 'pending',
            assigned_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Fallback insert failed:', error);
          throw error;
        }

        console.log('✅ Assignment created via fallback:', data.id);
      } else {
        console.log('✅ Assignment created via RPC:', assignmentId);
      }

      // Update request status
      await supabase
        .from('assistance_requests')
        .update({ status: 'assigned' })
        .eq('id', selectedRequest.id);

      showNotification('Volunteer assigned successfully!', 'success');
      setShowAssignModal(false);
      setSelectedRequest(null);
      setSelectedVolunteer('');
      fetchRequests();
    } catch (error) {
      console.error('Error assigning volunteer:', error);
      showNotification('Failed to assign volunteer. Please try again.', 'error');
    }
  };

  const handleAutoAssign = async (requestId) => {
    setAutoAssigning(true);
    try {
      console.log('🤖 Starting auto-assignment for request:', requestId);
      
      // Call the auto-assignment RPC function
      const { data, error } = await supabase
        .rpc('auto_assign_request_simple', {
          p_request_id: requestId
        });

      if (error) {
        console.error('❌ Auto-assignment failed:', error);
        throw error;
      }

      if (data && data.length > 0) {
        showNotification(`Auto-assigned to ${data.length} volunteer(s)!`, 'success');
      } else {
        showNotification('No suitable volunteers found for auto-assignment', 'warning');
      }

      fetchRequests();
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      showNotification('Auto-assignment failed. Please try manual assignment.', 'error');
    } finally {
      setAutoAssigning(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      case 'accepted': return '#8b5cf6';
      case 'in_progress': return '#06b6d4';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getAvailableVolunteers = () => {
    return volunteers.filter(v => 
      v.volunteer_status === 'active' || 
      v.volunteer_status === 'available' ||
      v.duty_status === 'on_duty'
    );
  };

  if (loading) {
    return <div style={styles.loading}>Loading requests...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Request Management</h2>
        <div style={styles.stats}>
          <span style={styles.statItem}>
            Total: {requests.length}
          </span>
          <span style={styles.statItem}>
            Pending: {requests.filter(r => r.status === 'pending').length}
          </span>
          <span style={styles.statItem}>
            Assigned: {requests.filter(r => r.status === 'assigned').length}
          </span>
        </div>
      </div>

      <div style={styles.requestsContainer}>
        {requests.length === 0 ? (
          <div style={styles.noRequests}>No assistance requests found</div>
        ) : (
          requests.map(request => (
            <div key={request.id} style={styles.requestCard}>
              <div style={styles.requestHeader}>
                <div style={styles.requestInfo}>
                  <h3 style={styles.requestTitle}>{request.title || 'Assistance Request'}</h3>
                  <p style={styles.requestDescription}>{request.description}</p>
                </div>
                <div style={styles.requestBadges}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: getStatusColor(request.status)
                  }}>
                    {request.status}
                  </span>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: getPriorityColor(request.priority)
                  }}>
                    {request.priority}
                  </span>
                </div>
              </div>

              <div style={styles.requestDetails}>
                <div style={styles.detailRow}>
                  <strong>Type:</strong> {request.type}
                </div>
                <div style={styles.detailRow}>
                  <strong>Pilgrim:</strong> {request.pilgrim?.name || 'Unknown'} 
                  {request.pilgrim?.phone && ` (${request.pilgrim.phone})`}
                </div>
                <div style={styles.detailRow}>
                  <strong>Location:</strong> {request.location || 'Not specified'}
                </div>
                <div style={styles.detailRow}>
                  <strong>Created:</strong> {new Date(request.created_at).toLocaleString()}
                </div>
                {request.assignments && request.assignments.length > 0 && (
                  <div style={styles.detailRow}>
                    <strong>Assigned to:</strong> {request.assignments[0].volunteer?.name || 'Unknown Volunteer'}
                    {request.assignments[0].volunteer?.phone && ` (${request.assignments[0].volunteer.phone})`}
                  </div>
                )}
              </div>

              <div style={styles.requestActions}>
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowAssignModal(true);
                      }}
                      style={styles.assignButton}
                    >
                      Assign Volunteer
                    </button>
                    <button
                      onClick={() => handleAutoAssign(request.id)}
                      disabled={autoAssigning}
                      style={styles.autoAssignButton}
                    >
                      {autoAssigning ? 'Auto-Assigning...' : 'Auto-Assign'}
                    </button>
                  </>
                )}
                {request.status === 'assigned' && (
                  <span style={styles.assignedText}>✅ Assigned</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedRequest && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Assign Volunteer</h3>
            <p style={styles.modalSubtitle}>
              Choose a volunteer for: <strong>{selectedRequest.title}</strong>
            </p>
            
            <div style={styles.volunteerList}>
              {getAvailableVolunteers().length === 0 ? (
                <p style={styles.noVolunteers}>No available volunteers found</p>
              ) : (
                getAvailableVolunteers().map(volunteer => (
                  <div
                    key={volunteer.id}
                    style={{
                      ...styles.volunteerOption,
                      backgroundColor: selectedVolunteer === volunteer.id ? '#3b82f6' : '#1C2128'
                    }}
                    onClick={() => setSelectedVolunteer(volunteer.id)}
                  >
                    <div style={styles.volunteerInfo}>
                      <div style={styles.volunteerName}>{volunteer.name}</div>
                      <div style={styles.volunteerPhone}>{volunteer.phone}</div>
                      {volunteer.skills && volunteer.skills.length > 0 && (
                        <div style={styles.volunteerSkills}>
                          Skills: {volunteer.skills.join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={styles.volunteerStatus}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: volunteer.volunteer_status === 'active' ? '#10b981' : '#6b7280'
                      }}>
                        {volunteer.volunteer_status || 'active'}
                      </span>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: volunteer.duty_status === 'on_duty' ? '#3b82f6' : '#6b7280'
                      }}>
                        {volunteer.duty_status || 'available'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRequest(null);
                  setSelectedVolunteer('');
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignVolunteer}
                disabled={!selectedVolunteer}
                style={styles.confirmButton}
              >
                Assign Volunteer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'error' ? '#ef4444' : 
                          notification.type === 'warning' ? '#f59e0b' : '#10b981'
        }}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#0F1419',
    minHeight: '100vh',
    color: '#E6EDF3',
    fontFamily: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    margin: 0,
    color: '#E6EDF3',
    fontWeight: '600',
  },
  stats: {
    display: 'flex',
    gap: '16px',
  },
  statItem: {
    fontSize: '14px',
    color: '#8B949E',
    backgroundColor: '#1C2128',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #30363D',
  },
  requestsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  requestCard: {
    backgroundColor: '#1C2128',
    border: '1px solid #30363D',
    borderRadius: '8px',
    padding: '20px',
    transition: 'all 0.2s ease',
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#E6EDF3',
    margin: '0 0 8px 0',
  },
  requestDescription: {
    fontSize: '14px',
    color: '#8B949E',
    margin: 0,
    lineHeight: '1.5',
  },
  requestBadges: {
    display: 'flex',
    gap: '8px',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  requestDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '8px',
    marginBottom: '16px',
  },
  detailRow: {
    fontSize: '14px',
    color: '#E6EDF3',
  },
  requestActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  assignButton: {
    backgroundColor: '#388BFD',
    color: '#E6EDF3',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  autoAssignButton: {
    backgroundColor: '#8b5cf6',
    color: '#E6EDF3',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  assignedText: {
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '600',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1C2128',
    border: '1px solid #30363D',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#E6EDF3',
    margin: '0 0 8px 0',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#8B949E',
    margin: '0 0 20px 0',
  },
  volunteerList: {
    maxHeight: '400px',
    overflow: 'auto',
    marginBottom: '20px',
  },
  volunteerOption: {
    padding: '12px',
    border: '1px solid #30363D',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#E6EDF3',
    marginBottom: '4px',
  },
  volunteerPhone: {
    fontSize: '14px',
    color: '#8B949E',
    marginBottom: '4px',
  },
  volunteerSkills: {
    fontSize: '12px',
    color: '#7D8590',
  },
  volunteerStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statusBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    color: '#E6EDF3',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  confirmButton: {
    backgroundColor: '#10b981',
    color: '#E6EDF3',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    color: '#8B949E',
    fontSize: '18px',
    padding: '40px',
  },
  noRequests: {
    textAlign: 'center',
    color: '#8B949E',
    fontSize: '16px',
    padding: '40px',
    backgroundColor: '#1C2128',
    border: '1px solid #30363D',
    borderRadius: '8px',
  },
  noVolunteers: {
    textAlign: 'center',
    color: '#8B949E',
    fontSize: '14px',
    padding: '20px',
  },
  notification: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '6px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: 1001,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
};
