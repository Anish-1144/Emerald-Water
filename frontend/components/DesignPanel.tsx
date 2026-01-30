'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import { useAuthStore, useCartStore } from '@/lib/store';
import { authAPI, orderAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import LabelDesignPanel from '@/components/LabelDesignPanel';

interface DesignPanelProps {
  activeTab: string | null;
  onClose: () => void;
  labelData: any;
  setLabelData: (data: any) => void;
  capColor: string;
  setCapColor: (color: string) => void;
  setLabelTexture: (texture: string | null) => void;
  showColorPicker: string | null;
  setShowColorPicker: (picker: string | null) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSaveDesign: () => void;
  saving: boolean;
  currentDesign: any;
  onAddToCart: () => void;
  cartItems?: any[];
}

export default function DesignPanel({
  activeTab,
  onClose,
  labelData,
  setLabelData,
  capColor,
  setCapColor,
  setLabelTexture,
  showColorPicker,
  setShowColorPicker,
  onImageUpload,
  fileInputRef,
  onSaveDesign,
  saving,
  currentDesign,
  onAddToCart,
  cartItems = [],
}: DesignPanelProps) {
  if (!activeTab) return null;

  // Full width for Cart, Ticket, and Edit Profile
  const isFullWidth = activeTab === 'cart' || activeTab === 'ticket' || activeTab === 'edit-profile';
  const panelWidth = isFullWidth ? 'w-full' : 'w-[35%]';
  
  // Profile edit form state
  const { user, token, setAuth } = useAuthStore();
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Checkout flow state
  const [checkoutStep, setCheckoutStep] = useState<'products' | 'shipping' | 'review'>('products');
  const [shippingData, setShippingData] = useState({
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
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Calculate price function
  const calculatePrice = (quantity: number): number => {
    if (quantity >= 1000) return quantity * 1;
    if (quantity >= 500) return quantity * 1.5;
    return quantity * 2;
  };

  // Handle quantity change
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

  // Initialize shipping data when cart tab opens
  useEffect(() => {
    if (activeTab === 'cart' && user) {
      setShippingData({
        company_name: user.company_name || '',
        full_name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address1: '',
        address2: '',
        zip: '',
        country: '',
        city: '',
      });
      setCheckoutStep('products');
      setOrderError('');
    }
  }, [activeTab, user]);

  // Load user data when edit-profile tab is active
  useEffect(() => {
    if (activeTab === 'edit-profile' && user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company_name: user.company_name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setProfileError('');
      setProfileSuccess('');
    }
  }, [activeTab, user]);

  return (
    <div className={`${panelWidth} bg-[#1E1E1E] border-r border-white/10 flex flex-col h-full`}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {activeTab === 'label-design' && 'Label Design'}
          {activeTab === 'upload' && 'Upload'}
          {activeTab === 'gallery' && 'Gallery'}
          {activeTab === 'ticket' && 'Ticket'}
          {activeTab === 'cart' && 'Shopping Cart'}
          {activeTab === 'edit-profile' && 'Edit Profile'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Label Design Panel */}
        {activeTab === 'label-design' && (
          <LabelDesignPanel
            capColor={capColor}
            setCapColor={setCapColor}
            setLabelTexture={setLabelTexture}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
          />
        )}

        {/* Upload Panel */}
        {activeTab === 'upload' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Upload Custom Image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium"
              >
                Upload Image
              </button>
            </div>

            {labelData.image && (
              <div className="mt-4">
                <img src={labelData.image} alt="Uploaded" className="w-full rounded-lg" />
                <button
                  onClick={() => {
                    setLabelData({ ...labelData, image: null });
                    setLabelTexture(null);
                  }}
                  className="mt-2 text-red-400 text-sm hover:text-red-300"
                >
                  Remove Image
                </button>
              </div>
            )}
          </>
        )}

        {/* Gallery Panel */}
        {activeTab === 'gallery' && (
          <div>
            <p className="text-gray-300 mb-4">Browse your saved designs and templates</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Placeholder gallery items */}
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="aspect-square bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Template {item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ticket Panel */}
        {activeTab === 'ticket' && (
          <div>
            <p className="text-gray-300 mb-4">Ticket management and support options</p>
            <button className="w-full px-4 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium">
              Create Support Ticket
            </button>
          </div>
        )}

        {/* Cart Panel - Multi-step Checkout */}
        {activeTab === 'cart' && (
          <div className="flex flex-col h-full">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6 px-4 pt-4">
              <div className={`flex items-center gap-2 ${checkoutStep === 'products' ? 'text-[#4DB64F]' : checkoutStep === 'shipping' || checkoutStep === 'review' ? 'text-[#4DB64F]' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checkoutStep === 'products' ? 'bg-[#4DB64F] text-white' : 'bg-white/10 text-gray-400'}`}>
                  1
                </div>
                <span className="text-sm font-medium">Products</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <div className={`flex items-center gap-2 ${checkoutStep === 'shipping' ? 'text-[#4DB64F]' : checkoutStep === 'review' ? 'text-[#4DB64F]' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checkoutStep === 'shipping' ? 'bg-[#4DB64F] text-white' : checkoutStep === 'review' ? 'bg-[#4DB64F] text-white' : 'bg-white/10 text-gray-400'}`}>
                  2
                </div>
                <span className="text-sm font-medium">Shipping</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <div className={`flex items-center gap-2 ${checkoutStep === 'review' ? 'text-[#4DB64F]' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checkoutStep === 'review' ? 'bg-[#4DB64F] text-white' : 'bg-white/10 text-gray-400'}`}>
                  3
                </div>
                <span className="text-sm font-medium">Review & Pay</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {items.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                  <p className="text-gray-400 mb-4">Your cart is empty</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium"
                  >
                    Continue Designing
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 1: Products */}
                  {checkoutStep === 'products' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Products</h3>
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.design_id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <div className="flex items-center gap-4">
                              {item.design?.bottle_snapshot && (
                                <img
                                  src={item.design.bottle_snapshot}
                                  alt="Design preview"
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="text-white font-medium mb-2">Custom Bottle Design</h4>
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-300">Quantity (min 100)</label>
                                    <input
                                      type="number"
                                      min="100"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleQuantityChange(item.design_id, parseInt(e.target.value) || 100)
                                      }
                                      className="w-24 px-3 py-1 bg-white/5 border border-white/20 rounded text-white focus:outline-none focus:border-[#4DB64F]"
                                    />
                                  </div>
                                  <p className="text-[#4DB64F] font-semibold">${item.price.toFixed(2)}</p>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.design_id)}
                                  className="mt-2 text-red-400 text-sm hover:text-red-300"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Order Summary</h4>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-gray-300">
                            <span>Subtotal</span>
                            <span>${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span>Shipping</span>
                            <span className="text-gray-400">Calculated at checkout</span>
                          </div>
                          <div className="border-t border-white/10 pt-2 flex justify-between text-lg font-semibold text-white">
                            <span>Total</span>
                            <span>${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setCheckoutStep('shipping')}
                          className="w-full px-4 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium"
                        >
                          Continue to Shipping
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Shipping */}
                  {checkoutStep === 'shipping' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Shipping</h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setCheckoutStep('review');
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Company Name</label>
                          <input
                            type="text"
                            value={shippingData.company_name}
                            onChange={(e) => setShippingData({ ...shippingData, company_name: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={shippingData.full_name}
                            onChange={(e) => setShippingData({ ...shippingData, full_name: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Email *</label>
                          <input
                            type="email"
                            required
                            value={shippingData.email}
                            onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={shippingData.phone}
                            onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Shipping Address 1 *</label>
                          <input
                            type="text"
                            required
                            value={shippingData.address1}
                            onChange={(e) => setShippingData({ ...shippingData, address1: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Shipping Address 2 (Optional)</label>
                          <input
                            type="text"
                            value={shippingData.address2}
                            onChange={(e) => setShippingData({ ...shippingData, address2: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">ZIP *</label>
                            <input
                              type="text"
                              required
                              value={shippingData.zip}
                              onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })}
                              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">City *</label>
                            <input
                              type="text"
                              required
                              value={shippingData.city}
                              onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Country *</label>
                          <input
                            type="text"
                            required
                            value={shippingData.country}
                            onChange={(e) => setShippingData({ ...shippingData, country: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                          />
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button
                            type="button"
                            onClick={() => setCheckoutStep('products')}
                            className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium flex items-center justify-center gap-2"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                          </button>
                          <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium"
                          >
                            Continue to Review
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Step 3: Review & Pay */}
                  {checkoutStep === 'review' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Review & Pay</h3>
                      
                      {orderError && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                          {orderError}
                        </div>
                      )}

                      {/* Products Review */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-4">Products</h4>
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div key={item.design_id} className="flex items-center gap-4 pb-3 border-b border-white/10 last:border-0">
                              {item.design?.bottle_snapshot && (
                                <img
                                  src={item.design.bottle_snapshot}
                                  alt="Design preview"
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1">
                                <p className="text-white font-medium">Custom Bottle Design</p>
                                <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                              </div>
                              <p className="text-[#4DB64F] font-semibold">${item.price.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Review */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-4">Shipping Address</h4>
                        <div className="space-y-1 text-gray-300 text-sm">
                          <p>{shippingData.full_name}</p>
                          {shippingData.company_name && <p>{shippingData.company_name}</p>}
                          <p>{shippingData.address1}</p>
                          {shippingData.address2 && <p>{shippingData.address2}</p>}
                          <p>{shippingData.city}, {shippingData.zip}</p>
                          <p>{shippingData.country}</p>
                          <p className="pt-2">{shippingData.phone}</p>
                          <p>{shippingData.email}</p>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-4">Order Summary</h4>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-gray-300">
                            <span>Subtotal</span>
                            <span>${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span>Shipping</span>
                            <span className="text-gray-400">Calculated at checkout</span>
                          </div>
                          <div className="border-t border-white/10 pt-2 flex justify-between text-lg font-semibold text-white">
                            <span>Total</span>
                            <span>${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                        <p className="text-sm text-yellow-400">
                          <strong>Note:</strong> Payment integration is not implemented yet. Orders will be marked as successful for testing purposes.
                        </p>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setCheckoutStep('shipping')}
                          className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Back
                        </button>
                        <button
                          onClick={async () => {
                            setOrderError('');
                            setOrderLoading(true);
                            try {
                              // Create orders for each cart item
                              for (const item of items) {
                                await orderAPI.createOrder({
                                  design_id: item.design_id,
                                  quantity: item.quantity,
                                  total_price: item.price,
                                  shipping_address: shippingData,
                                });
                              }
                              clearCart();
                              alert('Order placed successfully! You will receive a confirmation email.');
                              onClose();
                              router.push('/orders');
                            } catch (err: any) {
                              setOrderError(err.message || 'Failed to place order');
                            } finally {
                              setOrderLoading(false);
                            }
                          }}
                          disabled={orderLoading}
                          className="flex-1 px-4 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {orderLoading ? 'Processing...' : 'Place Order'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Edit Profile Panel */}
        {activeTab === 'edit-profile' && (
          <div className="flex justify-center">
            <div className="w-full max-w-4xl space-y-6">
              {profileError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 text-sm">
                  {profileSuccess}
                </div>
              )}
              
              <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProfileError('');
                setProfileSuccess('');
                setProfileSaving(true);

                try {
                  // Validate password if new password is provided
                  if (profileData.newPassword) {
                    if (!profileData.currentPassword) {
                      setProfileError('Current password is required to change password');
                      setProfileSaving(false);
                      return;
                    }
                    if (profileData.newPassword !== profileData.confirmPassword) {
                      setProfileError('New passwords do not match');
                      setProfileSaving(false);
                      return;
                    }
                    if (profileData.newPassword.length < 6) {
                      setProfileError('New password must be at least 6 characters');
                      setProfileSaving(false);
                      return;
                    }
                  }

                  const updateData: any = {
                    name: profileData.name,
                    email: profileData.email,
                    phone: profileData.phone || '',
                    company_name: profileData.company_name || '',
                  };

                  if (profileData.newPassword) {
                    updateData.currentPassword = profileData.currentPassword;
                    updateData.newPassword = profileData.newPassword;
                  }

                  const response = await authAPI.updateProfile(updateData);
                  
                  // Update auth store with new user data
                  if (response.user && token) {
                    setAuth(response.user, token);
                  }
                  
                  setProfileSuccess('Profile updated successfully!');
                  
                  // Clear password fields
                  setProfileData({
                    ...profileData,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                } catch (error: any) {
                  setProfileError(error.message || 'Failed to update profile');
                } finally {
                  setProfileSaving(false);
                }
              }}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Phone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Company Name</label>
                <input
                  type="text"
                  value={profileData.company_name}
                  onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                />
              </div>

              {/* Password Change Section */}
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-md font-medium mb-4 text-gray-300">Change Password (Optional)</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Current Password</label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                      placeholder="Enter current password to change"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">New Password</label>
                    <input
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Confirm New Password</label>
                    <input
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full px-4 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

