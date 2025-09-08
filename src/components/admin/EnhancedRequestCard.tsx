import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationFormatter } from '../../utils/locationFormatter';
import { StyleSheet } from 'react-native';
import { PROFESSIONAL_DESIGN } from '../../design/professionalDesignSystem';

interface EnhancedRequestCardProps {
  item: any;
  onAssign: (item: any) => void;
  onViewDetails?: (item: any) => void;
  showImage?: boolean;
  showLocation?: boolean;
  compactMode?: boolean;
}

const EnhancedRequestCard: React.FC<EnhancedRequestCardProps> = ({
  item,
  onAssign,
  onViewDetails,
  showImage = true,
  showLocation = true,
  compactMode = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getRequestTypeColor = (type: string) => {
    const colorMap = PROFESSIONAL_DESIGN.COLORS;
    const typeColors: { [key: string]: string } = {
      medical: colorMap.error,
      emergency: '#ea580c',
      lost_person: colorMap.info,
      sanitation: colorMap.success,
      crowd_management: '#9333ea',
      guidance: '#0d9488',
      general: colorMap.textSecondary
    };
    return typeColors[type] || typeColors.general;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap = PROFESSIONAL_DESIGN.COLORS;
    const priorityColors: { [key: string]: string } = {
      high: colorMap.error,
      medium: colorMap.warning,
      low: colorMap.success
    };
    return priorityColors[priority] || priorityColors.medium;
  };

  const getStatusColor = (status: string) => {
    const colorMap = PROFESSIONAL_DESIGN.COLORS;
    const statusColors: { [key: string]: string } = {
      pending: colorMap.warning,
      assigned: colorMap.info,
      in_progress: '#8b5cf6',
      completed: colorMap.success,
      cancelled: colorMap.textTertiary
    };
    return statusColors[status] || statusColors.pending;
  };

  // Format location using the new location formatter
  const formattedLocation = LocationFormatter.formatLocation(item.location, {
    showCoordinates: false,
    fallbackText: 'Location not specified'
  });

  const hasImage = item.photo_url && !imageError;

  return (
    <View style={[
      styles.card,
      compactMode && styles.compactCard
    ]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Request Type Badge */}
          <View style={[
            styles.typeBadge,
            { backgroundColor: getRequestTypeColor(item.request_type || item.type || 'general') + '15' }
          ]}>
            <View style={[
              styles.typeIndicator,
              { backgroundColor: getRequestTypeColor(item.request_type || item.type || 'general') }
            ]} />
            <Text style={[
              styles.typeText,
              { color: getRequestTypeColor(item.request_type || item.type || 'general') }
            ]}>
              {(item.request_type || item.type || 'general').replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          {/* Priority Badge */}
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority || 'medium') + '15' }
          ]}>
            <Ionicons 
              name="alert-circle-outline" 
              size={12} 
              color={getPriorityColor(item.priority || 'medium')} 
            />
            <Text style={[
              styles.priorityText,
              { color: getPriorityColor(item.priority || 'medium') }
            ]}>
              {(item.priority || 'medium').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timeText}>{formatTimeAgo(item.created_at)}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title || item.description}
          </Text>
          
          {item.title && item.description && (
            <Text style={styles.description} numberOfLines={compactMode ? 2 : 3}>
              {item.description}
            </Text>
          )}
        </View>

        {/* Improved Image Section */}
        {showImage && hasImage && !compactMode && (
          <View style={styles.imageContainer}>
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="small" color={PROFESSIONAL_DESIGN.COLORS.accent} />
              </View>
            )}
            <Image
              source={{ uri: item.photo_url }}
              style={[styles.requestImage, imageLoading && styles.hiddenImage]}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
            {!imageLoading && !imageError && (
              <View style={styles.imageOverlay}>
                <Ionicons name="image-outline" size={16} color="white" />
              </View>
            )}
            {imageError && (
              <View style={styles.imageErrorContainer}>
                <Ionicons name="image-outline" size={24} color={PROFESSIONAL_DESIGN.COLORS.textTertiary} />
                <Text style={styles.imageErrorText}>Image unavailable</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Professional Location Section */}
      {showLocation && (
        <View style={styles.locationSection}>
          <View style={styles.locationInfo}>
            <View style={styles.locationIcon}>
              <Ionicons name="location-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.accent} />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {formattedLocation.displayText}
            </Text>
            {formattedLocation.accuracy && (
              <View style={styles.accuracyBadge}>
                <Text style={styles.accuracyText}>
                  {formattedLocation.accuracy}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Professional User Info Section */}
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.user?.name || item.pilgrim?.name || 'Unknown User'}
            </Text>
            {item.user?.phone && (
              <Text style={styles.userPhone}>
                {item.user.phone}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Professional Action Section */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => onViewDetails?.(item)}
        >
          <Ionicons name="eye-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
          <Text style={styles.secondaryButtonText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            item.status !== 'pending' && styles.disabledButton
          ]}
          onPress={() => onAssign(item)}
          disabled={item.status !== 'pending'}
        >
          <Ionicons 
            name={item.status === 'pending' ? "person-add-outline" : "checkmark-circle-outline"} 
            size={16} 
            color="white" 
          />
          <Text style={styles.primaryButtonText}>
            {item.status === 'pending' ? 'Assign' : 'Assigned'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image indicator for compact mode */}
      {showImage && hasImage && compactMode && (
        <View style={styles.compactImageIndicator}>
          <Ionicons name="image-outline" size={12} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  compactCard: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  requestImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    zIndex: 2,
  },
  hiddenImage: {
    opacity: 0,
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  imageErrorText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textTertiary,
    marginTop: 4,
    fontSize: 10,
  },
  compactImageIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    padding: 4,
  },
  locationSection: {
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  accuracyBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  accuracyText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  userSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  userPhone: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});

export default EnhancedRequestCard;
