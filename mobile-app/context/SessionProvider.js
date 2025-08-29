import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { router, useSegments } from 'expo-router';

const AuthContext = createContext({});

export function useSession() {
  return useContext(AuthContext);
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (session && !inAuthGroup) {
      // Redirect to the dashboard if the user is signed in and not in the tabs group.
      router.replace('/(tabs)/dashboard');
    } else if (!session && inAuthGroup) {
      // Redirect to the welcome screen if the user is not signed in.
      router.replace('/');
    }
  }, [session, loading, segments]);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
