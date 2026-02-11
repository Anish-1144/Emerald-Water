'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { AdminSidebarProvider } from '@/components/AdminSidebarContext';
import { Truck, Mail, Phone, MapPin, Package, Search } from 'lucide-react';

export default function AdminDeliveryPartnerPage() {
  const router = useRouter();
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      // TODO: Replace with actual delivery partner API call
      // const partnersData = await adminAPI.getAllDeliveryPartners();
      // For now, using mock data
      const mockPartners = [
        {
          _id: '1',
          name: 'Fast Delivery Co.',
          email: 'contact@fastdelivery.com',
          phone: '+1-555-0101',
          address: '123 Delivery St, City, State 12345',
          status: 'active',
          totalDeliveries: 150,
          rating: 4.8
        },
        {
          _id: '2',
          name: 'Express Logistics',
          email: 'info@expresslog.com',
          phone: '+1-555-0102',
          address: '456 Logistics Ave, City, State 12346',
          status: 'active',
          totalDeliveries: 89,
          rating: 4.6
        }
      ];
      setDeliveryPartners(mockPartners);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.message?.includes('token') || error.message?.includes('unauthorized')) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = deliveryPartners.filter(partner => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      partner.name?.toLowerCase().includes(query) ||
      partner.email?.toLowerCase().includes(query) ||
      partner.phone?.toLowerCase().includes(query) ||
      partner.address?.toLowerCase().includes(query)
    );
  });

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
                  <h1 className="text-3xl font-bold text-gray-800">Delivery Partner</h1>
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Total Partners: {deliveryPartners.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search delivery partners by name, email, phone, or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Delivery Partners Table */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">All Delivery Partners</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Deliveries</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPartners.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                              {searchQuery ? 'No delivery partners found matching your search' : 'No delivery partners found'}
                            </td>
                          </tr>
                        ) : (
                          filteredPartners.map((partner, index) => (
                            <tr 
                              key={partner._id} 
                              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold mr-3">
                                    <Truck className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{partner.name || 'N/A'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-700">
                                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                  {partner.email || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-700">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  {partner.phone || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center text-sm text-gray-700">
                                  <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                                  <span className="truncate max-w-xs">{partner.address || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-700">
                                  <Package className="w-4 h-4 mr-2 text-gray-400" />
                                  {partner.totalDeliveries || 0}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">
                                  <span className="font-semibold">{partner.rating || 'N/A'}</span>
                                  {partner.rating && <span className="text-yellow-500 ml-1">★</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  partner.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {partner.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => router.push(`/admin/delivery-partner/${partner._id}`)}
                                  className="text-green-600 hover:text-green-800 font-medium"
                                >
                                  View Details
                                </button>
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

