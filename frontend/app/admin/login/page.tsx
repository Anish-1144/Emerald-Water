'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useThemeStore } from '@/lib/store';

export default function AdminLoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleThemeToggle = () => {
    toggleTheme();
    // Force a re-render by updating the DOM directly
    const html = document.documentElement;
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    html.classList.remove('light', 'dark');
    html.classList.add(newTheme);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminAPI.login(email, password);
      
      // Store admin token
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminUser', JSON.stringify(response.user));
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg relative" style={{ backgroundColor: 'var(--card-bg)' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={handleThemeToggle}
          className="absolute top-4 right-4 p-2 rounded-lg border transition-colors"
          style={{ 
            backgroundColor: 'var(--background)', 
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Admin Login
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Enter your credentials to access the admin dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: loading ? 'var(--text-muted)' : '#4DB64F',
              color: 'white',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

