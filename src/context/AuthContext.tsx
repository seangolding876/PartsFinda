'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'admin';
}

interface AuthData {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  login: (authData: AuthData) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get auth data from localStorage
  const getAuthData = (): AuthData | null => {
    if (typeof window === 'undefined') return null;
    try {
      const authData = localStorage.getItem('authData');
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  };

  // Verify and set user from token
  const setUserFromToken = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      const userData: User = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      };
      setUser(userData);
    } catch (error) {
      console.error('Error decoding token:', error);
      setUser(null);
    }
  };

  // Check auth status on mount
  useEffect(() => {
    const authData = getAuthData();
    if (authData?.token) {
      setUserFromToken(authData.token);
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = (authData: AuthData) => {
    localStorage.setItem('authData', JSON.stringify(authData));
    setUserFromToken(authData.token);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('authChange'));
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authData');
    setUser(null);
    window.dispatchEvent(new CustomEvent('authChange'));
    window.location.href = '/';
  };

  // Listen for storage changes (across tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authData') {
        const authData = getAuthData();
        if (authData?.token) {
          setUserFromToken(authData.token);
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}