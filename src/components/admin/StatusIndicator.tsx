import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PROFESSIONAL_DESIGN } from '../../design/professionalDesignSystem';

interface StatusIndicatorProps {
  status: string;
  variant: 'volunteer' | 'request' | 'pilgrim' | 'system';
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  variant,
  size = 'medium',
  showText = true,
}) => {
  const getStatusConfig = () => {
    const configs = {
      volunteer: {
        available: {
          color: PROFESSIONAL_DESIGN.COLORS.success,
          icon: 'checkmark-circle' as const,
          text: 'Available',
        },
        busy: {
          color: PROFESSIONAL_DESIGN.COLORS.warning,
          icon: 'time' as const,
          text: 'Busy',
        },
        'on-duty': {
          color: PROFESSIONAL_DESIGN.COLORS.info,
          icon: 'shield-checkmark' as const,
          text: 'On Duty',
        },
        offline: {
          color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
          icon: 'radio-button-off' as const,
          text: 'Offline',
        },
      },
      request: {
        pending: {
          color: PROFESSIONAL_DESIGN.COLORS.warning,
          icon: 'hourglass' as const,
          text: 'Pending',
        },
        assigned: {
          color: PROFESSIONAL_DESIGN.COLORS.info,
          icon: 'person-add' as const,
          text: 'Assigned',
        },
        in_progress: {
          color: PROFESSIONAL_DESIGN.COLORS.primary,
          icon: 'play' as const,
          text: 'In Progress',
        },
        completed: {
          color: PROFESSIONAL_DESIGN.COLORS.success,
          icon: 'checkmark-circle' as const,
          text: 'Completed',
        },
        cancelled: {
          color: PROFESSIONAL_DESIGN.COLORS.error,
          icon: 'close-circle' as const,
          text: 'Cancelled',
        },
      },
      pilgrim: {
        active: {
          color: PROFESSIONAL_DESIGN.COLORS.success,
          icon: 'walk' as const,
          text: 'Active',
        },
        resting: {
          color: PROFESSIONAL_DESIGN.COLORS.warning,
          icon: 'bed' as const,
          text: 'Resting',
        },
        emergency: {
          color: PROFESSIONAL_DESIGN.COLORS.error,
          icon: 'alert' as const,
          text: 'Emergency',
        },
        offline: {
          color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
          icon: 'radio-button-off' as const,
          text: 'Offline',
        },
      },
      system: {
        online: {
          color: PROFESSIONAL_DESIGN.COLORS.success,
          icon: 'cloud-done' as const,
          text: 'Online',
        },
        syncing: {
          color: PROFESSIONAL_DESIGN.COLORS.info,
          icon: 'cloud-upload' as const,
          text: 'Syncing',
        },
        error: {
          color: PROFESSIONAL_DESIGN.COLORS.error,
          icon: 'cloud-offline' as const,
          text: 'Error',
        },
        maintenance: {
          color: PROFESSIONAL_DESIGN.COLORS.warning,
          icon: 'construct' as const,
          text: 'Maintenance',
        },
      },
    };

    const config = configs[variant]?.[status];
    return config || {
      color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
      icon: 'help-circle' as const,
      text: 'Unknown',
    };
  };

  const config = getStatusConfig();
  
  const getSizeConfig = () => {
    const sizes = {
      small: {
        containerSize: 24,
        iconSize: 12,
        fontSize: 10,
        padding: 4,
      },
      medium: {
        containerSize: 32,
        iconSize: 16,
        fontSize: 12,
        padding: 6,
      },
      large: {
        containerSize: 40,
        iconSize: 20,
        fontSize: 14,
        padding: 8,
      },
    };
    return sizes[size];
  };

  const sizeConfig = getSizeConfig();

  if (!showText) {
    return (
      <View
        style={[
          styles.iconOnly,
          {
            width: sizeConfig.containerSize,
            height: sizeConfig.containerSize,
            backgroundColor: config.color,
          },
        ]}
      >
        <Ionicons
          name={config.icon}
          size={sizeConfig.iconSize}
          color={PROFESSIONAL_DESIGN.COLORS.surface}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.color,
          paddingVertical: sizeConfig.padding,
          paddingHorizontal: sizeConfig.padding + 2,
        },
      ]}
    >
      <Ionicons
        name={config.icon}
        size={sizeConfig.iconSize}
        color={PROFESSIONAL_DESIGN.COLORS.surface}
      />
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeConfig.fontSize,
          },
        ]}
      >
        {config.text}
      </Text>
    </View>
  );
};

interface StatusFilterProps {
  statuses: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  activeStatus: string | null;
  onStatusChange: (status: string | null) => void;
  variant: 'volunteer' | 'request' | 'pilgrim';
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  statuses,
  activeStatus,
  onStatusChange,
  variant,
}) => {
  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeStatus === null && styles.activeFilterButton,
        ]}
        onPress={() => onStatusChange(null)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterButtonText,
            activeStatus === null && styles.activeFilterButtonText,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      
      {statuses.map((status) => (
        <TouchableOpacity
          key={status.key}
          style={[
            styles.filterButton,
            activeStatus === status.key && styles.activeFilterButton,
          ]}
          onPress={() => onStatusChange(status.key)}
          activeOpacity={0.7}
        >
          <StatusIndicator
            status={status.key}
            variant={variant}
            size="small"
            showText={false}
          />
          <Text
            style={[
              styles.filterButtonText,
              activeStatus === status.key && styles.activeFilterButtonText,
            ]}
          >
            {status.label}
          </Text>
          {status.count > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{status.count}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.full,
    gap: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  iconOnly: {
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.full,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
    gap: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  activeFilterButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
    borderColor: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  filterButtonText: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  activeFilterButtonText: {
    color: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  filterBadge: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.full,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xs,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.primary,
  },
});
