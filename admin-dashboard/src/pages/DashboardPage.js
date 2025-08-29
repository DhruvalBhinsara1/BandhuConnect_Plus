import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Colors, Theme } from '../constants/Colors';
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
    backgroundColor: Colors.primary,
    color: Colors.textPrimary,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Colors.secondary,
    borderBottom: `1px solid ${Colors.border}`,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    margin: 0,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  signOutButton: {
    padding: `${Theme.spacing.sm} ${Theme.spacing.lg}`,
    borderRadius: Theme.borderRadius.sm,
    border: 'none',
    backgroundColor: Colors.error,
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.md,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  navigation: {
    display: 'flex',
    backgroundColor: Colors.secondary,
    borderBottom: `1px solid ${Colors.border}`,
    padding: `0 ${Theme.spacing.lg}`,
  },
  navButton: {
    backgroundColor: 'transparent',
    color: Colors.textSecondary,
    border: 'none',
    padding: `${Theme.spacing.md} ${Theme.spacing.lg}`,
    fontSize: Theme.fontSize.md,
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s ease',
  },
  activeNavButton: {
    backgroundColor: 'transparent',
    color: Colors.textPrimary,
    border: 'none',
    padding: `${Theme.spacing.md} ${Theme.spacing.lg}`,
    fontSize: Theme.fontSize.md,
    cursor: 'pointer',
    borderBottom: `3px solid ${Colors.accent}`,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    overflow: 'auto',
  },
  overviewContainer: {
    padding: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.xxl,
    marginBottom: Theme.spacing.lg,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  statCard: {
    backgroundColor: Colors.secondary,
    padding: Theme.spacing.lg + 'px 8px',
    borderRadius: Theme.borderRadius.md,
    textAlign: 'center',
    border: `1px solid ${Colors.border}`,
    boxShadow: `0 2px 8px ${Colors.shadow}`,
  },
  statNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: Colors.accent,
    margin: `${Theme.spacing.sm} 0`,
  },
  statSubtext: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.sm,
    margin: 0,
  },
  quickActions: {
    marginBottom: Theme.spacing.xl,
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: Theme.spacing.md,
  },
  actionButton: {
    backgroundColor: Colors.accent,
    color: Colors.textPrimary,
    border: 'none',
    padding: `${Theme.spacing.md} ${Theme.spacing.lg}`,
    borderRadius: Theme.borderRadius.sm,
    fontSize: Theme.fontSize.md,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
    boxShadow: `0 2px 4px ${Colors.shadow}`,
  },
  recentActivity: {
    backgroundColor: Colors.secondary,
    padding: Theme.spacing.lg + 'px 8px',
    borderRadius: Theme.borderRadius.md,
    border: `1px solid ${Colors.border}`,
    boxShadow: `0 2px 8px ${Colors.shadow}`,
  },
  activityList: {
    margin: 0,
  },
  activityItem: {
    color: Colors.textSecondary,
    margin: `${Theme.spacing.sm} 0`,
    padding: `${Theme.spacing.sm} 0`,
    borderBottom: `1px solid ${Colors.border}`,
  },
  placeholderContainer: {
    padding: Theme.spacing.xl + 'px 8px',
    textAlign: 'center',
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.lg,
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto',
  },
};
