'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { orderAPI } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCartStore();
  const [formData, setFormData] = useState({
    company_name: '',
    full_name: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    zip: '',
    country: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
      return;
    }
  }, [items, router]);

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

      // Clear cart after successful order
      useCartStore.getState().clearCart();
      
      alert('Order placed successfully! You can view your orders using your email and phone number.');
      router.push('/orders');
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);

  if (items.length === 0) return null;

  return (
    <div 
      className="min-h-screen p-4 transition-colors"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 
            className="text-3xl font-bold transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            Checkout
          </h1>
          <button
            onClick={() => router.push('/cart')}
            className="px-4 py-2 border rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
          >
            Back to Cart
          </button>
        </div>

        {error && (
          <div 
            className="border rounded-lg px-4 py-3 mb-4 transition-colors"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.2)', 
              borderColor: 'rgba(239, 68, 68, 0.5)',
              color: '#fca5a5'
            }}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form 
              onSubmit={handleSubmit} 
              className="border rounded-lg shadow-lg p-6 space-y-4 transition-colors"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)' 
              }}
            >
              <h2 
                className="text-xl font-semibold mb-4 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Shipping Information
              </h2>

              <div>
                <label 
                  className="block text-sm font-medium mb-1 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-1 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-1 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-1 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-1 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Shipping Address 1 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter shipping address"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-1 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Shipping Address 2 (Optional)
                </label>
                <input
                  type="text"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter additional address (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-sm font-medium mb-1 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    ZIP *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Enter ZIP code"
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-1 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Enter city"
                  />
                </div>
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-1 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter country"
                />
              </div>

              <div 
                className="border rounded-lg p-4 mt-6 transition-colors"
                style={{ 
                  backgroundColor: 'rgba(234, 179, 8, 0.2)', 
                  borderColor: 'rgba(234, 179, 8, 0.5)',
                  color: '#fde047'
                }}
              >
                <p className="text-sm">
                  <strong style={{ color: '#fef08a' }}>Note:</strong> Payment integration is not implemented yet. Orders will be marked as successful for testing purposes.
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
            <div 
              className="border rounded-lg shadow-lg p-6 sticky top-4 transition-colors"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)' 
              }}
            >
              <h2 
                className="text-xl font-semibold mb-4 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Order Summary
              </h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div 
                    key={item.design_id} 
                    className="flex justify-between text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span>Custom Bottle x{item.quantity}</span>
                    <span 
                      className="font-medium transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div 
                  className="border-t pt-3 flex justify-between text-lg font-semibold transition-colors"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

