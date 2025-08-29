import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function VolunteerManagement() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  // Fetch volunteers from database
  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'volunteer')
        .order('name');
      
      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVolunteerStatus = async (volunteerId, statusType, newStatus) => {
    try {
      const updateData = {};
      updateData[statusType] = newStatus;
      
      // If volunteer becomes inactive, automatically set them off duty
      if (statusType === 'volunteer_status' && newStatus === 'inactive') {
        updateData.duty_status = 'off_duty';
      }
      
      // If volunteer is put on duty, automatically set them to active
      if (statusType === 'duty_status' && newStatus === 'on_duty') {
        updateData.volunteer_status = 'active';
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', volunteerId);

      if (error) throw error;
      
      // Refresh the volunteers list
      fetchVolunteers();
      alert(`Volunteer status updated successfully!`);
    } catch (error) {
      console.error('Error updating volunteer status:', error);
      alert('Error updating volunteer status. Please try again.');
    }
  };

  // Filter volunteers based on search and skills
  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         volunteer.phone?.includes(searchTerm);
    const matchesSkill = !skillFilter || volunteer.skills?.includes(skillFilter);
    return matchesSearch && matchesSkill;
  });

  // Get unique skills for filter dropdown
  const allSkills = [...new Set(volunteers.flatMap(v => v.skills || []))];

  const handleDeleteVolunteer = async (volunteerId) => {
    if (!window.confirm('Are you sure you want to remove this volunteer?')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', volunteerId);
      
      if (error) throw error;
      setVolunteers(volunteers.filter(v => v.id !== volunteerId));
      alert('Volunteer removed successfully');
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      alert('Failed to remove volunteer');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading volunteers...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Volunteer Management</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          style={styles.addButton}
        >
          + Add Volunteer
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search volunteers by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Skills</option>
          {allSkills.map(skill => (
            <option key={skill} value={skill}>{skill}</option>
          ))}
        </select>
      </div>

      {/* Volunteers Stats */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <h3>Total Volunteers</h3>
          <p style={styles.statNumber}>{volunteers.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Active Today</h3>
          <p style={styles.statNumber}>{volunteers.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Available Now</h3>
          <p style={styles.statNumber}>{volunteers.length}</p>
        </div>
      </div>

      {/* Volunteers List */}
      <div style={styles.volunteersList}>
        {filteredVolunteers.length === 0 ? (
          <div style={styles.noVolunteers}>
            {searchTerm || skillFilter ? 'No volunteers match your filters' : 'No volunteers found'}
          </div>
        ) : (
          filteredVolunteers.map(volunteer => (
            <div key={volunteer.id} style={styles.volunteerCard}>
              <div style={styles.volunteerInfo}>
                <h3 style={styles.volunteerName}>{volunteer.name || 'Unnamed Volunteer'}</h3>
                <p style={styles.volunteerPhone}>📞 {volunteer.phone}</p>
                <div style={styles.volunteerSkills}>
                  <strong>Skills: </strong>
                  {volunteer.skills?.length > 0 ? (
                    volunteer.skills.map(skill => (
                      <span key={skill} style={styles.skillTag}>{skill}</span>
                    ))
                  ) : (
                    <span style={styles.noSkills}>No skills listed</span>
                  )}
                </div>
                {volunteer.age && (
                  <p style={styles.volunteerAge}>Age: {volunteer.age}</p>
                )}
                <p style={styles.volunteerUpdated}>
                  Last updated: {new Date(volunteer.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div style={styles.volunteerActions}>
                {/* Status Override Controls */}
                <div style={styles.statusControls}>
                  <div style={styles.statusGroup}>
                    <label style={styles.statusLabel}>Status:</label>
                    <button
                      onClick={() => updateVolunteerStatus(volunteer.id, 'volunteer_status', 
                        volunteer.volunteer_status === 'active' ? 'inactive' : 'active')}
                      style={{
                        ...styles.statusButton,
                        backgroundColor: volunteer.volunteer_status === 'active' ? '#4CAF50' : '#f44336'
                      }}
                    >
                      {volunteer.volunteer_status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div style={styles.statusGroup}>
                    <label style={styles.statusLabel}>Duty:</label>
                    <button
                      onClick={() => updateVolunteerStatus(volunteer.id, 'duty_status', 
                        volunteer.duty_status === 'on_duty' ? 'off_duty' : 'on_duty')}
                      style={{
                        ...styles.statusButton,
                        backgroundColor: volunteer.duty_status === 'on_duty' ? '#2196F3' : '#9E9E9E'
                      }}
                    >
                      {volunteer.duty_status === 'on_duty' ? 'On Duty' : 'Off Duty'}
                    </button>
                  </div>
                </div>
                <div style={styles.actionButtons}>
                  <button
                    onClick={() => setSelectedVolunteer(volunteer)}
                    style={styles.viewButton}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeleteVolunteer(volunteer.id)}
                    style={styles.deleteButton}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Volunteer Modal */}
      {showAddForm && (
        <AddVolunteerModal 
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchVolunteers();
          }}
        />
      )}

      {/* Volunteer Details Modal */}
      {selectedVolunteer && (
        <VolunteerDetailsModal
          volunteer={selectedVolunteer}
          onClose={() => setSelectedVolunteer(null)}
          onUpdate={fetchVolunteers}
        />
      )}
    </div>
  );
}

// Add Volunteer Modal Component
function AddVolunteerModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skills: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a unique UUID for the volunteer
      const volunteerId = crypto.randomUUID();

      // Create profile directly without auth user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: volunteerId,
          name: formData.name,
          phone: formData.phone,
          role: 'volunteer',
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
          age: formData.age ? parseInt(formData.age) : null,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      alert('Volunteer added successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error adding volunteer:', error);
      if (error.code === '23505') {
        if (error.details.includes('phone')) {
          alert('A volunteer with this phone number already exists. Please use a different phone number.');
        } else if (error.details.includes('email')) {
          alert('A volunteer with this email already exists. Please use a different email.');
        } else {
          alert('This volunteer already exists in the system.');
        }
      } else {
        alert('Error adding volunteer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3>Add New Volunteer</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            style={styles.input}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Skills (comma separated)"
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
            style={styles.input}
          />
          <input
            type="number"
            placeholder="Age (optional)"
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
            style={styles.input}
          />
          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? 'Adding...' : 'Add Volunteer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Volunteer Details Modal Component
function VolunteerDetailsModal({ volunteer, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: volunteer.name || '',
    phone: volunteer.phone || '',
    skills: volunteer.skills?.join(', ') || '',
    age: volunteer.age || ''
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
          age: formData.age ? parseInt(formData.age) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', volunteer.id);

      if (error) throw error;

      alert('Volunteer updated successfully!');
      setEditing(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating volunteer:', error);
      alert('Failed to update volunteer');
    }
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3>Volunteer Details</h3>
        {editing ? (
          <form onSubmit={handleUpdate}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={styles.input}
            />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={styles.input}
            />
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
              style={styles.input}
            />
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              style={styles.input}
            />
            <div style={styles.modalActions}>
              <button type="button" onClick={() => setEditing(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p><strong>Name:</strong> {volunteer.name}</p>
            <p><strong>Phone:</strong> {volunteer.phone}</p>
            <p><strong>Skills:</strong> {volunteer.skills?.join(', ') || 'None'}</p>
            <p><strong>Age:</strong> {volunteer.age || 'Not specified'}</p>
            <p><strong>Joined:</strong> {new Date(volunteer.updated_at).toLocaleDateString()}</p>
            <div style={styles.modalActions}>
              <button onClick={onClose} style={styles.cancelButton}>
                Close
              </button>
              <button onClick={() => setEditing(true)} style={styles.submitButton}>
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#121212',
    color: '#FFFFFF',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    margin: 0,
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#007BFF',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  controls: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '300px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    fontSize: '16px',
  },
  filterSelect: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    fontSize: '16px',
    minWidth: '150px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#1E1E1E',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007BFF',
    margin: '10px 0 0 0',
  },
  volunteersList: {
    display: 'grid',
    gap: '15px',
  },
  volunteerCard: {
    backgroundColor: '#1E1E1E',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#FFFFFF',
  },
  volunteerPhone: {
    fontSize: '16px',
    color: '#B3B3B3',
    margin: '5px 0',
  },
  volunteerSkills: {
    margin: '10px 0',
  },
  skillTag: {
    backgroundColor: '#007BFF',
    color: '#FFFFFF',
    padding: '4px 8px',
    borderRadius: '16px',
    fontSize: '12px',
    marginRight: '6px',
    display: 'inline-block',
  },
  noSkills: {
    color: '#B3B3B3',
    fontStyle: 'italic',
  },
  volunteerAge: {
    fontSize: '14px',
    color: '#B3B3B3',
    margin: '5px 0',
  },
  volunteerUpdated: {
    fontSize: '12px',
    color: '#666',
    margin: '5px 0',
  },
  volunteerActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    minWidth: '200px',
  },
  statusControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '10px',
  },
  statusGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#CCCCCC',
    minWidth: '40px',
  },
  statusButton: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  viewButton: {
    backgroundColor: '#28A745',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  noVolunteers: {
    textAlign: 'center',
    color: '#B3B3B3',
    fontSize: '18px',
    padding: '40px',
  },
  loading: {
    textAlign: 'center',
    color: '#B3B3B3',
    fontSize: '18px',
    padding: '40px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: '30px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    color: '#FFFFFF',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  cancelButton: {
    backgroundColor: '#666',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
