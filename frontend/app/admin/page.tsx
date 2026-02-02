'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { adminAPI } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'users'>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admin page still requires authentication and admin role
    if (!user || !token) {
      router.push('/');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/design');
      return;
    }

    loadData();
  }, [user, token, router, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const dashboardData = await adminAPI.getDashboardStats();
        setStats(dashboardData);
      } else if (activeTab === 'orders') {
        const ordersData = await adminAPI.getAllOrders();
        setOrders(ordersData);
      } else if (activeTab === 'users') {
        const usersData = await adminAPI.getAllUsers();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, status);
      loadData();
    } catch (error) {
      alert('Error updating order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_production':
        return 'bg-yellow-100 text-yellow-800';
      case 'printing':
        return 'bg-blue-100 text-blue-800';
      case 'packed':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/orders')}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              My Orders
            </button>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'orders'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Users
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Orders</h3>
                  <p className="text-3xl font-bold">{stats.totalOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
                  <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Orders</h3>
                  <p className="text-3xl font-bold">{stats.pendingOrders}</p>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Order #{order.order_id}</h3>
                        <p className="text-sm text-gray-600">
                          Customer: {order.user_id?.name || 'N/A'} ({order.user_id?.email || 'N/A'})
                        </p>
                        <p className="text-sm text-gray-600">
                          Company: {order.shipping_address?.company_name || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            order.order_status
                          )}`}
                        >
                          {order.order_status.replace('_', ' ').toUpperCase()}
                        </span>
                        <p className="text-lg font-semibold mt-2">${order.total_price.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-semibold">{order.quantity} bottles</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Status</p>
                        <p className="font-semibold capitalize">{order.payment_status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Shipping</p>
                        <p className="font-semibold">
                          {order.shipping_address?.city}, {order.shipping_address?.country}
                        </p>
                      </div>
                    </div>

                    {order.bottle_snapshot && (
                      <div className="mb-4">
                        <img
                          src={order.bottle_snapshot}
                          alt="Bottle preview"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <select
                        value={order.order_status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="pending_production">Pending Production</option>
                        <option value="printing">Printing</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {order.print_pdf && (
                        <a
                          href={order.print_pdf}
                          download
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Download Print File
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{u.phone || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{u.company_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

