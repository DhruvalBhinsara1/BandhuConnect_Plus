import { supabase } from './supabase';
import { User, UserRole } from '../types';
import { deviceService } from './deviceService';

export class AuthService {
  async signUp(email: string, password: string, userData: any) {
    try {
      console.log('[AuthService] Starting signup for:', email);
      console.log('[AuthService] UserData:', userData);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('[AuthService] Auth signup response:', { user: authData.user?.id, error: authError });

      if (authError) {
        console.log('[AuthService] Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user returned from signup');
      }

      // If no session (email confirmation required)
      if (!authData.session) {
        console.log('[AuthService] No session - email confirmation required');
        return { 
          data: { 
            user: authData.user, 
            profile: null,
            emailConfirmationRequired: true,
            pendingUserData: userData
          }, 
          error: null 
        };
      }

      // Set the session to authenticate the user for RLS
      await supabase.auth.setSession(authData.session);
      console.log('[AuthService] Session set for user:', authData.user.id);

      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create profile with authenticated session
      console.log('[AuthService] Creating profile for user:', authData.user.id);
      const profileData = {
        id: authData.user.id,
        email: authData.user.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        ...(userData.role === 'volunteer' && {
          skills: userData.skills || [],
          volunteer_status: 'available',
          is_active: true,
        }),
      };

      console.log('[AuthService] Profile data to insert:', profileData);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('[AuthService] Profile creation error:', profileError);
        console.error('[AuthService] Profile data that failed:', profileData);
        
        // If duplicate phone number, try updating existing profile instead
        if (profileError.code === '23505' && profileError.message?.includes('profiles_phone_key')) {
          console.log('[AuthService] Duplicate phone detected, trying to update existing profile');
          
          const { data: updateResult, error: updateError } = await supabase
            .from('profiles')
            .update({
              name: profileData.name,
              role: profileData.role,
              ...(profileData.role === 'volunteer' && {
                skills: profileData.skills,
                volunteer_status: profileData.volunteer_status,
                is_active: profileData.is_active,
              }),
            })
            .eq('phone', profileData.phone)
            .select()
            .single();
            
          if (updateError) {
            console.error('[AuthService] Profile update also failed:', updateError);
            throw profileError;
          }
          
          console.log('[AuthService] Profile updated successfully after phone conflict:', updateResult);
          return { data: { user: authData.user, profile: updateResult }, error: null };
        }
        
        throw profileError;
      }

      console.log('[AuthService] Profile created successfully:', profile);
      return { data: { user: authData.user, profile }, error: null };
    } catch (error) {
      console.log('[AuthService] SignUp catch error:', error);
      return { data: null, error };
    }
  }

  async signInWithEmail(email: string, password: string) {
    try {
      console.log('[AuthService] SignIn attempt for email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[AuthService] Supabase auth response:', { data: data.user?.id, error });

      if (error) {
        console.log('[AuthService] Auth error details:', error);
        throw error;
      }

      // Register device after successful login
      const deviceId = await deviceService.registerDevice();
      console.log('[AuthService] Device registered:', deviceId);

      return { data, error: null };
    } catch (error) {
      console.log('[AuthService] SignIn catch error:', error);
      return { data: null, error };
    }
  }


  async signOut() {
    try {
      // Deactivate current device before signing out
      const devices = await deviceService.getActiveDevices();
      const currentToken = deviceService.getDeviceToken();
      const currentDevice = devices.find(d => d.device_token === currentToken);
      
      if (currentDevice) {
        console.log('[AuthService] Deactivating device:', currentDevice.device_id);
        await deviceService.deactivateDevice(currentDevice.device_id);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Error during sign out:', error);
      return { error };
    }
  }

  async getActiveDevices() {
    return deviceService.getActiveDevices();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Register device if we have an active user
      if (user) {
        await deviceService.registerDevice();
      }
      
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error getting current user profile:', error);
        return null;
      }

      // If no profile exists, return user with basic info
      if (!profile) {
        console.error('[AuthService] No profile found for user:', user.id, 'Email:', user.email);
        console.error('[AuthService] This indicates signup did not create profile properly');
        return {
          id: user.id,
          email: user.email,
          name: null,
          phone: null,
          role: null,
        } as User;
      }

      return profile;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createProfileAfterConfirmation(userData: any) {
    try {
      console.log('[AuthService] Creating profile after email confirmation');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Create profile with authenticated session
      const profileData = {
        id: user.id,
        email: user.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        ...(userData.role === 'volunteer' && {
          skills: userData.skills || [],
          volunteer_status: 'available',
          is_active: true,
        }),
      };

      console.log('[AuthService] Profile data to insert after confirmation:', profileData);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('[AuthService] Profile creation error after confirmation:', profileError);
        console.error('[AuthService] Profile data that failed after confirmation:', profileData);
        
        // If duplicate phone number, try updating existing profile instead
        if (profileError.code === '23505' && profileError.message?.includes('profiles_phone_key')) {
          console.log('[AuthService] Duplicate phone detected, trying to update existing profile');
          
          const { data: updateResult, error: updateError } = await supabase
            .from('profiles')
            .update({
              name: profileData.name,
              role: profileData.role,
              ...(profileData.role === 'volunteer' && {
                skills: profileData.skills,
                volunteer_status: profileData.volunteer_status,
                is_active: profileData.is_active,
              }),
            })
            .eq('phone', profileData.phone)
            .select()
            .single();
            
          if (updateError) {
            console.error('[AuthService] Profile update also failed:', updateError);
            throw profileError;
          }
          
          console.log('[AuthService] Profile updated successfully after phone conflict:', updateResult);
          return { data: { user, profile: updateResult }, error: null };
        }
        
        throw profileError;
      }

      console.log('[AuthService] Profile created successfully after confirmation:', profile);
      return { data: { user, profile }, error: null };
    } catch (error) {
      console.log('[AuthService] CreateProfileAfterConfirmation error:', error);
      return { data: null, error };
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
