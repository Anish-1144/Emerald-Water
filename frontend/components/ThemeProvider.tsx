'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/lib/store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'dark';
    
    // Update store
    setTheme(initialTheme);
    
    // Ensure class is applied
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);
  }, [setTheme]);

  useEffect(() => {
    if (mounted) {
      // Apply theme class to html element whenever theme changes
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  return <>{children}</>;
}

