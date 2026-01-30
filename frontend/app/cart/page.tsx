'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useCartStore, useDesignStore } from '@/lib/store';
import { designAPI } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { items, updateQuantity, removeFromCart, addToCart } = useCartStore();
  const { currentDesign } = useDesignStore();
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    // Load saved designs
    loadDesigns();
  }, [user, token, router, currentDesign]);

  const loadDesigns = async () => {
    try {
      const savedDesigns = await designAPI.getDesigns();
      setDesigns(savedDesigns);
      
      // If there's a current design and it's not in cart, add it
      if (currentDesign && !items.find(i => i.design_id === currentDesign._id)) {
        addToCart({
          design_id: currentDesign._id!,
          design: currentDesign,
          quantity: 100,
          price: calculatePrice(100),
        });
      }
    } catch (error) {
      console.error('Error loading designs:', error);
    }
  };

  const calculatePrice = (quantity: number): number => {
    // Base price calculation: $2 per bottle for 100+, $1.5 for 500+, $1 for 1000+
    if (quantity >= 1000) return quantity * 1;
    if (quantity >= 500) return quantity * 1.5;
    return quantity * 2;
  };

  const handleQuantityChange = (designId: string, quantity: number) => {
    if (quantity < 100) {
      alert('Minimum quantity is 100');
      return;
    }
    const item = items.find(i => i.design_id === designId);
    if (item) {
      updateQuantity(designId, quantity);
      // Update price
      const updatedItems = items.map(i =>
        i.design_id === designId
          ? { ...i, quantity, price: calculatePrice(quantity) }
          : i
      );
      useCartStore.setState({ items: updatedItems });
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Cart is empty');
      return;
    }
    router.push('/checkout');
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#1E1E1E] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/design')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
            >
              Continue Designing
            </button>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-300 mb-4 text-lg">Your cart is empty</p>
            <button
              onClick={() => router.push('/design')}
              className="px-6 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium"
            >
              Start Designing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const design = designs.find(d => d._id === item.design_id) || item.design;
                return (
                  <div key={item.design_id} className="bg-white/5 border border-white/10 rounded-lg shadow-lg p-6">
                    <div className="flex gap-4">
                      <div className="w-32 h-32 bg-white/10 rounded-lg overflow-hidden shrink-0">
                        {design?.bottle_snapshot ? (
                          <img
                            src={design.bottle_snapshot}
                            alt="Bottle preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Preview
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-2 text-white">Custom Bottle Design</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Quantity (min 100)</label>
                            <input
                              type="number"
                              min="100"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(item.design_id, parseInt(e.target.value) || 100)
                              }
                              className="w-24 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                            />
                          </div>
                          <div className="text-lg font-semibold text-white">
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.design_id)}
                          className="mt-4 text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white/5 border border-white/10 rounded-lg shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4 text-white">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span className="text-white font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping</span>
                    <span className="text-gray-400 text-sm">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between text-lg font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-white">${total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#4DB64F] text-white py-3 rounded-lg hover:bg-[#45a049] font-semibold transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

