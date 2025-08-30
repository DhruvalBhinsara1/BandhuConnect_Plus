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

      {/* Compact Stats Row */}
      <div style={styles.compactStats}>
        <div style={styles.compactStatItem}>
          <span style={styles.statLabel}>Total:</span>
          <span style={styles.statValue}>{volunteers.length}</span>
        </div>
        <div style={styles.compactStatItem}>
          <span style={styles.statLabel}>Active:</span>
          <span style={styles.statValue}>{volunteers.filter(v => v.volunteer_status === 'active').length}</span>
        </div>
        <div style={styles.compactStatItem}>
          <span style={styles.statLabel}>On Duty:</span>
          <span style={styles.statValue}>{volunteers.filter(v => v.duty_status === 'on_duty').length}</span>
        </div>
        <div style={styles.compactStatItem}>
          <span style={styles.statLabel}>Filtered:</span>
          <span style={styles.statValue}>{filteredVolunteers.length}</span>
        </div>
      </div>

      {/* Volunteers Table */}
      <div style={styles.tableContainer}>
        {filteredVolunteers.length === 0 ? (
          <div style={styles.noVolunteers}>
            {searchTerm || skillFilter ? 'No volunteers match your filters' : 'No volunteers found'}
          </div>
        ) : (
          <div style={styles.volunteersTable}>
            {/* Table Header */}
            <div style={styles.tableHeader}>
              <div style={styles.headerCell}>Volunteer</div>
              <div style={styles.headerCell}>Contact</div>
              <div style={styles.headerCell}>Skills</div>
              <div style={styles.headerCell}>Status</div>
              <div style={styles.headerCell}>Actions</div>
            </div>
            
            {/* Table Rows */}
            {filteredVolunteers.map(volunteer => (
              <div key={volunteer.id} style={styles.tableRow}>
                <div style={styles.tableCell}>
                  <div style={styles.volunteerProfile}>
                    <div style={styles.avatar}>
                      {(volunteer.name || 'V').charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.profileInfo}>
                      <div style={styles.volunteerName}>{volunteer.name || 'Unnamed'}</div>
                      <div style={styles.volunteerAge}>
                        {volunteer.age ? `Age ${volunteer.age}` : 'Age not specified'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={styles.tableCell}>
                  <div style={styles.contactInfo}>
                    <div style={styles.phone}>📞 {volunteer.phone}</div>
                    <div style={styles.email}>✉️ {volunteer.email || 'No email'}</div>
                  </div>
                </div>
                
                <div style={styles.tableCell}>
                  <div style={styles.skillsContainer}>
                    {volunteer.skills?.length > 0 ? (
                      volunteer.skills.slice(0, 2).map(skill => (
                        <span key={skill} style={styles.skillTag}>{skill}</span>
                      ))
                    ) : (
                      <span style={styles.noSkills}>No skills</span>
                    )}
                    {volunteer.skills?.length > 2 && (
                      <span style={styles.moreSkills}>+{volunteer.skills.length - 2}</span>
                    )}
                  </div>
                </div>
                
                <div style={styles.tableCell}>
                  <div style={styles.statusContainer}>
                    <button
                      onClick={() => updateVolunteerStatus(volunteer.id, 'volunteer_status', 
                        volunteer.volunteer_status === 'active' ? 'inactive' : 'active')}
                      style={{
                        ...styles.compactStatusButton,
                        backgroundColor: volunteer.volunteer_status === 'active' ? '#238636' : '#656D76'
                      }}
                    >
                      {volunteer.volunteer_status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => updateVolunteerStatus(volunteer.id, 'duty_status', 
                        volunteer.duty_status === 'on_duty' ? 'off_duty' : 'on_duty')}
                      style={{
                        ...styles.compactStatusButton,
                        backgroundColor: volunteer.duty_status === 'on_duty' ? '#1F6FEB' : '#656D76'
                      }}
                    >
                      {volunteer.duty_status === 'on_duty' ? 'On Duty' : 'Off Duty'}
                    </button>
                  </div>
                </div>
                
                <div style={styles.tableCell}>
                  <div style={styles.compactActions}>
                    <button
                      onClick={() => setSelectedVolunteer(volunteer)}
                      style={styles.compactViewButton}
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleDeleteVolunteer(volunteer.id)}
                      style={styles.compactDeleteButton}
                      title="Remove Volunteer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    padding: '16px',
    backgroundColor: '#0F1419',
    color: '#E6EDF3',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    margin: 0,
    color: '#E6EDF3',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#388BFD',
    color: '#E6EDF3',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '250px',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #30363D',
    backgroundColor: '#1C2128',
    color: '#E6EDF3',
    fontSize: '14px',
  },
  filterSelect: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #30363D',
    backgroundColor: '#1C2128',
    color: '#E6EDF3',
    fontSize: '14px',
    minWidth: '120px',
  },
  // Compact stats row
  compactStats: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: '#1C2128',
    borderRadius: '8px',
    border: '1px solid #30363D',
    flexWrap: 'wrap',
  },
  compactStatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#7D8590',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '16px',
    color: '#388BFD',
    fontWeight: '600',
  },
  // Table layout
  tableContainer: {
    backgroundColor: '#1C2128',
    borderRadius: '8px',
    border: '1px solid #30363D',
    overflow: 'hidden',
    '@media (max-width: 768px)': {
      overflow: 'auto',
    },
  },
  volunteersTable: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 2fr 2fr 1fr',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: '#0F1419',
    borderBottom: '1px solid #30363D',
    fontSize: '13px',
    fontWeight: '600',
    color: '#7D8590',
  },
  headerCell: {
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 2fr 2fr 1fr',
    gap: '16px',
    padding: '16px',
    borderBottom: '1px solid #30363D',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
  },
  tableCell: {
    display: 'flex',
    alignItems: 'center',
  },
  // Volunteer profile in table
  volunteerProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#388BFD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E6EDF3',
    fontSize: '16px',
    fontWeight: '600',
    flexShrink: 0,
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  volunteerName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#E6EDF3',
    margin: 0,
  },
  volunteerAge: {
    fontSize: '12px',
    color: '#7D8590',
  },
  // Contact info
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  phone: {
    fontSize: '13px',
    color: '#E6EDF3',
  },
  email: {
    fontSize: '12px',
    color: '#7D8590',
  },
  // Skills
  skillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
  },
  skillTag: {
    backgroundColor: '#388BFD',
    color: '#E6EDF3',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: '11px',
    color: '#7D8590',
    fontWeight: '500',
  },
  noSkills: {
    color: '#7D8590',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  // Status buttons
  statusContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  compactStatusButton: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    color: '#E6EDF3',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    minWidth: '60px',
  },
  // Actions
  compactActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  compactViewButton: {
    backgroundColor: '#238636',
    color: '#E6EDF3',
    border: 'none',
    padding: '6px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
  },
  compactDeleteButton: {
    backgroundColor: '#DA3633',
    color: '#E6EDF3',
    border: 'none',
    padding: '6px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
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
