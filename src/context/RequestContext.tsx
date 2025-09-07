import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Assignment, AssistanceRequest, RequestType, Priority, LocationData } from '../types';
import { volunteerService } from '../services/volunteerService';
import { NotificationService } from '../services/notificationService';
import { assignmentService } from '../services/assignmentService';
import { requestService } from '../services/requestService';
import { AssignmentStatus } from '../types';
import { useAuth } from './AuthContext';

interface RequestContextType {
  requests: AssistanceRequest[];
  assignments: Assignment[];
  loading: boolean;
  createRequest: (requestData: {
    type: RequestType;
    title: string;
    description: string;
    location: LocationData;
    priority: Priority;
    photo_url?: string;
  }) => Promise<{ data: any; error: any }>;
  getRequests: (filters?: any) => Promise<void>;
  getAssignments: (filters?: any) => Promise<void>;
  deleteRequest: (id: string) => Promise<{ error: any }>;
  cancelRequest: (id: string) => Promise<{ data: any; error: any }>;
  updateAssignmentStatus: (id: string, status: string) => Promise<{ data: any; error: any }>;
  acceptAssignment: (id: string) => Promise<{ data: any; error: any }>;
  startTask: (id: string) => Promise<{ data: any; error: any }>;
  completeTask: (id: string) => Promise<{ data: any; error: any }>;
}

const RequestContext = createContext<RequestContextType | undefined>(undefined);

interface RequestProviderProps {
  children: ReactNode;
}

export const RequestProvider: React.FC<RequestProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  const createRequest = async (requestData: {
    type: RequestType;
    title: string;
    description: string;
    location: LocationData;
    priority: Priority;
    photo_url?: string;
  }) => {
    setLoading(true);
    try {
      const result = await requestService.createRequest(requestData);
      if (result.data && !result.error) {
        setRequests(prev => [result.data, ...prev]);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const getRequests = async (filters?: any) => {
    setLoading(true);
    try {
      const { data, error } = await requestService.getRequests(filters);
      if (data && !error) {
        setRequests(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const getAssignments = async (filters?: any) => {
    setLoading(true);
    try {
      console.log('🔍 RequestContext.getAssignments: Fetching with filters:', filters);
      const { data, error } = await assignmentService.getAssignments(filters);
      console.log('📊 RequestContext.getAssignments: Result:', { data, error });
      if (data && !error) {
        setAssignments(data);
        console.log('✅ RequestContext.getAssignments: Set assignments:', data.length);
      } else {
        console.error('❌ RequestContext.getAssignments: Error or no data:', error);
        // Don't clear assignments on error - keep existing ones to prevent UI flicker
        if (!data && !error) {
          // Only clear if we got a successful empty result
          setAssignments([]);
        }
      }
    } catch (err) {
      console.error('❌ RequestContext.getAssignments: Exception:', err);
      // Don't clear assignments on exception - keep existing ones
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (id: string, status: AssignmentStatus, completionLocation?: any) => {
    const result = await assignmentService.updateAssignmentStatus(id, status as any, completionLocation);
    if (result.data && !result.error) {
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === id ? { ...assignment, ...result.data } : assignment
        )
      );
    }
    return result;
  };

  const acceptAssignment = async (id: string) => {
    return await updateAssignmentStatus(id, 'accepted');
  };

  const startTask = async (id: string) => {
    // Get current assignment to check status
    const currentAssignment = assignments.find(a => a.id === id);
    
    if (currentAssignment?.status === 'pending') {
      // Skip acceptance step and go directly to in_progress
      return await updateAssignmentStatus(id, 'in_progress');
    } else {
      // Normal flow for already accepted tasks
      return await updateAssignmentStatus(id, 'in_progress');
    }
  };

  const completeTask = async (id: string) => {
    console.log('🎯 Completing task:', id);
    
    // Get current location before completing task
    let completionLocation = null;
    
    try {
      // Try to get current location
      const locationService = await import('../services/locationService');
      completionLocation = await locationService.locationService.getCurrentLocation();
      console.log('📍 Task completion location:', completionLocation);
    } catch (error) {
      console.log('⚠️ Could not get completion location:', error);
    }
    
    const result = await updateAssignmentStatus(id, 'completed', completionLocation);
    console.log('🎯 Complete task result:', result);
    return result;
  };

  const cancelRequest = async (id: string) => {
    setLoading(true);
    try {
      console.log('Cancelling request:', id);
      const result = await requestService.cancelRequest(id);
      console.log('Cancel result:', result);
      
      if (!result.error && result.data) {
        setRequests(prev => 
          prev.map(request => 
            request.id === id ? { ...request, status: 'cancelled', updated_at: result.data.updated_at } : request
          )
        );
        console.log('Request cancelled successfully in state');
      } else {
        console.error('Failed to cancel request:', result.error);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (id: string) => {
    setLoading(true);
    try {
      console.log('Deleting request:', id);
      const result = await requestService.deleteRequest(id);
      console.log('Delete result:', result);
      
      if (!result.error) {
        setRequests(prev => prev.filter(request => request.id !== id));
        console.log('Request deleted successfully from state');
      } else {
        console.error('Failed to delete request:', result.error);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Initial data fetch when user loads
      console.log('[RequestContext] User loaded, fetching initial data for role:', user.role);
      
      // Fetch requests
      getRequests();
      
      // Fetch assignments with appropriate filters
      if (user.role === 'volunteer') {
        console.log('[RequestContext] Fetching assignments for volunteer:', user.id);
        getAssignments({ volunteerId: user.id });
      } else {
        console.log('[RequestContext] Fetching all assignments for role:', user.role);
        getAssignments();
      }
      
      // Subscribe to real-time updates
      const requestSubscription = requestService.subscribeToRequests((payload) => {
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => 
            prev.map(req => req.id === payload.new.id ? payload.new : req)
          );
        }
      });

      if (user.role === 'volunteer') {
        const assignmentSubscription = assignmentService.subscribeToAssignments(
          user.id,
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              setAssignments(prev => [payload.new, ...prev]);
              // Send notification for new task assignment
              if (payload.new.request) {
                await NotificationService.sendTaskAssignmentNotification(
                  payload.new.request.title,
                  payload.new.request.type
                );
              }
            } else if (payload.eventType === 'UPDATE') {
              setAssignments(prev => 
                prev.map(assignment => 
                  assignment.id === payload.new.id ? payload.new : assignment
                )
              );
            }
          }
        );

        return () => {
          requestSubscription.unsubscribe();
          assignmentSubscription.unsubscribe();
        };
      }

      return () => {
        requestSubscription.unsubscribe();
      };
    }
  }, [user]);

  const value: RequestContextType = {
    requests,
    assignments,
    loading,
    createRequest,
    getRequests,
    getAssignments,
    deleteRequest,
    cancelRequest,
    updateAssignmentStatus,
    acceptAssignment,
    startTask,
    completeTask,
  };

  return (
    <RequestContext.Provider value={value}>
      {children}
    </RequestContext.Provider>
  );
};

export const useRequest = (): RequestContextType => {
  const context = useContext(RequestContext);
  if (context === undefined) {
    throw new Error('useRequest must be used within a RequestProvider');
  }
  return context;
};
