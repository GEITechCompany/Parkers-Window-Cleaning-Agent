'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../auth/LoginForm';
import { useAuth } from '../auth/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-bold mb-6 text-blue-600">
          Window Cleaning Scheduler
        </h1>
        <LoginForm />
      </div>
    </div>
  );
} 