'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Menu, X } from 'lucide-react';
import { useAdminSidebar } from './AdminSidebarContext';
import Image from 'next/image';

export default function AdminHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Get sidebar context (with fallback for when not in provider)
  let sidebarContext;
  try {
    sidebarContext = useAdminSidebar();
  } catch (e) {
    // Not in provider context, sidebar will manage its own state
    sidebarContext = null;
  }

  // Navigation items for search functionality
  const navigationItems = [
    { label: 'Dashboard', path: '/admin/dashboard', keywords: ['dashboard', 'home', 'main', 'overview'] },
    { label: 'Order Lists', path: '/admin/orders', keywords: ['order', 'orders', 'list', 'lists', 'order list'] },
    { label: 'Payment', path: '/admin/payment', keywords: ['payment', 'payments', 'pay', 'transaction', 'transactions'] },
    { label: 'Analytics', path: '/admin/analytics', keywords: ['analytics', 'analysis', 'stats', 'statistics', 'report', 'reports'] },
    { label: 'Delivery Partner', path: '/admin/delivery-partner', keywords: ['delivery', 'partner', 'partners', 'shipping', 'courier', 'logistics'] },
  ];

  // Handle search
  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    const lowerQuery = query.toLowerCase().trim();
    
    // Find matching navigation item
    const matchedItem = navigationItems.find(item => {
      const labelMatch = item.label.toLowerCase().includes(lowerQuery);
      const keywordMatch = item.keywords.some(keyword => keyword.includes(lowerQuery) || lowerQuery.includes(keyword));
      return labelMatch || keywordMatch;
    });

    if (matchedItem) {
      router.push(matchedItem.path);
      setSearchQuery(''); // Clear search after navigation
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserDropdown(false);
    };
    if (showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserDropdown]);

  // Get admin user from localStorage
  const getAdminUser = () => {
    if (typeof window === 'undefined') {
      return { name: 'Admin User', email: 'admin@example.com' };
    }
    try {
      const userStr = localStorage.getItem('adminUser');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (e) {
      console.error('Error parsing admin user:', e);
    }
    return { name: 'Admin User', email: 'admin@example.com' };
  };

  const adminUser = getAdminUser();

  return (
    <header 
      className="h-16 flex items-center justify-between px-6 shadow-md"
      style={{ 
        backgroundColor: '#161616',
        backgroundImage: `
          linear-gradient(135deg, rgba(22, 101, 52, 0.4) 0%, rgba(22, 101, 52, 0.2) 25%, rgba(22, 101, 52, 0.1) 50%, #161616 75%, #000000 100%),
          radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(22, 101, 52, 0.2) 0%, transparent 50%)
        `,
        backgroundBlendMode: 'overlay',
        boxShadow: 'inset 0 0 100px rgba(22, 101, 52, 0.1)'
      }}
    >
      
      {/* Left side - Toggle button and Admin Dashboard title */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle Button */}
        {sidebarContext && (
          <button
            onClick={sidebarContext.toggleSidebar}
            className="p-2 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors lg:block"
            title={sidebarContext.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarContext.isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        )}
        <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
      </div>

      {/* Right side - Search, Notifications, Language, User */}
      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search (Dashboard, Orders, Payment, Analytics, Delivery)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-10 pr-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
          />
        </div>

        {/* Language selector - Canada flag with English */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-6 h-4 relative shrink-0">
            {/* Canada flag - Red and white with maple leaf */}
            <div className="w-full h-full bg-red-600 relative overflow-hidden rounded-sm border border-gray-600">
              {/* White vertical stripe */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white transform -translate-x-1/2"></div>
              {/* White horizontal stripe */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2"></div>
              {/* Red corners */}
              <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-red-600"></div>
              <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-red-600"></div>
              <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-red-600"></div>
              <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-red-600"></div>
            </div>
          </div>
          <span className="text-sm text-gray-300">English</span>
        </div>

        {/* User profile */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowUserDropdown(!showUserDropdown);
            }}
            className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-semibold">
              {adminUser.name?.charAt(0) || 'A'}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">{adminUser.name || 'Admin User'}</div>
              <div className="text-xs text-gray-400">Admin</div>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showUserDropdown && (
            <div 
              className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-gray-600">
                <div className="text-sm font-medium text-white">{adminUser.name || 'Admin User'}</div>
                <div className="text-xs text-gray-400">{adminUser.email || 'admin@example.com'}</div>
              </div>
              <button 
                onClick={() => setShowUserDropdown(false)}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white rounded-b-lg"
              >
                Profile Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

