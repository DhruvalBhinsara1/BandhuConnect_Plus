/**
 * Role-Specific Theme Demo Component
 * Demonstrates the new role-based theming system
 * Following BandhuConnect+ Design & Theme Guidelines
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme, useThemeMode, useUserRole } from '../theme/RoleThemeContext';
import type { UserRole } from '../theme/roleTokens';

const RoleThemeDemo: React.FC = () => {
  const { theme, typography, spacing, borderRadius, shadows, getStatusColor, isDarkMode } = useTheme();
  const { themeMode, toggleTheme } = useThemeMode();
  const { userRole, setUserRole } = useUserRole();

  const roles: { key: UserRole; label: string; description: string }[] = [
    { key: 'pilgrim', label: '🙏 Pilgrim', description: 'Guidance & Comfort' },
    { key: 'volunteer', label: '👨‍⚕️ Volunteer', description: 'Action & Support' },
    { key: 'admin', label: '👑 Admin', description: 'Oversight & Authority' },
  ];

  const statusItems = [
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'failed', label: 'Failed', icon: '❌' },
    { key: 'info', label: 'Info', icon: 'ℹ️' },
  ] as const;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: theme.textInverse }]}>
          🎨 Role-Specific Theme Demo
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textInverse }]}>
          Current: {roles.find(r => r.key === userRole)?.label} • {themeMode === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </Text>
      </View>

      {/* Theme Toggle */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Theme Mode
        </Text>
        <TouchableOpacity
          style={[
            styles.themeToggle,
            { 
              backgroundColor: theme.secondary,
              ...shadows.base 
            }
          ]}
          onPress={toggleTheme}
        >
          <Text style={[styles.buttonText, { color: theme.textInverse }]}>
            {isDarkMode ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Role Selection */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          User Role Selection
        </Text>
        <View style={styles.roleGrid}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[
                styles.roleCard,
                {
                  backgroundColor: userRole === role.key ? theme.primary : theme.background,
                  borderColor: theme.border,
                  ...shadows.sm
                }
              ]}
              onPress={() => setUserRole(role.key)}
            >
              <Text
                style={[
                  styles.roleLabel,
                  {
                    color: userRole === role.key ? theme.textInverse : theme.textPrimary,
                    fontWeight: userRole === role.key ? typography.fontWeight.bold : typography.fontWeight.normal,
                  }
                ]}
              >
                {role.label}
              </Text>
              <Text
                style={[
                  styles.roleDescription,
                  {
                    color: userRole === role.key ? theme.textInverse : theme.textSecondary,
                  }
                ]}
              >
                {role.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color Palette Display */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Current Role Color Palette
        </Text>
        
        {/* Primary Colors */}
        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: theme.primary }]} />
          <View style={styles.colorInfo}>
            <Text style={[styles.colorLabel, { color: theme.textPrimary }]}>Primary</Text>
            <Text style={[styles.colorValue, { color: theme.textSecondary }]}>{theme.primary}</Text>
          </View>
        </View>

        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: theme.secondary }]} />
          <View style={styles.colorInfo}>
            <Text style={[styles.colorLabel, { color: theme.textPrimary }]}>Secondary</Text>
            <Text style={[styles.colorValue, { color: theme.textSecondary }]}>{theme.secondary}</Text>
          </View>
        </View>

        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: theme.accent }]} />
          <View style={styles.colorInfo}>
            <Text style={[styles.colorLabel, { color: theme.textPrimary }]}>Accent</Text>
            <Text style={[styles.colorValue, { color: theme.textSecondary }]}>{theme.accent}</Text>
          </View>
        </View>
      </View>

      {/* Status Colors */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Status Indicators (Shared)
        </Text>
        <View style={styles.statusGrid}>
          {statusItems.map((status) => (
            <View
              key={status.key}
              style={[
                styles.statusChip,
                { 
                  backgroundColor: getStatusColor(status.key),
                  ...shadows.sm 
                }
              ]}
            >
              <Text style={[styles.statusIcon]}>
                {status.icon}
              </Text>
              <Text style={[styles.statusLabel, { color: theme.textInverse }]}>
                {status.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sample Components */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Sample Components
        </Text>
        
        {/* Primary Button */}
        <TouchableOpacity
          style={[
            styles.sampleButton,
            { 
              backgroundColor: theme.primary,
              ...shadows.base 
            }
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.textInverse }]}>
            Primary Action Button
          </Text>
        </TouchableOpacity>

        {/* Secondary Button */}
        <TouchableOpacity
          style={[
            styles.sampleButton,
            { 
              backgroundColor: theme.secondary,
              ...shadows.base 
            }
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.textInverse }]}>
            Secondary Action Button
          </Text>
        </TouchableOpacity>

        {/* Accent Button */}
        <TouchableOpacity
          style={[
            styles.sampleButton,
            { 
              backgroundColor: theme.accent,
              ...shadows.base 
            }
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.textInverse }]}>
            Accent Action Button
          </Text>
        </TouchableOpacity>

        {/* Card Example */}
        <View
          style={[
            styles.sampleCard,
            { 
              backgroundColor: theme.background,
              borderColor: theme.border,
              ...shadows.md 
            }
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Sample Card Component
          </Text>
          <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
            This card demonstrates how content looks with the current theme.
            Text hierarchy and colors adapt to the selected role and mode.
          </Text>
          <View style={styles.cardFooter}>
            <Text style={[styles.cardMeta, { color: theme.textTertiary }]}>
              Role: {userRole} • Mode: {themeMode}
            </Text>
          </View>
        </View>
      </View>

      {/* Guidelines Reference */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Design Guidelines Summary
        </Text>
        <Text style={[styles.guidelineText, { color: theme.textSecondary }]}>
          🟦 <Text style={{ color: theme.textPrimary, fontWeight: typography.fontWeight.medium }}>Pilgrim:</Text> Blue primary (trust, guidance), orange secondary (requests), sky blue accent (progress)
        </Text>
        <Text style={[styles.guidelineText, { color: theme.textSecondary }]}>
          🟩 <Text style={{ color: theme.textPrimary, fontWeight: typography.fontWeight.medium }}>Volunteer:</Text> Green primary (action, help), blue secondary (navigation), yellow accent (urgency)
        </Text>
        <Text style={[styles.guidelineText, { color: theme.textSecondary }]}>
          🟥 <Text style={{ color: theme.textPrimary, fontWeight: typography.fontWeight.medium }}>Admin:</Text> Purple primary (oversight), blue secondary (consistency), orange accent (alerts)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeToggle: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  colorInfo: {
    flex: 1,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  colorValue: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sampleButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sampleCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  cardMeta: {
    fontSize: 12,
  },
  guidelineText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default RoleThemeDemo;
