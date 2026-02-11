'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { AdminSidebarProvider } from '@/components/AdminSidebarContext';
import { adminAPI } from '@/lib/api';
import OrderDetails from '@/components/OrderDetails';

export default function AdminOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    // Force light theme for admin dashboard
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    // Check if admin is logged in
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        router.push('/admin/login');
        return;
      }
    }

    loadData();
  }, [router, orderId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const ordersData = await adminAPI.getAllOrders();
      setOrders(ordersData);
      
      // Load the specific order if orderId is provided
      if (orderId) {
        await loadOrderDetails(orderId);
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

  const loadOrderDetails = async (id: string) => {
    setOrderLoading(true);
    try {
      const orderData = await adminAPI.getOrderDetails(id);
      setSelectedOrder(orderData);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleOrderSelect = (id: string) => {
    router.push(`/admin/orders/${id}`);
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, status);
      // Reload the order details
      await loadOrderDetails(orderId);
      // Reload orders list
      const ordersData = await adminAPI.getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ededed' }}>
        <div className="text-lg text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <AdminSidebarProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#ededed' }}>
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
        
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#ededed' }}>
          {selectedOrder ? (
            <OrderDetails 
              order={selectedOrder} 
              onStatusUpdate={handleStatusUpdate}
              loading={orderLoading}
            />
          ) : (
            <div className="p-8 flex items-center justify-center min-h-screen">
              <div className="text-lg text-gray-700">Loading order details...</div>
            </div>
          )}
        </main>
      </div>
    </div>
    </AdminSidebarProvider>
  );
}










