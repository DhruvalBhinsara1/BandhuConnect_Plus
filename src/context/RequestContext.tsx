import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { requestService } from '../services/requestService';
import { assignmentService } from '../services/assignmentService';
import { AssistanceRequest, Assignment, RequestType, Priority, LocationData } from '../types';
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
      const { data, error } = await assignmentService.getAssignments(filters);
      if (data && !error) {
        setAssignments(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (id: string, status: string) => {
    const result = await assignmentService.updateAssignmentStatus(id, status as any);
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
    return await updateAssignmentStatus(id, 'on_duty');
  };

  const completeTask = async (id: string) => {
    return await updateAssignmentStatus(id, 'completed');
  };

  useEffect(() => {
    if (user) {
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
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setAssignments(prev => [payload.new, ...prev]);
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
