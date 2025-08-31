import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Colors } from '../constants/Colors';

const PilgrimManagement = () => {
  const [pilgrims, setPilgrims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPilgrim, setSelectedPilgrim] = useState(null);
  const [pilgrimRequests, setPilgrimRequests] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchPilgrims();
  }, []);

  const fetchPilgrims = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          assistance_requests(
            id,
            type,
            title,
            status,
            priority,
            created_at
          )
        `)
        .eq('role', 'pilgrim')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPilgrims(data || []);
    } catch (error) {
      console.error('Error fetching pilgrims:', error);
      alert('Failed to load pilgrims');
    } finally {
      setLoading(false);
    }
  };

  const viewPilgrimProfile = async (pilgrim) => {
    setSelectedPilgrim(pilgrim);
    setShowProfile(true);
    
    // Fetch detailed requests for this pilgrim
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .select(`
          *,
          assignments(
            id,
            status,
            volunteer:profiles!assignments_volunteer_id_fkey(name, email)
          )
        `)
        .eq('user_id', pilgrim.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPilgrimRequests(data || []);
    } catch (error) {
      console.error('Error fetching pilgrim requests:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      case 'in_progress': return '#8b5cf6';
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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Loading pilgrims...</div>
      </div>
    );
  }

  if (showProfile && selectedPilgrim) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button 
            onClick={() => setShowProfile(false)}
            style={styles.backButton}
          >
            ← Back to Pilgrims
          </button>
          <h2 style={styles.title}>Pilgrim Profile</h2>
        </div>

        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <h3 style={styles.profileName}>{selectedPilgrim.name}</h3>
            <span style={[
              styles.statusBadge,
              { backgroundColor: selectedPilgrim.is_active ? '#10b981' : '#ef4444' }
            ]}>
              {selectedPilgrim.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div style={styles.profileDetails}>
            <div style={styles.detailRow}>
              <strong>Email:</strong> {selectedPilgrim.email || 'Not provided'}
            </div>
            <div style={styles.detailRow}>
              <strong>Phone:</strong> {selectedPilgrim.phone || 'Not provided'}
            </div>
            <div style={styles.detailRow}>
              <strong>Age:</strong> {selectedPilgrim.age || 'Not provided'}
            </div>
            <div style={styles.detailRow}>
              <strong>Joined:</strong> {new Date(selectedPilgrim.created_at).toLocaleDateString()}
            </div>
            <div style={styles.detailRow}>
              <strong>Total Requests:</strong> {pilgrimRequests.length}
            </div>
          </div>
        </div>

        <div style={styles.requestsSection}>
          <h3 style={styles.sectionTitle}>Request History</h3>
          {pilgrimRequests.length === 0 ? (
            <div style={styles.noRequests}>No requests found</div>
          ) : (
            <div style={styles.requestsList}>
              {pilgrimRequests.map((request) => (
                <div key={request.id} style={styles.requestCard}>
                  <div style={styles.requestHeader}>
                    <h4 style={styles.requestTitle}>{request.title}</h4>
                    <div style={styles.requestBadges}>
                      <span style={[
                        styles.badge,
                        { backgroundColor: getStatusColor(request.status) }
                      ]}>
                        {request.status}
                      </span>
                      <span style={[
                        styles.badge,
                        { backgroundColor: getPriorityColor(request.priority) }
                      ]}>
                        {request.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.requestDetails}>
                    <div><strong>Type:</strong> {request.type}</div>
                    <div><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</div>
                    {request.assignments && request.assignments.length > 0 && (
                      <div>
                        <strong>Assigned to:</strong> {request.assignments[0].volunteer?.name} 
                        ({request.assignments[0].volunteer?.email})
                      </div>
                    )}
                  </div>
                  
                  {request.description && (
                    <div style={styles.requestDescription}>
                      <strong>Description:</strong> {request.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Pilgrim Management</h2>
        <button onClick={fetchPilgrims} style={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{pilgrims.length}</div>
          <div style={styles.statLabel}>Total Pilgrims</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {pilgrims.filter(p => p.is_active).length}
          </div>
          <div style={styles.statLabel}>Active Pilgrims</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {pilgrims.reduce((sum, p) => sum + (p.assistance_requests?.length || 0), 0)}
          </div>
          <div style={styles.statLabel}>Total Requests</div>
        </div>
      </div>

      <div style={styles.pilgrimsList}>
        {pilgrims.length === 0 ? (
          <div style={styles.noPilgrims}>No pilgrims found</div>
        ) : (
          pilgrims.map((pilgrim) => (
            <div key={pilgrim.id} style={styles.pilgrimCard}>
              <div style={styles.pilgrimInfo}>
                <div style={styles.pilgrimHeader}>
                  <h3 style={styles.pilgrimName}>{pilgrim.name}</h3>
                  <span style={[
                    styles.statusBadge,
                    { backgroundColor: pilgrim.is_active ? '#10b981' : '#ef4444' }
                  ]}>
                    {pilgrim.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div style={styles.pilgrimDetails}>
                  <div>📧 {pilgrim.email || 'No email'}</div>
                  <div>📱 {pilgrim.phone || 'No phone'}</div>
                  <div>📅 Joined: {new Date(pilgrim.created_at).toLocaleDateString()}</div>
                  <div>📋 Requests: {pilgrim.assistance_requests?.length || 0}</div>
                </div>
              </div>
              
              <div style={styles.pilgrimActions}>
                <button
                  onClick={() => viewPilgrimProfile(pilgrim)}
                  style={styles.viewButton}
                >
                  View Profile
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: Colors.text.primary,
    margin: 0,
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: Colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: Colors.secondary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
  },
  loading: {
    fontSize: '18px',
    color: Colors.text.secondary,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: Colors.text.secondary,
  },
  pilgrimsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  noPilgrims: {
    textAlign: 'center',
    padding: '40px',
    color: Colors.text.secondary,
    fontSize: '16px',
  },
  pilgrimCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pilgrimInfo: {
    flex: 1,
  },
  pilgrimHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  pilgrimName: {
    fontSize: '18px',
    fontWeight: '600',
    color: Colors.text.primary,
    margin: 0,
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  pilgrimDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
    fontSize: '14px',
    color: Colors.text.secondary,
  },
  pilgrimActions: {
    display: 'flex',
    gap: '8px',
  },
  viewButton: {
    padding: '8px 16px',
    backgroundColor: Colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  profileCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  profileName: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: Colors.text.primary,
    margin: 0,
  },
  profileDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  },
  detailRow: {
    fontSize: '14px',
    color: Colors.text.secondary,
  },
  requestsSection: {
    marginTop: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: '16px',
  },
  noRequests: {
    textAlign: 'center',
    padding: '40px',
    color: Colors.text.secondary,
    fontSize: '16px',
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  requestCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  requestTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: Colors.text.primary,
    margin: 0,
  },
  requestBadges: {
    display: 'flex',
    gap: '8px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  requestDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
    fontSize: '14px',
    color: Colors.text.secondary,
    marginBottom: '12px',
  },
  requestDescription: {
    fontSize: '14px',
    color: Colors.text.secondary,
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '6px',
  },
};

export default PilgrimManagement;
