'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast'; 
import { Info } from 'lucide-react';
interface AuthProtectProps {
  children: React.ReactNode;
  requiredRole?: 'buyer' | 'seller' | 'admin';
}

export default function AuthProtect({ children, requiredRole = 'seller' }: AuthProtectProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { successmsg, errormsg, infomsg } = useToast(); 

  const getAuthData = () => {
    if (typeof window === 'undefined') return null;
    try {
      const authData = localStorage.getItem('authData');
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const authData = getAuthData();
      
      if (!authData?.token) {
        // No token found, redirect to login
        infomsg('Please login to access this page');
        router.push('/auth/login');
        return;
      }

      if (requiredRole && authData.role !== requiredRole) {
        // Wrong role, redirect to appropriate page
        infomsg(`This page is for ${requiredRole}s only`);
        router.push(authData.role === 'buyer' ? '/my-requests' : '/dashboard');
        return;
      }

      // Token exists, verify it's still valid
      verifyToken(authData.token);
    };

    const verifyToken = async (token: string) => {
      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear storage and redirect
          localStorage.removeItem('authData');
          infomsg('Session expired. Please login again.');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('authData');
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}