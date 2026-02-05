'use client';

import { useRouter, usePathname } from 'next/navigation';
import { 
  Package, 
  LayoutDashboard,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { useThemeStore } from '@/lib/store';

interface AdminSidebarProps {
  orders: any[];
  selectedOrderId: string | null;
  onOrderSelect: (orderId: string) => void;
}

export default function AdminSidebar({ orders, selectedOrderId, onOrderSelect }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
    router.push('/admin/login');
  };

  const handleThemeToggle = () => {
    toggleTheme();
    // Force a re-render by updating the DOM directly
    const html = document.documentElement;
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    html.classList.remove('light', 'dark');
    html.classList.add(newTheme);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_production':
        return 'bg-yellow-500';
      case 'printing':
        return 'bg-blue-500';
      case 'packed':
        return 'bg-purple-500';
      case 'shipped':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <aside 
      className="w-80 border-r flex flex-col h-screen"
      style={{ 
        backgroundColor: 'var(--background)', 
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6" style={{ color: '#4DB64F' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Admin Dashboard
            </h2>
          </div>
          <button
            onClick={handleThemeToggle}
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
        </div>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="w-full px-4 py-2 rounded-lg text-left transition-colors"
          style={{
            backgroundColor: pathname === '/admin/dashboard' ? 'var(--card-bg)' : 'transparent',
            color: 'var(--text-primary)',
          }}
        >
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard Overview</span>
          </div>
        </button>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3 uppercase" style={{ color: 'var(--text-muted)' }}>
            Orders ({orders.length})
          </h3>
          <div className="space-y-2">
            {orders.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                No orders found
              </p>
            ) : (
              orders.map((order) => (
                <button
                  key={order._id}
                  onClick={() => onOrderSelect(order._id)}
                  className="w-full p-3 rounded-lg text-left transition-all hover:shadow-md"
                  style={{
                    backgroundColor: selectedOrderId === order._id ? 'var(--card-bg)' : 'transparent',
                    border: selectedOrderId === order._id ? '2px solid #4DB64F' : '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {order.order_id}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {order.shipping_address?.company_name || 'N/A'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(order.order_status)}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      ${order.total_price?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-xs capitalize px-2 py-1 rounded" style={{ 
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-muted)'
                    }}>
                      {order.order_status?.replace('_', ' ')}
                    </span>
                  </div>
                  {order.shipping_address?.email && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                      {order.shipping_address.email}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-red-100"
          style={{ color: '#ef4444' }}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

