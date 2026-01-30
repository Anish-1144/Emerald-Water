'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useCartStore } from '@/lib/store';
import { orderAPI } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    company_name: user?.company_name || '',
    full_name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address1: '',
    address2: '',
    zip: '',
    country: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    if (items.length === 0) {
      router.push('/cart');
      return;
    }
  }, [user, token, items, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create orders for each cart item
      for (const item of items) {
        await orderAPI.createOrder({
          design_id: item.design_id,
          quantity: item.quantity,
          total_price: item.price,
          shipping_address: formData,
        });
      }

      clearCart();
      alert('Order placed successfully! You will receive a confirmation email.');
      router.push('/orders');
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);

  if (!user || items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#1E1E1E] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
          <button
            onClick={() => router.push('/cart')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
          >
            Back to Cart
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-lg shadow-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-white">Shipping Information</h2>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4DB64F]"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4DB64F]"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4DB64F]"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4DB64F]"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Shipping Address 1 *</label>
                <input
                  type="text"
                  required
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4DB64F]"
                  placeholder="Enter shipping address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Shipping Address 2 (Optional)</label>
                <input
                  type="text"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4DB64F]"
                  placeholder="Enter additional address (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">ZIP *</label>
                  <input
                    type="text"
                    required
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4DB64F]"
                    placeholder="Enter ZIP code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4DB64F]"
                    placeholder="Enter city"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Country *</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4DB64F]"
                  placeholder="Enter country"
                />
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mt-6">
                <p className="text-sm text-yellow-200">
                  <strong className="text-yellow-100">Note:</strong> Payment integration is not implemented yet. Orders will be marked as successful for testing purposes.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4DB64F] text-white py-3 rounded-lg hover:bg-[#45a049] disabled:opacity-50 disabled:cursor-not-allowed font-semibold mt-4 transition-colors"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 text-white">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.design_id} className="flex justify-between text-sm">
                    <span className="text-gray-300">Custom Bottle x{item.quantity}</span>
                    <span className="text-white font-medium">${item.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3 flex justify-between text-lg font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-white">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

