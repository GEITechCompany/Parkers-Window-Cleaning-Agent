'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      if (showSignUp) {
        // Sign up flow
        const { error } = await signUp(email, password);
        if (error) throw error;
        setError('Check your email for the confirmation link.');
      } else {
        // Sign in flow
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setShowSignUp(!showSignUp);
    setError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {showSignUp ? 'Create Account' : 'Sign In'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            minLength={6}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading
            ? 'Processing...'
            : showSignUp
            ? 'Create Account'
            : 'Sign In'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={toggleMode}
          className="text-blue-600 hover:underline text-sm"
        >
          {showSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
} 