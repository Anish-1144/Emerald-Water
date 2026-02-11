'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { AdminSidebarProvider } from '@/components/AdminSidebarContext';
import { adminAPI } from '@/lib/api';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

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

  // Calculate analytics
  const totalRevenue = orders
    .filter(o => o.payment_status === 'success' || o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate orders by status
  const ordersByStatus = {
    pending: orders.filter(o => o.order_status === 'pending_production').length,
    printing: orders.filter(o => o.order_status === 'printing').length,
    packed: orders.filter(o => o.order_status === 'packed').length,
    shipped: orders.filter(o => o.order_status === 'shipped').length,
    cancelled: orders.filter(o => o.order_status === 'cancelled').length,
  };

  // Calculate monthly revenue (mock data for demonstration)
  const monthlyRevenue = [
    { month: 'Jan', revenue: 5000 },
    { month: 'Feb', revenue: 6200 },
    { month: 'Mar', revenue: 5800 },
    { month: 'Apr', revenue: 7100 },
    { month: 'May', revenue: 6500 },
    { month: 'Jun', revenue: 8000 },
  ];

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
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeRange('7d')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === '7d'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setTimeRange('30d')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === '30d'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => setTimeRange('90d')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === '90d'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    90 Days
                  </button>
                  <button
                    onClick={() => setTimeRange('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === 'all'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Time
                  </button>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
                  <p className="text-3xl font-bold text-gray-800">${totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-green-500 mt-2">+12.5% from last period</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Orders</h3>
                  <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
                  <p className="text-xs text-green-500 mt-2">+8.2% from last period</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Order Value</h3>
                  <p className="text-3xl font-bold text-gray-800">${averageOrderValue.toFixed(2)}</p>
                  <p className="text-xs text-green-500 mt-2">+5.1% from last period</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</h3>
                  <p className="text-3xl font-bold text-gray-800">24.5%</p>
                  <p className="text-xs text-red-500 mt-2">-2.3% from last period</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Trend</h2>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {monthlyRevenue.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-green-500 rounded-t-lg mb-2"
                          style={{ height: `${(item.revenue / 8000) * 200}px` }}
                        ></div>
                        <span className="text-xs text-gray-600">{item.month}</span>
                        <span className="text-xs font-semibold text-gray-800">${(item.revenue / 1000).toFixed(1)}k</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Orders by Status */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Orders by Status</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm text-gray-700">Pending</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{ordersByStatus.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm text-gray-700">Printing</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{ordersByStatus.printing}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="text-sm text-gray-700">Packed</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{ordersByStatus.packed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm text-gray-700">Shipped</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{ordersByStatus.shipped}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm text-gray-700">Cancelled</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{ordersByStatus.cancelled}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Top Performing Month</h3>
                    <p className="text-2xl font-bold text-gray-800">June 2024</p>
                    <p className="text-sm text-gray-500">$8,000 revenue</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Peak Order Day</h3>
                    <p className="text-2xl font-bold text-gray-800">Monday</p>
                    <p className="text-sm text-gray-500">Most orders placed</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Growth Rate</h3>
                    <p className="text-2xl font-bold text-green-600">+15.3%</p>
                    <p className="text-sm text-gray-500">Month over month</p>
                  </div>
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


