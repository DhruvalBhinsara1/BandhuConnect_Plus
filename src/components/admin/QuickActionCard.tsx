import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PROFESSIONAL_DESIGN } from '../../design/professionalDesignSystem';

interface QuickActionCardProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: number;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
  disabled = false,
  badge,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.disabledContainer,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons
            name={icon}
            size={24}
            color={PROFESSIONAL_DESIGN.COLORS.surface}
          />
          {badge !== undefined && badge > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {badge > 99 ? '99+' : badge.toString()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, disabled && styles.disabledText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, disabled && styles.disabledText]}>
              {subtitle}
            </Text>
          )}
        </View>
        
        <Ionicons
          name="chevron-forward"
          size={20}
          color={
            disabled
              ? PROFESSIONAL_DESIGN.COLORS.textTertiary
              : PROFESSIONAL_DESIGN.COLORS.textSecondary
          }
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: PROFESSIONAL_DESIGN.SPACING.md,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PROFESSIONAL_DESIGN.SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.error,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.body.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  subtitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontSize,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    lineHeight: 16,
  },
  disabledText: {
    color: PROFESSIONAL_DESIGN.COLORS.textTertiary,
  },
});
