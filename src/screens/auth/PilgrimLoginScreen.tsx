import React, { useState } from 'react';
import { View, Text, SafeAreaView, Alert, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { ErrorDisplay, InlineError } from '../../components/common/ErrorDisplay';
import { ErrorHandlingService, UserFriendlyError } from '../../services/errorHandlingService';

const PilgrimLoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signInWithEmail } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [mainError, setMainError] = useState<UserFriendlyError | null>(null);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailError = ErrorHandlingService.handleValidationError('email', email);
    const passwordError = ErrorHandlingService.handleValidationError('password', password);
    
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    setMainError(null); // Clear main error when validating
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMainError(null);
    
    try {
      console.log('[PilgrimLogin] Starting login attempt');
      const result = await signInWithEmail(email.trim(), password);
      console.log('[PilgrimLogin] SignIn result:', { 
        hasData: !!result.data, 
        hasError: !!result.error,
        hasUserFriendlyError: !!result.error?.userFriendlyError 
      });
      
      if (result.error) {
        console.log('[PilgrimLogin] Processing error:', result.error);
        
        // Check if the error has a user-friendly version
        if (result.error.userFriendlyError) {
          console.log('[PilgrimLogin] Using existing userFriendlyError:', result.error.userFriendlyError);
          console.log('[PilgrimLogin] About to call setMainError with:', result.error.userFriendlyError);
          setMainError(result.error.userFriendlyError);
          console.log('[PilgrimLogin] setMainError called successfully');
        } else {
          // Fallback to processing the error
          console.log('[PilgrimLogin] Creating new userFriendlyError');
          const userFriendlyError = ErrorHandlingService.handleAuthError(result.error);
          console.log('[PilgrimLogin] Generated userFriendlyError:', userFriendlyError);
          console.log('[PilgrimLogin] About to call setMainError with generated error');
          setMainError(userFriendlyError);
          console.log('[PilgrimLogin] setMainError called successfully');
        }
        return;
      }

      // Verify user has pilgrim role
      if (!result.user || result.user.role !== 'pilgrim') {
        console.log('[PilgrimLogin] Access denied - user role:', result.user?.role);
        setMainError({
          title: 'Access Denied',
          message: 'This account is not authorized for pilgrim access. Please use the correct login portal for your account type.',
          action: 'Check account type',
          severity: 'error'
        });
        
        // Sign out the user
        const { signOut } = useAuth();
        await signOut();
        return;
      }
    } catch (error: any) {
      console.error('[PilgrimLogin] Unexpected error:', error);
      const userFriendlyError = ErrorHandlingService.handleAuthError(error);
      setMainError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality will be implemented here.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Pilgrim Sign In</Text>
            <Text style={styles.subtitle}>Request assistance during your journey</Text>
          </View>

          <ErrorDisplay 
            error={mainError} 
            onDismiss={() => setMainError(null)} 
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            <InlineError error={errors.email} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
            <InlineError error={errors.password} />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PilgrimSignUp')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  linkText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  signUpLink: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PilgrimLoginScreen;
