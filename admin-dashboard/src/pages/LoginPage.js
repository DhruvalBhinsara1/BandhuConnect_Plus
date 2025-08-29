import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Colors, Theme } from '../constants/Colors';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`Login Failed: ${error.message}`);
    } else {
      // The onAuthStateChange listener in App.js will handle the redirect
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🔧</div>
        </div>
        <h2 style={styles.title}>BandhuConnect+ Admin</h2>
        <p style={styles.subtitle}>Manage volunteers and coordinate assistance</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: Colors.primary,
    color: Colors.textPrimary,
    backgroundImage: `linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.secondary} 100%)`,
  },
  formContainer: {
    padding: Theme.spacing.xl,
    backgroundColor: Colors.secondary,
    borderRadius: Theme.borderRadius.lg,
    boxShadow: `0 8px 32px ${Colors.shadow}`,
    width: '100%',
    maxWidth: '420px',
    border: `1px solid ${Colors.border}`,
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  logo: {
    width: '80px',
    height: '80px',
    backgroundColor: Colors.accent,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    boxShadow: `0 4px 16px ${Colors.shadow}`,
  },
  title: {
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
    fontSize: Theme.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
  },
  input: {
    width: '100%',
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    border: `1px solid ${Colors.border}`,
    backgroundColor: Colors.primary,
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.md,
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease',
  },
  button: {
    width: '100%',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    border: 'none',
    backgroundColor: Colors.accent,
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.md,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `0 2px 8px ${Colors.shadow}`,
  },
};
