'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard,
  ListOrdered,
  CreditCard,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAdminSidebar } from './AdminSidebarContext';

interface AdminSidebarProps {
  orders?: any[];
  selectedOrderId?: string | null;
  onOrderSelect?: (orderId: string) => void;
}

export default function AdminSidebar({}: AdminSidebarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Try to use context, fallback to local state if not in provider
  let sidebarContext;
  try {
    sidebarContext = useAdminSidebar();
  } catch (e) {
    sidebarContext = null;
  }
  
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const isCollapsed = sidebarContext ? sidebarContext.isCollapsed : localCollapsed;
  const setIsCollapsed = sidebarContext ? sidebarContext.setIsCollapsed : setLocalCollapsed;

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
    router.push('/admin/login');
  };

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ListOrdered, label: 'Order Lists', path: '/admin/orders' },
    { icon: CreditCard, label: 'Payment', path: '/admin/payment' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Truck, label: 'Delivery Partner', path: '/admin/delivery-partner' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  return (
    <>
      {/* Toggle Button - Only show on mobile (desktop toggle moved to header) */}
      {!sidebarContext && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 transition-colors lg:hidden shadow-md"
          style={{ zIndex: 1000 }}
        >
          {isCollapsed ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static h-screen flex flex-col transition-all duration-300 z-40 ${
          isCollapsed 
            ? '-translate-x-full lg:translate-x-0 lg:w-20' 
            : 'translate-x-0 w-64'
        }`}
        style={{ 
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb'
        }}
      >
        {/* Logo Section - Centered */}
        <div className="flex items-center justify-center py-2 px-4 relative border-b" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex flex-col items-center justify-center">
            <Image
              src={isCollapsed ? "/logo1.jpg" : "/logo.jpg"}
              alt="Logo"
              width={isCollapsed ? 40 : 140}
              height={isCollapsed ? 40 : 140}
              className="object-contain"
            />
          </div>
          {/* Toggle button for desktop */}
        
        </div>

        {/* Navigation Items - Centered */}
        <nav className="flex-1 flex flex-col justify-start py-6 px-4 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setIsCollapsed(true);
                    }
                  }}
                  className={`w-full flex items-center justify-center ${isCollapsed ? 'px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors`}
                  style={{
                    backgroundColor: active ? '#22c55e' : 'transparent',
                    color: active ? '#ffffff' : '#1f2937',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium text-center">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Divider */}
        <div className="px-4">
          <div className="border-t" style={{ borderColor: '#e5e7eb' }}></div>
        </div>

        {/* Footer Items - Centered */}
        <div className="py-6 px-4 flex flex-col items-center">
          <button
            onClick={() => {
              router.push('/admin/settings');
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setIsCollapsed(true);
              }
            }}
            className={`w-full flex items-center justify-center ${isCollapsed ? 'px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-lg transition-colors`}
            style={{
              backgroundColor: isActive('/admin/settings') ? '#22c55e' : 'transparent',
              color: isActive('/admin/settings') ? '#ffffff' : '#1f2937',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/admin/settings')) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/admin/settings')) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            title={isCollapsed ? 'Settings' : ''}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="font-medium">Settings</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center ${isCollapsed ? 'px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors`}
            style={{
              backgroundColor: 'transparent',
              color: '#1f2937',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && typeof window !== 'undefined' && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}

