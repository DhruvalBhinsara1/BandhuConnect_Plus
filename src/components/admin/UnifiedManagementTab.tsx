import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PROFESSIONAL_DESIGN } from '../../design/professionalDesignSystem';

interface TabData {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  data: any[];
}

interface UnifiedManagementTabProps {
  volunteerData: any[];
  requestData: any[];
  pilgrimData: any[];
  loading?: boolean;
  onItemPress: (type: string, item: any) => void;
  onActionPress: (type: string, action: string, item?: any) => void;
}

export const UnifiedManagementTab: React.FC<UnifiedManagementTabProps> = ({
  volunteerData,
  requestData,
  pilgrimData,
  loading = false,
  onItemPress,
  onActionPress,
}) => {
  const [activeTab, setActiveTab] = useState<string>('volunteers');

  const tabs: TabData[] = [
    {
      id: 'volunteers',
      title: 'Volunteers',
      icon: 'people',
      count: volunteerData.length,
      data: volunteerData,
    },
    {
      id: 'requests',
      title: 'Requests',
      icon: 'help-circle',
      count: requestData.length,
      data: requestData,
    },
    {
      id: 'pilgrims',
      title: 'Pilgrims',
      icon: 'walk',
      count: pilgrimData.length,
      data: pilgrimData,
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const renderTabSegment = () => (
    <View style={styles.tabSegmentContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tabSegment,
            activeTab === tab.id && styles.activeTabSegment,
          ]}
          onPress={() => setActiveTab(tab.id)}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Ionicons
              name={tab.icon}
              size={20}
              color={
                activeTab === tab.id
                  ? PROFESSIONAL_DESIGN.COLORS.primary
                  : PROFESSIONAL_DESIGN.COLORS.textSecondary
              }
            />
            <Text
              style={[
                styles.tabTitle,
                activeTab === tab.id && styles.activeTabTitle,
              ]}
            >
              {tab.title}
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === tab.id && styles.activeTabBadge,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === tab.id && styles.activeTabBadgeText,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderActionButtons = () => {
    const actions = getActionsForTab(activeTab);
    
    return (
      <View style={styles.actionButtonsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              action.primary && styles.primaryActionButton,
            ]}
            onPress={() => onActionPress(activeTab, action.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={action.icon}
              size={16}
              color={
                action.primary
                  ? PROFESSIONAL_DESIGN.COLORS.surface
                  : PROFESSIONAL_DESIGN.COLORS.primary
              }
            />
            <Text
              style={[
                styles.actionButtonText,
                action.primary && styles.primaryActionButtonText,
              ]}
            >
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderListItem = (item: any, index: number) => {
    switch (activeTab) {
      case 'volunteers':
        return renderVolunteerItem(item, index);
      case 'requests':
        return renderRequestItem(item, index);
      case 'pilgrims':
        return renderPilgrimItem(item, index);
      default:
        return null;
    }
  };

  const renderVolunteerItem = (volunteer: any, index: number) => (
    <TouchableOpacity
      key={volunteer.id || index}
      style={styles.listItem}
      onPress={() => onItemPress('volunteer', volunteer)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemHeader}>
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemTitle}>{volunteer.name || 'Unknown'}</Text>
          <Text style={styles.listItemSubtitle}>
            {volunteer.skills?.join(', ') || 'No skills listed'}
          </Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getVolunteerStatusColor(volunteer.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {volunteer.status?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>
      </View>
      <View style={styles.listItemFooter}>
        <Text style={styles.listItemMeta}>
          Last active: {formatTime(volunteer.lastSeen)}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={PROFESSIONAL_DESIGN.COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderRequestItem = (request: any, index: number) => (
    <TouchableOpacity
      key={request.id || index}
      style={styles.listItem}
      onPress={() => onItemPress('request', request)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemHeader}>
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemTitle}>
            {request.assistanceType || 'General Help'}
          </Text>
          <Text style={styles.listItemSubtitle}>
            {request.description || 'No description'}
          </Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getRequestStatusColor(request.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {request.status?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
      </View>
      <View style={styles.listItemFooter}>
        <Text style={styles.listItemMeta}>
          Priority: {request.priority || 'Normal'} • {formatTime(request.createdAt)}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={PROFESSIONAL_DESIGN.COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderPilgrimItem = (pilgrim: any, index: number) => (
    <TouchableOpacity
      key={pilgrim.id || index}
      style={styles.listItem}
      onPress={() => onItemPress('pilgrim', pilgrim)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemHeader}>
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemTitle}>{pilgrim.name || 'Unknown'}</Text>
          <Text style={styles.listItemSubtitle}>
            Group: {pilgrim.groupName || 'Individual'}
          </Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getPilgrimStatusColor(pilgrim.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {pilgrim.status?.toUpperCase() || 'ACTIVE'}
          </Text>
        </View>
      </View>
      <View style={styles.listItemFooter}>
        <Text style={styles.listItemMeta}>
          Location: {pilgrim.currentLocation || 'Unknown'} • {formatTime(pilgrim.lastUpdate)}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={PROFESSIONAL_DESIGN.COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTabData?.icon || 'help-circle'}
        size={48}
        color={PROFESSIONAL_DESIGN.COLORS.textSecondary}
      />
      <Text style={styles.emptyStateTitle}>
        No {activeTabData?.title.toLowerCase()} found
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {getEmptyStateMessage(activeTab)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={PROFESSIONAL_DESIGN.COLORS.primary}
        />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Segment Control */}
      {renderTabSegment()}

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Content List */}
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTabData?.data.length === 0 ? (
          renderEmptyState()
        ) : (
          activeTabData?.data.map((item, index) =>
            renderListItem(item, index)
          )
        )}
      </ScrollView>
    </View>
  );
};

// Helper functions
const getActionsForTab = (tab: string) => {
  const actions = {
    volunteers: [
      { id: 'add', title: 'Add Volunteer', icon: 'add' as const, primary: true },
      { id: 'bulk', title: 'Bulk Actions', icon: 'options' as const },
      { id: 'export', title: 'Export', icon: 'download' as const },
    ],
    requests: [
      { id: 'auto-assign', title: 'Auto-Assign', icon: 'flash' as const, primary: true },
      { id: 'filter', title: 'Filter', icon: 'funnel' as const },
      { id: 'export', title: 'Export', icon: 'download' as const },
    ],
    pilgrims: [
      { id: 'add', title: 'Add Pilgrim', icon: 'add' as const, primary: true },
      { id: 'groups', title: 'Manage Groups', icon: 'people' as const },
      { id: 'export', title: 'Export', icon: 'download' as const },
    ],
  };
  return actions[tab] || [];
};

const getVolunteerStatusColor = (status: string) => {
  const colors = {
    available: PROFESSIONAL_DESIGN.COLORS.success,
    busy: PROFESSIONAL_DESIGN.COLORS.warning,
    offline: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    'on-duty': PROFESSIONAL_DESIGN.COLORS.info,
  };
  return colors[status] || PROFESSIONAL_DESIGN.COLORS.textSecondary;
};

const getRequestStatusColor = (status: string) => {
  const colors = {
    pending: PROFESSIONAL_DESIGN.COLORS.warning,
    assigned: PROFESSIONAL_DESIGN.COLORS.info,
    'in-progress': PROFESSIONAL_DESIGN.COLORS.primary,
    completed: PROFESSIONAL_DESIGN.COLORS.success,
    cancelled: PROFESSIONAL_DESIGN.COLORS.error,
  };
  return colors[status] || PROFESSIONAL_DESIGN.COLORS.warning;
};

const getPilgrimStatusColor = (status: string) => {
  const colors = {
    active: PROFESSIONAL_DESIGN.COLORS.success,
    resting: PROFESSIONAL_DESIGN.COLORS.warning,
    emergency: PROFESSIONAL_DESIGN.COLORS.error,
    offline: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  };
  return colors[status] || PROFESSIONAL_DESIGN.COLORS.success;
};

const formatTime = (timestamp: string | Date | null) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getEmptyStateMessage = (tab: string) => {
  const messages = {
    volunteers: 'Add volunteers to start managing your team',
    requests: 'No assistance requests at the moment',
    pilgrims: 'No pilgrims registered in the system',
  };
  return messages[tab] || 'No data available';
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  loadingText: {
    marginTop: PROFESSIONAL_DESIGN.SPACING.md,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.body.fontSize,
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    margin: PROFESSIONAL_DESIGN.SPACING.md,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: PROFESSIONAL_DESIGN.SPACING.xs,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  tabSegment: {
    flex: 1,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xs,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    alignItems: 'center',
  },
  activeTabSegment: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  tabContent: {
    alignItems: 'center',
    gap: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  tabTitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  activeTabTitle: {
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
  },
  tabBadge: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.full,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  activeTabBadgeText: {
    color: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.primary,
    gap: PROFESSIONAL_DESIGN.SPACING.xs,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  primaryActionButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
    borderColor: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  actionButtonText: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  primaryActionButtonText: {
    color: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
  },
  listItem: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: PROFESSIONAL_DESIGN.SPACING.md,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  listItemInfo: {
    flex: 1,
    marginRight: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  listItemTitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.body.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  listItemSubtitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontSize,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    lineHeight: 18,
  },
  statusIndicator: {
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.xs,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemMeta: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontSize,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.xl * 2,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.h3.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.h3.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginTop: PROFESSIONAL_DESIGN.SPACING.md,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.body.fontSize,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
