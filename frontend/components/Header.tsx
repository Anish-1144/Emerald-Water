'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Undo2, Redo2, LogOut, Edit } from 'lucide-react';
import { useAuthStore, useCartStore } from '@/lib/store';
import Image from 'next/image';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const cartItemCount = items.length;
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleEditProfile = () => {
    setShowProfileDropdown(false);
    router.push('/profile/edit');
  };

  return (
    <header className="bg-[#1E1E1E] border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Image
            src="/logo.jpg"
            alt="Emerald Water Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <h1 className="text-xl font-semibold text-white">Emerald Water</h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Undo/Redo */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              title="Redo"
            >
              <Redo2 className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => router.push('/cart')}
            className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#4DB64F] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Profile Button with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </button>
            
            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#2A2A2A] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={handleEditProfile}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-white hover:bg-white/10 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-white hover:bg-white/10 transition-colors border-t border-white/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

