'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-6 dark:bg-black sm:px-6 sm:py-8 lg:px-8 lg:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-black dark:text-zinc-50 sm:mt-6 sm:text-3xl">
            Create your account
          </h2>
          <p className="mt-2 text-center text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
            Or{' '}
            <a
              href="/login"
              className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
            >
              sign in to your existing account
            </a>
          </p>
        </div>
        
        <form className="mt-6 space-y-5 sm:mt-8 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}
          
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="relative block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-black placeholder-zinc-500 focus:z-10 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-400 dark:focus:border-zinc-50 dark:focus:ring-zinc-50 sm:py-3 sm:text-base"
                placeholder="Full Name (Optional)"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-black placeholder-zinc-500 focus:z-10 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-400 dark:focus:border-zinc-50 dark:focus:ring-zinc-50 sm:py-3 sm:text-base"
                placeholder="Email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-black placeholder-zinc-500 focus:z-10 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-400 dark:focus:border-zinc-50 dark:focus:ring-zinc-50 sm:py-3 sm:text-base"
                placeholder="Password (min. 6 characters)"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="relative block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-black placeholder-zinc-500 focus:z-10 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-400 dark:focus:border-zinc-50 dark:focus:ring-zinc-50 sm:py-3 sm:text-base"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-zinc-50 sm:py-3"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

