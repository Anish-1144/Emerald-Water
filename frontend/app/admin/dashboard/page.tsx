'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { AdminSidebarProvider } from '@/components/AdminSidebarContext';
import { adminAPI } from '@/lib/api';
import { Users, Package, TrendingUp, Clock, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('January');

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

  // Calculate stats
  const activeOrders = orders.filter(o => o.order_status !== 'cancelled' && o.order_status !== 'shipped').length;
  const totalOrders = stats?.totalOrders || orders.length;
  const totalSales = stats?.totalRevenue || orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalPending = orders.filter(o => o.order_status === 'pending_production').length;

  // Calculate trend percentages (mock data for now)
  const activeOrdersTrend = 8.5;
  const totalOrdersTrend = 1.3;
  const totalSalesTrend = -4.3;
  const totalPendingTrend = 1.8;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending_production':
        return 'bg-purple-100 text-purple-800';
      case 'printing':
        return 'bg-blue-100 text-blue-800';
      case 'packed':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Get recent orders (last 10)
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at || b.order_date || 0).getTime() - new Date(a.created_at || a.order_date || 0).getTime())
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ededed' }}>
        <div className="text-lg text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <AdminSidebarProvider>
      <div className="flex h-screen overflow-hidden " style={{ backgroundColor: '#ededed' }}>
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
      
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#ededed' }}>
        <div className="p-8" style={{ transform: 'scale(0.9)', transformOrigin: 'top left', width: '111.11%', height: '111.11%' }}>
            <div className="max-w-7xl mx-auto rounded-3xl">
              {/* Dashboard Title */}
              {/* <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1> */}
            
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Active Orders */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Active Orders</h3>
                  <p className="text-3xl font-bold text-gray-800 mb-2">{activeOrders}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-medium">{activeOrdersTrend}%</span>
                    <span className="text-gray-500">Up from yesterday</span>
                  </div>
                </div>

                {/* Total Order */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Order</h3>
                  <p className="text-3xl font-bold text-gray-800 mb-2">{totalOrders}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-medium">{totalOrdersTrend}%</span>
                    <span className="text-gray-500">Up from past week</span>
                  </div>
                </div>

                {/* Total Sales */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Sales</h3>
                  <p className="text-3xl font-bold text-gray-800 mb-2">${totalSales.toFixed(2)}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowDown className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 font-medium">{Math.abs(totalSalesTrend)}%</span>
                    <span className="text-gray-500">Down from yesterday</span>
                  </div>
                </div>

                {/* Total Pending */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Pending</h3>
                  <p className="text-3xl font-bold text-gray-800 mb-2">{totalPending}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-medium">{totalPendingTrend}%</span>
                    <span className="text-gray-500">Up from yesterday</span>
                  </div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option>January</option>
                      <option>February</option>
                      <option>March</option>
                      <option>April</option>
                      <option>May</option>
                      <option>June</option>
                      <option>July</option>
                      <option>August</option>
                      <option>September</option>
                      <option>October</option>
                      <option>November</option>
                      <option>December</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NAME</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PRODUCT</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">QUANTITY</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        recentOrders.map((order, index) => (
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Bottles</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDate(order.created_at || order.order_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || order.quantity || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.order_status)}`}>
                                {order.order_status?.replace('_', ' ') || 'Unknown'}
                              </span>
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

