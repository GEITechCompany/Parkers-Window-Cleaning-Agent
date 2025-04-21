'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Only render children if authenticated
  return user ? <>{children}</> : null;
} 