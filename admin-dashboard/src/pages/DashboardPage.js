import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Colors, Theme } from '../constants/Colors';
import VolunteerManagement from '../components/VolunteerManagement';
import PilgrimManagement from '../components/PilgrimManagement';
import RequestManagement from '../components/RequestManagement';

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
      case 'pilgrims':
        return <PilgrimManagement />;
      case 'requests':
        return <RequestManagement />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Overview setActiveTab={setActiveTab} />;
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
          onClick={() => setActiveTab('pilgrims')}
          style={activeTab === 'pilgrims' ? styles.activeNavButton : styles.navButton}
        >
          🙏 Pilgrims
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
function Overview({ setActiveTab }) {
  const [stats, setStats] = React.useState({
    activeVolunteers: 0,
    inactiveVolunteers: 0,
    onDutyVolunteers: 0,
    offDutyVolunteers: 0,
    activeRequests: 0,
    resolvedToday: 0
  });
  const [volunteers, setVolunteers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchVolunteers()]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'volunteer')
        .limit(6);

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

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
          <button
            style={styles.actionButton}
            onClick={() => setActiveTab('volunteers')}
          >
            👥 Add Volunteer
          </button>
          <button
            style={styles.actionButton}
            onClick={() => setActiveTab('requests')}
          >
            📋 View All Requests
          </button>
          <button
            style={styles.actionButton}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Generate Report
          </button>
          <button
            style={styles.actionButton}
            onClick={() => alert('System settings coming soon!')}
          >
            ⚙️ System Settings
          </button>
        </div>
      </div>

      {/* Volunteer Profiles Section */}
      <div style={styles.volunteersSection}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Recent Volunteers</h3>
          <button
            style={styles.viewAllButton}
            onClick={() => setActiveTab('volunteers')}
          >
            View All
          </button>
        </div>
        <div style={styles.volunteersGrid}>
          {volunteers.length > 0 ? volunteers.map((volunteer, index) => (
            <div key={volunteer.id || index} style={styles.volunteerCard}>
              <div style={styles.volunteerAvatar}>
                {volunteer.full_name ? volunteer.full_name.charAt(0).toUpperCase() : 'V'}
              </div>
              <div style={styles.volunteerInfo}>
                <h4 style={styles.volunteerName}>
                  {volunteer.full_name || 'Volunteer'}
                </h4>
                <p style={styles.volunteerPhone}>
                  📞 {volunteer.phone || 'No phone'}
                </p>
                <p style={styles.volunteerEmail}>
                  ✉️ {volunteer.email || 'No email'}
                </p>
                <div style={styles.volunteerStatus}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: volunteer.volunteer_status === 'active' ? Colors.success : Colors.offDuty
                  }}>
                    {volunteer.volunteer_status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No volunteers found. Add some volunteers to get started!</p>
              <button
                style={styles.addVolunteerButton}
                onClick={() => setActiveTab('volunteers')}
              >
                Add First Volunteer
              </button>
            </div>
          )}
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

// Placeholder components for other tabs (RequestManagement moved to separate component)

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

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: Colors.primary,
      color: Colors.textPrimary,
    }}>
      <h2>Loading...</h2>
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
    padding: `${Theme.spacing.lg} ${Theme.spacing.md}`,
    borderRadius: Theme.borderRadius.lg,
    textAlign: 'center',
    border: `1px solid ${Colors.border}`,
    boxShadow: `0 4px 16px ${Colors.shadow}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 24px ${Colors.shadow}`,
    },
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
    borderRadius: Theme.borderRadius.md,
    fontSize: Theme.fontSize.md,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '600',
    boxShadow: `0 4px 12px ${Colors.shadow}`,
    '&:hover': {
      backgroundColor: Colors.accentSecondary,
      transform: 'translateY(-2px)',
      boxShadow: `0 6px 16px ${Colors.shadow}`,
    },
  },
  recentActivity: {
    backgroundColor: Colors.secondary,
    padding: `${Theme.spacing.lg} ${Theme.spacing.md}`,
    borderRadius: Theme.borderRadius.lg,
    border: `1px solid ${Colors.border}`,
    boxShadow: `0 4px 16px ${Colors.shadow}`,
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
  // New styles for volunteer profiles section
  volunteersSection: {
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  viewAllButton: {
    backgroundColor: 'transparent',
    color: Colors.accent,
    border: `1px solid ${Colors.accent}`,
    padding: `${Theme.spacing.sm} ${Theme.spacing.md}`,
    borderRadius: Theme.borderRadius.sm,
    fontSize: Theme.fontSize.sm,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '500',
  },
  volunteersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: Theme.spacing.md,
  },
  volunteerCard: {
    backgroundColor: Colors.secondary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    border: `1px solid ${Colors.border}`,
    boxShadow: `0 2px 8px ${Colors.shadow}`,
    display: 'flex',
    alignItems: 'center',
    gap: Theme.spacing.md,
    transition: 'all 0.3s ease',
  },
  volunteerAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: Colors.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.lg,
    fontWeight: 'bold',
    flexShrink: 0,
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.md,
    fontWeight: 'bold',
    margin: `0 0 ${Theme.spacing.xs} 0`,
  },
  volunteerPhone: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.sm,
    margin: `${Theme.spacing.xs} 0`,
  },
  volunteerEmail: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.sm,
    margin: `${Theme.spacing.xs} 0`,
  },
  volunteerStatus: {
    marginTop: Theme.spacing.sm,
  },
  statusBadge: {
    padding: `${Theme.spacing.xs} ${Theme.spacing.sm}`,
    borderRadius: Theme.borderRadius.sm,
    fontSize: Theme.fontSize.xs,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: Theme.spacing.xl,
    backgroundColor: Colors.secondary,
    borderRadius: Theme.borderRadius.lg,
    border: `1px solid ${Colors.border}`,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.md,
    marginBottom: Theme.spacing.lg,
  },
  addVolunteerButton: {
    backgroundColor: Colors.accent,
    color: Colors.textPrimary,
    border: 'none',
    padding: `${Theme.spacing.sm} ${Theme.spacing.lg}`,
    borderRadius: Theme.borderRadius.md,
    fontSize: Theme.fontSize.md,
    cursor: 'pointer',
    fontWeight: '600',
  },
};
