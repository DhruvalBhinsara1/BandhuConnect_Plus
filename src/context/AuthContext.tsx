import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, userData: any) => Promise<{ data: any; error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithPhone: (phone: string) => Promise<{ data: any; error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
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
        setSession(session);
        
        if (session?.user) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
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
      const result = await authService.signUp(email, password, userData);
      if (result.data && !result.error) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
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
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhone = async (phone: string) => {
    return await authService.signInWithPhone(phone);
  };

  const verifyOtp = async (phone: string, token: string) => {
    setLoading(true);
    try {
      const result = await authService.verifyOtp(phone, token);
      if (result.data && !result.error) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { data: null, error: 'No user logged in' };
    
    const result = await authService.updateProfile(user.user_id, updates);
    if (result.data && !result.error) {
      setUser(result.data);
    }
    return result;
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signInWithEmail,
    signInWithPhone,
    verifyOtp,
    signOut,
    updateProfile,
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
