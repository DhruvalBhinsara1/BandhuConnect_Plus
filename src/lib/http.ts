/**
 * HTTP Wrapper for BandhuConnect+ API calls
 * Provides consistent error handling for Supabase operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppError, toAppError } from './errors';

// Environment configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

interface ApiResponse<T = any> {
  data: T | null;
  error: AppError | null;
  success: boolean;
}

/**
 * Enhanced Supabase client with consistent error handling
 */
class BandhuHttpClient {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false // Disable for React Native
      },
      global: {
        headers: {
          'User-Agent': 'BandhuConnect+ Mobile App',
          'X-Client-Platform': 'react-native'
        }
      }
    });
  }

  /**
   * Get the underlying Supabase client for direct access when needed
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Execute a Supabase operation with error handling
   */
  async execute<T>(
    operation: () => Promise<{ data: T | null; error: any }>
  ): Promise<ApiResponse<T>> {
    try {
      const result = await operation();

      if (result.error) {
        const appError = this.normalizeSupabaseError(result.error);
        return {
          data: null,
          error: appError,
          success: false
        };
      }

      return {
        data: result.data,
        error: null,
        success: true
      };
    } catch (error) {
      const appError = toAppError(error, 'HttpClient');
      return {
        data: null,
        error: appError,
        success: false
      };
    }
  }

  /**
   * Authentication methods
   */
  async signIn(email: string, password: string): Promise<ApiResponse<any>> {
    return this.execute(() => 
      this.supabase.auth.signInWithPassword({ email, password })
    );
  }

  async signUp(email: string, password: string, metadata?: any): Promise<ApiResponse<any>> {
    return this.execute(() => 
      this.supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: metadata } 
      })
    );
  }

  async signOut(): Promise<ApiResponse<void>> {
    return this.execute(async () => {
      const result = await this.supabase.auth.signOut();
      return { data: null, error: result.error };
    });
  }

  async resetPassword(email: string): Promise<ApiResponse<any>> {
    return this.execute(() => 
      this.supabase.auth.resetPasswordForEmail(email)
    );
  }

  /**
   * Database operations
   */
  async select<T>(table: string, query: string = '*'): Promise<ApiResponse<T[]>> {
    return this.execute(async () => 
      await this.supabase.from(table).select(query)
    );
  }

  async insert<T>(table: string, data: any): Promise<ApiResponse<T>> {
    return this.execute(async () => 
      await this.supabase.from(table).insert(data).select().single()
    );
  }

  async update<T>(table: string, data: any, match: any): Promise<ApiResponse<T>> {
    return this.execute(async () => 
      await this.supabase.from(table).update(data).match(match).select().single()
    );
  }

  async delete<T>(table: string, match: any): Promise<ApiResponse<T>> {
    return this.execute(async () => 
      await this.supabase.from(table).delete().match(match).select().single()
    );
  }

  /**
   * Realtime subscriptions
   */
  async subscribe(
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) {
    try {
      const channel = this.supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table,
            filter 
          },
          callback
        )
        .subscribe();

      return {
        unsubscribe: () => this.supabase.removeChannel(channel),
        error: null
      };
    } catch (error) {
      return {
        unsubscribe: () => {},
        error: toAppError(error, 'HttpClient')
      };
    }
  }

  /**
   * Private helper methods
   */
  private normalizeSupabaseError(error: any): AppError {
    // Handle common Supabase errors with appropriate error codes
    const errorMap: Record<string, { code: string; message: string; retryable: boolean }> = {
      'invalid_credentials': {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        retryable: false
      },
      'email_not_confirmed': {
        code: 'AUTH_EMAIL_NOT_CONFIRMED',
        message: 'Please check your email and click the confirmation link',
        retryable: false
      },
      'too_many_requests': {
        code: 'NETWORK_RATE_LIMITED',
        message: 'Too many requests. Please try again later',
        retryable: true
      },
      'signup_disabled': {
        code: 'AUTH_ACCESS_DENIED',
        message: 'Account creation is currently disabled',
        retryable: false
      }
    };

    const errorInfo = errorMap[error?.code] || {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unexpected error occurred',
      retryable: false
    };

    return {
      code: errorInfo.code,
      message: errorInfo.message,
      retryable: errorInfo.retryable,
      correlationId: `supabase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

// Export singleton instance
export const httpClient = new BandhuHttpClient();

// Export types for external use
export type { ApiResponse };
