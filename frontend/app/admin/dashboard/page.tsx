'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { adminAPI } from '@/lib/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        router.push('/admin/login');
        return;
      }
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        adminAPI.getAllOrders(),
        adminAPI.getDashboardStats()
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.message?.includes('token') || error.message?.includes('unauthorized')) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-lg" style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <AdminSidebar 
        orders={orders} 
        selectedOrderId={null}
        onOrderSelect={handleOrderSelect}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Dashboard Overview
            </h1>
            
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Total Orders
                  </h3>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalOrders}
                  </p>
                </div>
                <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Total Revenue
                  </h3>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${stats.totalRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Pending Orders
                  </h3>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stats.pendingOrders}
                  </p>
                </div>
                <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Active Orders
                  </h3>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {orders.filter(o => o.order_status !== 'cancelled' && o.order_status !== 'shipped').length}
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Welcome to Admin Dashboard
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Select an order from the sidebar to view its details and manage its status.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

