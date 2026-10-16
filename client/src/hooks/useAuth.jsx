import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if token was provided in URL query from OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('issuepilot_token', token);
      // Clean up URL query without reloading
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    refreshUser();
  }, []);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      if (err.status !== 401) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const res = await api.getAuthUrl();
      if (res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize GitHub sign-in.');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('issuepilot_token');
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
