'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { adminAPI } from '@/lib/api';
import OrderDetails from '@/components/OrderDetails';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);

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
      
      // Select first order by default if available
      if (ordersData.length > 0 && !selectedOrderId) {
        handleOrderSelect(ordersData[0]._id);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.message?.includes('token') || error.message?.includes('unauthorized')) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setOrderLoading(true);
    try {
      const orderData = await adminAPI.getOrderDetails(orderId);
      setSelectedOrder(orderData);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, status);
      // Reload orders and selected order
      await loadData();
      if (selectedOrderId === orderId) {
        const updatedOrder = await adminAPI.getOrderDetails(orderId);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
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
        selectedOrderId={selectedOrderId}
        onOrderSelect={handleOrderSelect}
      />
      
      <main className="flex-1 overflow-y-auto">
        {selectedOrder ? (
          <OrderDetails 
            order={selectedOrder} 
            onStatusUpdate={handleStatusUpdate}
            loading={orderLoading}
          />
        ) : (
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
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
        )}
      </main>
    </div>
  );
}

