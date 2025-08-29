import React, { useState } from 'react';
import { supabase } from '../supabase';
import VolunteerManagement from '../components/VolunteerManagement';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(`Sign Out Failed: ${error.message}`);
    }
    // The onAuthStateChange listener in App.js will handle the redirect
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'volunteers':
        return <VolunteerManagement />;
      case 'requests':
        return <RequestManagement />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Overview />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>BandhuConnect+ Admin</h1>
        <button onClick={handleSignOut} style={styles.signOutButton}>
          Sign Out
        </button>
      </div>
      
      <div style={styles.navigation}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? styles.activeNavButton : styles.navButton}
        >
          📊 Overview
        </button>
        <button 
          onClick={() => setActiveTab('volunteers')}
          style={activeTab === 'volunteers' ? styles.activeNavButton : styles.navButton}
        >
          👥 Volunteers
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          style={activeTab === 'requests' ? styles.activeNavButton : styles.navButton}
        >
          📋 Requests
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          style={activeTab === 'analytics' ? styles.activeNavButton : styles.navButton}
        >
          📈 Analytics
        </button>
      </div>

      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
}

// Overview Component
function Overview() {
  const [stats, setStats] = React.useState({
    activeVolunteers: 0,
    inactiveVolunteers: 0,
    onDutyVolunteers: 0,
    offDutyVolunteers: 0,
    activeRequests: 0,
    resolvedToday: 0
  });

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total volunteers count (fallback until status columns are added)
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'volunteer');

      // Try to get status-based counts, fallback to totals if columns don't exist
      let activeCount = 0, inactiveCount = 0, onDutyCount = 0, offDutyCount = 0;
      
      try {
        const { count: active } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'volunteer')
          .eq('volunteer_status', 'active');
        activeCount = active || 0;

        const { count: inactive } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'volunteer')
          .eq('volunteer_status', 'inactive');
        inactiveCount = inactive || 0;

        const { count: onDuty } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'volunteer')
          .eq('duty_status', 'on_duty');
        onDutyCount = onDuty || 0;

        const { count: offDuty } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'volunteer')
          .eq('duty_status', 'off_duty');
        offDutyCount = offDuty || 0;
      } catch (statusError) {
        // Status columns don't exist yet, show placeholder values
        activeCount = totalCount || 0;
        inactiveCount = 0;
        onDutyCount = 0;
        offDutyCount = totalCount || 0;
      }

      setStats(prev => ({
        ...prev,
        activeVolunteers: activeCount,
        inactiveVolunteers: inactiveCount,
        onDutyVolunteers: onDutyCount,
        offDutyVolunteers: offDutyCount
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div style={styles.overviewContainer}>
      <h2 style={styles.sectionTitle}>Dashboard Overview</h2>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Active Volunteers</h3>
          <p style={styles.statNumber}>{stats.activeVolunteers}</p>
          <p style={styles.statSubtext}>Currently active</p>
        </div>
        <div style={styles.statCard}>
          <h3>Inactive Volunteers</h3>
          <p style={styles.statNumber}>{stats.inactiveVolunteers}</p>
          <p style={styles.statSubtext}>Not active</p>
        </div>
        <div style={styles.statCard}>
          <h3>On Duty</h3>
          <p style={styles.statNumber}>{stats.onDutyVolunteers}</p>
          <p style={styles.statSubtext}>Currently working</p>
        </div>
        <div style={styles.statCard}>
          <h3>Off Duty</h3>
          <p style={styles.statNumber}>{stats.offDutyVolunteers}</p>
          <p style={styles.statSubtext}>Available volunteers</p>
        </div>
      </div>
      
      <div style={styles.quickActions}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionButtons}>
          <button style={styles.actionButton}>
            👥 Add Volunteer
          </button>
          <button style={styles.actionButton}>
            📋 View All Requests
          </button>
          <button style={styles.actionButton}>
            📊 Generate Report
          </button>
          <button style={styles.actionButton}>
            ⚙️ System Settings
          </button>
        </div>
      </div>

      <div style={styles.recentActivity}>
        <h3 style={styles.sectionTitle}>Recent Activity</h3>
        <div style={styles.activityList}>
          <p style={styles.activityItem}>Welcome to BandhuConnect+ Admin Dashboard!</p>
          <p style={styles.activityItem}>Start by adding volunteers to your system.</p>
          <p style={styles.activityItem}>Monitor assistance requests in real-time.</p>
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function RequestManagement() {
  return (
    <div style={styles.placeholderContainer}>
      <h2 style={styles.sectionTitle}>Request Management</h2>
      <p style={styles.placeholderText}>
        Request management system will be implemented here.
        This will include viewing, assigning, and tracking assistance requests.
      </p>
    </div>
  );
}

function Analytics() {
  return (
    <div style={styles.placeholderContainer}>
      <h2 style={styles.sectionTitle}>Analytics & Reports</h2>
      <p style={styles.placeholderText}>
        Analytics dashboard will show volunteer performance, request trends,
        response times, and other key metrics.
      </p>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    backgroundColor: '#121212',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#1E1E1E',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: '24px',
    margin: 0,
    color: '#FFFFFF',
  },
  signOutButton: {
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#FF3B30',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  navigation: {
    display: 'flex',
    backgroundColor: '#1E1E1E',
    borderBottom: '1px solid #333',
    padding: '0 20px',
  },
  navButton: {
    backgroundColor: 'transparent',
    color: '#B3B3B3',
    border: 'none',
    padding: '15px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s ease',
  },
  activeNavButton: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: 'none',
    padding: '15px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    borderBottom: '3px solid #007BFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    overflow: 'auto',
  },
  overviewContainer: {
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#FFFFFF',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#1E1E1E',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #333',
  },
  statNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#007BFF',
    margin: '10px 0',
  },
  statSubtext: {
    color: '#B3B3B3',
    fontSize: '14px',
    margin: 0,
  },
  quickActions: {
    marginBottom: '30px',
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  actionButton: {
    backgroundColor: '#007BFF',
    color: '#FFFFFF',
    border: 'none',
    padding: '15px 20px',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  recentActivity: {
    backgroundColor: '#1E1E1E',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #333',
  },
  activityList: {
    margin: 0,
  },
  activityItem: {
    color: '#B3B3B3',
    margin: '10px 0',
    padding: '10px 0',
    borderBottom: '1px solid #333',
  },
  placeholderContainer: {
    padding: '40px',
    textAlign: 'center',
  },
  placeholderText: {
    color: '#B3B3B3',
    fontSize: '18px',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto',
  },
};
