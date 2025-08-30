export const COLORS = {
  primary: '#3b82f6',
  primaryDark: '#1d4ed8',
  secondary: '#22c55e',
  secondaryDark: '#15803d',
  background: '#ffffff',
  backgroundDark: '#1A2332',
  surface: '#f8fafc',
  surfaceDark: '#334155',
  text: '#1e293b',
  textDark: '#f1f5f9',
  textSecondary: '#64748b',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  border: '#e2e8f0',
  borderDark: '#475569',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const REQUEST_TYPES = [
  { value: 'medical', label: 'Medical Emergency', icon: 'medical-bag' },
  { value: 'safety', label: 'Safety Issue', icon: 'shield-alert' },
  { value: 'lost_child', label: 'Lost Child', icon: 'account-child' },
  { value: 'sanitation', label: 'Sanitation', icon: 'water' },
  { value: 'general', label: 'General Help', icon: 'help-circle' },
];

export const VOLUNTEER_SKILLS = [
  'First Aid',
  'Medical',
  'Security',
  'Translation',
  'Crowd Control',
  'Technical Support',
  'Food Service',
  'Transportation',
  'Child Care',
  'Emergency Response',
];

export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'emergency', label: 'Emergency', color: '#dc2626' },
];

export const STATUS_COLORS = {
  pending: '#f59e0b',
  assigned: '#3b82f6',
  in_progress: '#8b5cf6',
  completed: '#10b981',
  cancelled: '#6b7280',
  accepted: '#22c55e',
  on_duty: '#8b5cf6',
};

export const CHAT_CHANNELS = {
  GENERAL: 'general',
  EMERGENCY: 'emergency',
  VOLUNTEERS: 'volunteers',
  ADMINS: 'admins',
};

export const LOCATION_ACCURACY = {
  HIGH: 1,
  BALANCED: 2,
  LOW: 3,
};

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  MESSAGE_RECEIVED: 'message_received',
  EMERGENCY_ALERT: 'emergency_alert',
  STATUS_UPDATE: 'status_update',
};

export const APP_CONFIG = {
  NAME: 'BandhuConnect+',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@bandhuconnect.com',
  PRIVACY_URL: 'https://bandhuconnect.com/privacy',
  TERMS_URL: 'https://bandhuconnect.com/terms',
};
