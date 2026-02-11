'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingCart, Undo2, Redo2, LogOut } from 'lucide-react';
import { useAuthStore, useCartStore } from '@/lib/store';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const cartItemCount = items.length;
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering user-dependent UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="bg-theme border-theme border-b px-4 py-2 transition-all shadow-md" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border-color)', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)' }}>
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Image
            src="/logo.jpg"
            alt="Emerald Water Logo"
            width={150}
            height={70}
            className="rounded-lg"
          />
          {/* <h1 className="text-xl font-semibold text-theme transition-colors" style={{ color: 'var(--text-primary)' }}>Emerald Water</h1> */}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Undo/Redo */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg border transition-colors"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                e.currentTarget.style.opacity = '1';
              }}
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-lg border transition-colors"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                e.currentTarget.style.opacity = '1';
              }}
              title="Redo"
            >
              <Redo2 className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => router.push('/cart')}
            className="relative p-2 rounded-lg border transition-colors"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
              e.currentTarget.style.opacity = '1';
            }}
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#4DB64F] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Logout Button - Only show if logged in and mounted (prevents hydration mismatch) */}
          {mounted && user && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg border transition-colors"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                e.currentTarget.style.opacity = '1';
              }}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

