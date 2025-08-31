export type UserRole = 'volunteer' | 'admin' | 'pilgrim';

export type RequestType = 'medical' | 'emergency' | 'lost_person' | 'sanitation' | 'crowd_management' | 'guidance' | 'general';

export type RequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type AssignmentStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'emergency';

export type MessageType = 'text' | 'image' | 'location';

export interface User {
  id: string;
  user_id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole | null;
  skills: string[];
  age?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  status?: string; // Keep for backward compatibility
  volunteer_status?: string; // Database field for volunteers
  is_active: boolean;
  created_at: string;
  updated_at: string;
  needsProfileCompletion?: boolean; // Flag for incomplete profiles
}

export interface AssistanceRequest {
  id: string;
  user_id: string;
  type: RequestType;
  title: string;
  description: string;
  photo_url?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: RequestStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Assignment {
  id: string;
  request_id: string;
  volunteer_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  request?: AssistanceRequest;
  volunteer?: User;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  channel_id: string;
  content: string;
  message_type: MessageType;
  created_at: string;
  sender?: User;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'general' | 'emergency' | 'direct';
  participants: string[];
  created_at: string;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export interface VolunteerStats {
  totalTasks: number;
  completedTasks: number;
  activeAssignments: number;
  hoursWorked: number;
}

export interface AdminStats {
  totalVolunteers: number;
  activeVolunteers: number;
  availableVolunteers: number;
  busyVolunteers: number;
  onDutyVolunteers: number;
  offlineVolunteers: number;
  pendingRequests: number;
  assignedRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  totalRequests: number;
}
