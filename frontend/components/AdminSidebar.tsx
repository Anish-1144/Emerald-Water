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
import { adminAPI } from '@/lib/api';
import { useAdminSidebar } from './AdminSidebarContext';

interface AdminSidebarProps {
  orders?: any[];
  selectedOrderId?: string | null;
  onOrderSelect?: (orderId: string) => void;
}

export default function AdminSidebar({ orders: propOrders, selectedOrderId, onOrderSelect }: AdminSidebarProps = {}) {
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
  
  const [orders, setOrders] = useState<any[]>(propOrders || []);

  // Fetch orders if not provided as prop
  useEffect(() => {
    if (!propOrders || propOrders.length === 0) {
      const fetchOrders = async () => {
        try {
          const ordersData = await adminAPI.getAllOrders();
          setOrders(ordersData);
        } catch (error) {
          console.error('Error fetching orders for sidebar:', error);
        }
      };
      fetchOrders();
    } else {
      setOrders(propOrders);
    }
  }, [propOrders]);

  // Get today's date for filtering
  const getTodayOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders
      .filter(order => {
        const orderDate = new Date(order.created_at || order.order_date || 0);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.order_date || 0).getTime();
        const dateB = new Date(b.created_at || b.order_date || 0).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 2); // Get only 2 most recent
  };

  const todayOrders = getTodayOrders();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_production':
        return 'bg-purple-500';
      case 'printing':
        return 'bg-blue-500';
      case 'packed':
        return 'bg-yellow-500';
      case 'shipped':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

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
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors lg:hidden"
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
          backgroundColor: '#161616',
          background: `
            linear-gradient(135deg, rgba(22, 101, 52, 0.4) 0%, rgba(22, 101, 52, 0.2) 25%, rgba(22, 101, 52, 0.1) 50%, #161616 75%, #000000 100%),
            radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(22, 101, 52, 0.2) 0%, transparent 50%),
            #161616
          `,
          backgroundBlendMode: 'overlay, normal, normal, normal',
          boxShadow: 'inset 0 0 100px rgba(22, 101, 52, 0.1)'
        }}
      >
        {/* Logo Section - Centered */}
        <div className="flex items-center justify-center py-2 px-4 relative " style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
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
                    color: active ? '#ffffff' : '#cbd5e0',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#374151';
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
          <div className="border-t border-gray-600"></div>
        </div>

        {/* Recent Orders Section */}
        {!isCollapsed && (
          <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="mb-3">
              <h3 className="text-white font-semibold text-sm mb-1">Recent Orders</h3>
              <p className="text-gray-400 text-xs">Today</p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {todayOrders.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-2">No orders today</p>
              ) : (
                todayOrders.map((order) => (
                  <button
                    key={order._id}
                    onClick={() => {
                      router.push(`/admin/orders/${order._id}`);
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setIsCollapsed(true);
                      }
                    }}
                    className="w-full p-2 rounded-lg transition-colors text-left"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs font-medium">
                        {String(order.order_id || order._id).slice(-5).padStart(5, '0')}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(order.order_status)}`}></div>
                    </div>
                    <p className="text-gray-300 text-xs truncate">
                      {order.shipping_address?.full_name || 'N/A'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      ${order.total_price?.toFixed(2) || '0.00'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="px-4">
          <div className="border-t border-gray-600"></div>
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
              color: isActive('/admin/settings') ? '#ffffff' : '#cbd5e0',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/admin/settings')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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
            className={`w-full flex items-center justify-center ${isCollapsed ? 'px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors text-gray-300`}
            style={{
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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

