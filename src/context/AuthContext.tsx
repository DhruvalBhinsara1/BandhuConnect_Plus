import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { User, AuthState, UserRole } from '../types';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, userData: any) => Promise<{ data: any; error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: any; user?: User }>;
  signOut: () => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<{ data: any; error: any }>;
  setUserRole: (role: UserRole) => void;
  selectedRole: UserRole | null;
  getCurrentUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'volunteer' | 'pilgrim' | null>(null);

  useEffect(() => {
    // Get initial session and restore saved role
    const getCurrentUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        
        // If user exists but no profile, redirect to profile completion
        if (currentUser && !currentUser.name) {
          console.log('[AuthContext] User found but no profile - needs profile completion');
          // This happens after email confirmation - profile creation was deferred
          // Set a flag to indicate profile completion is needed
          currentUser.needsProfileCompletion = true;
        }
        
        setUser(currentUser);
        return currentUser;
      } catch (error) {
        console.error('Error getting current user:', error);
        return null;
      }
    };

    const getInitialSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          const savedRole = await AsyncStorage.getItem('selectedRole');
          if (savedRole) {
            setSelectedRole(savedRole as 'admin' | 'volunteer' | 'pilgrim');
          } else if (currentUser.role) {
            // Use user's role from profile if no saved role
            setSelectedRole(currentUser.role);
            await AsyncStorage.setItem('selectedRole', currentUser.role);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change:', event, 'Session exists:', !!session);
        setSession(session);
        
        if (session?.user) {
          let currentUser = await authService.getCurrentUser();
          
          // If no profile exists after email confirmation, try to create it
          if (!currentUser || !currentUser.role) {
            console.log('[AuthContext] No profile found, checking for pending user data');
            console.log('[AuthContext] Auth event:', event, 'Session user ID:', session?.user?.id);
            
            // Check if we have pending user data from signup
            const pendingData = await AsyncStorage.getItem('pendingUserData');
            if (pendingData) {
              console.log('[AuthContext] Creating profile after email confirmation');
              const userData = JSON.parse(pendingData);
              
              const result = await authService.createProfileAfterConfirmation(userData);
              if (result.data && !result.error) {
                currentUser = result.data.profile;
                console.log('[AuthContext] Profile created successfully after confirmation');
              } else {
                console.error('[AuthContext] Failed to create profile after confirmation:', result.error);
              }
              
              // Clear pending data
              await AsyncStorage.removeItem('pendingUserData');
            }
          }
          
          // Check if user needs profile completion
          if (currentUser && !currentUser.name) {
            currentUser.needsProfileCompletion = true;
          }
          
          setUser(currentUser);
          
          // Always use the user's actual role from database, not saved role
          if (currentUser && currentUser.role) {
            setSelectedRole(currentUser.role);
            await AsyncStorage.setItem('selectedRole', currentUser.role);
          }
        } else {
          setUser(null);
          setSelectedRole(null);
          await AsyncStorage.removeItem('selectedRole');
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    setLoading(true);
    try {
      console.log('[AuthContext] SignUp called with:', { email, userData });
      const result = await authService.signUp(email, password, userData);
      console.log('[AuthContext] SignUp result:', result);
      
      if (result.data && !result.error) {
        console.log('[AuthContext] SignUp successful, getting current user...');
        
        // If email confirmation is required, store pending user data
        if (result.data.emailConfirmationRequired && result.data.pendingUserData) {
          console.log('[AuthContext] Storing pending user data for email confirmation');
          await AsyncStorage.setItem('pendingUserData', JSON.stringify(result.data.pendingUserData));
        }
        
        const currentUser = await authService.getCurrentUser();
        console.log('[AuthContext] Current user after signup:', currentUser);
        setUser(currentUser);
      } else {
        console.log('[AuthContext] SignUp failed:', result.error);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.signInWithEmail(email, password);
      if (result.data && !result.error) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        return { ...result, user: currentUser };
      }
      return result;
    } finally {
      setLoading(false);
    }
  };


  const signOut = async () => {
    setLoading(true);
    console.log('[AuthContext] SignOut called');
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
      setSelectedRole(null);
      await AsyncStorage.removeItem('selectedRole');
      console.log('[AuthContext] SignOut completed successfully');
    } catch (error) {
      console.error('[AuthContext] SignOut error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { data: null, error: 'No user logged in' };
    
    const result = await authService.updateProfile(user.id, updates);
    if (result.data && !result.error) {
      setUser(result.data);
    }
    return result;
  };

  const setUserRole = async (role: 'admin' | 'volunteer' | 'pilgrim') => {
    setSelectedRole(role);
    await AsyncStorage.setItem('selectedRole', role);
  };

  const getCurrentUser = async () => {
    return await authService.getCurrentUser();
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signInWithEmail,
    signOut,
    updateProfile,
    setUserRole,
    selectedRole,
    getCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
