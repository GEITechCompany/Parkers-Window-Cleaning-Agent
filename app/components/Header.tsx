'use client';

import Link from 'next/link';
import { useAuth } from '../auth/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Window Cleaning Scheduler
          </Link>
          
          {user && (
            <nav className="hidden md:flex gap-4">
              <Link href="/" className="text-gray-800 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/jobs" className="text-gray-800 hover:text-blue-600">
                Jobs
              </Link>
              <Link href="/teams" className="text-gray-800 hover:text-blue-600">
                Teams
              </Link>
            </nav>
          )}
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-800 hidden md:inline">
              {user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
} 