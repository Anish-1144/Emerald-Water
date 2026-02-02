'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/store';
import { useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  const handleToggle = () => {
    toggleTheme();
    // Force a re-render by updating the DOM directly
    const html = document.documentElement;
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    html.classList.remove('light', 'dark');
    html.classList.add(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg border transition-colors"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
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
  );
}

