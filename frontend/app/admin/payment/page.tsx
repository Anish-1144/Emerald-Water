'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { AdminSidebarProvider } from '@/components/AdminSidebarContext';
import { adminAPI } from '@/lib/api';
import { CreditCard, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

export default function AdminPaymentPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

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
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const ordersData = await adminAPI.getAllOrders();
      setOrders(ordersData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.message?.includes('token') || error.message?.includes('unauthorized')) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    const paymentStatus = order.payment_status?.toLowerCase() || 'pending';
    if (filter === 'success') return paymentStatus === 'success' || paymentStatus === 'paid';
    if (filter === 'pending') return paymentStatus === 'pending';
    if (filter === 'failed') return paymentStatus === 'failed' || paymentStatus === 'cancelled';
    return true;
  });

  const totalRevenue = orders
    .filter(o => o.payment_status === 'success' || o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const pendingPayments = orders.filter(o => 
    o.payment_status === 'pending' || !o.payment_status
  ).length;

  const successfulPayments = orders.filter(o => 
    o.payment_status === 'success' || o.payment_status === 'paid'
  ).length;

  const getPaymentStatusIcon = (status: string) => {
    const paymentStatus = status?.toLowerCase() || 'pending';
    if (paymentStatus === 'success' || paymentStatus === 'paid') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getPaymentStatusBadge = (status: string) => {
    const paymentStatus = status?.toLowerCase() || 'pending';
    if (paymentStatus === 'success' || paymentStatus === 'paid') {
      return 'bg-green-100 text-green-800';
    }
    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold mb-8 text-gray-800">Payment Management</h1>
              
              {/* Warning Banner */}
              <div 
                className="rounded-lg p-4 mb-6 border"
                style={{
                  backgroundColor: '#fef9c3',
                  borderColor: '#fde047',
                  color: '#ca8a04'
                }}
              >
                <p className="text-sm">
                  <strong>Note:</strong> Payment integration is not implemented yet. Orders will be marked as successful for testing purposes.
                </p>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
                  <p className="text-3xl font-bold text-gray-800">${totalRevenue.toFixed(2)}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Successful Payments</h3>
                  <p className="text-3xl font-bold text-gray-800">{successfulPayments}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Payments</h3>
                  <p className="text-3xl font-bold text-gray-800">{pendingPayments}</p>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Payments
                  </button>
                  <button
                    onClick={() => setFilter('success')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Successful
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'pending'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('failed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'failed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Failed
                  </button>
                </div>
              </div>

              {/* Payments Table */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">Payment History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No payments found
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order, index) => (
                          <tr 
                            key={order._id} 
                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            onClick={() => router.push(`/admin/orders/${order._id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {String(order.order_id || order._id).slice(-5).padStart(5, '0')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {order.shipping_address?.full_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              ${order.total_price?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDate(order.created_at || order.order_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getPaymentStatusIcon(order.payment_status)}
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadge(order.payment_status)}`}>
                                  {order.payment_status?.toUpperCase() || 'PENDING'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </AdminSidebarProvider>
  );
}


