'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import { useAuthStore, useCartStore } from '@/lib/store';
import { orderAPI } from '@/lib/api';
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
  onDesignModeChange?: (mode: 'uploaded' | 'designed' | null) => void;
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
  onDesignModeChange,
}: DesignPanelProps) {
  if (!activeTab) return null;

  // Full width for Cart
  const isFullWidth = activeTab === 'cart';
  const panelWidth = isFullWidth ? 'w-full' : 'w-[45%]';
  
  const { user } = useAuthStore();
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart } = useCartStore();

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


  return (
    <div 
      className={`${panelWidth} border-r flex flex-col h-full transition-all shadow-lg`}
      style={{ 
        backgroundColor: 'var(--background)', 
        borderColor: 'var(--border-color)',
        boxShadow: '-2px 0 10px -2px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div 
        className="border-b transition-colors"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div 
          className={`flex items-center justify-between transition-colors ${activeTab === 'cart' ? 'px-4 py-2' : 'p-4'}`}
        >
          <h2 
            className={`font-semibold transition-colors ${activeTab === 'cart' ? 'text-base' : 'text-lg'}`}
            style={{ color: 'var(--text-primary)' }}
          >
          {activeTab === 'label-design' && 'Label Design'}
          {activeTab === 'upload' && 'Upload'}
          {activeTab === 'gallery' && 'Gallery'}
          {activeTab === 'cart' && 'Shopping Cart'}
        </h2>
        <button
          onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ 
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Checkout Steps - Only show for Cart */}
        {activeTab === 'cart' && (
          <div className="flex items-center justify-center gap-1.5 px-4 pb-2">
            <div 
              className="flex items-center gap-1.5"
              style={{ 
                color: checkoutStep === 'products' ? '#4DB64F' : 
                       (checkoutStep === 'shipping' || checkoutStep === 'review') ? '#4DB64F' : 
                       'var(--text-muted)' 
              }}
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors text-xs"
                style={{ 
                  backgroundColor: checkoutStep === 'products' ? '#4DB64F' : 'var(--card-bg)',
                  color: checkoutStep === 'products' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                1
              </div>
              <span className="text-xs font-medium">Products</span>
            </div>
            <ChevronRight 
              className="w-3 h-3 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            />
            <div 
              className="flex items-center gap-1.5"
              style={{ 
                color: checkoutStep === 'shipping' ? '#4DB64F' : 
                       checkoutStep === 'review' ? '#4DB64F' : 
                       'var(--text-muted)' 
              }}
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors text-xs"
                style={{ 
                  backgroundColor: (checkoutStep === 'shipping' || checkoutStep === 'review') ? '#4DB64F' : 'var(--card-bg)',
                  color: (checkoutStep === 'shipping' || checkoutStep === 'review') ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                2
              </div>
              <span className="text-xs font-medium">Shipping</span>
            </div>
            <ChevronRight 
              className="w-3 h-3 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            />
            <div 
              className="flex items-center gap-1.5"
              style={{ 
                color: checkoutStep === 'review' ? '#4DB64F' : 'var(--text-muted)' 
              }}
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors text-xs"
                style={{ 
                  backgroundColor: checkoutStep === 'review' ? '#4DB64F' : 'var(--card-bg)',
                  color: checkoutStep === 'review' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                3
              </div>
              <span className="text-xs font-medium">Review & Pay</span>
            </div>
          </div>
        )}
      </div>

      <div 
        className="flex-1 overflow-y-auto p-6 space-y-6 transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        {/* Label Design Panel */}
        {activeTab === 'label-design' && (
          <LabelDesignPanel
            capColor={capColor}
            setCapColor={setCapColor}
            setLabelTexture={setLabelTexture}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
            onClearUploadedImage={() => {
              // Clear uploaded image when user starts designing
              if (onDesignModeChange) {
                onDesignModeChange('designed');
              }
              setLabelData({ ...labelData, image: null });
            }}
          />
        )}

        {/* Upload Panel */}
        {activeTab === 'upload' && (
          <>
            <div>
              <label 
                className="block text-sm font-medium mb-2 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Upload Custom Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-all font-medium"
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(77, 182, 79, 0.3), 0 2px 4px -1px rgba(77, 182, 79, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(77, 182, 79, 0.4), 0 4px 6px -2px rgba(77, 182, 79, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(77, 182, 79, 0.3), 0 2px 4px -1px rgba(77, 182, 79, 0.2)';
                  }}
              >
                Upload Image
              </button>
            </div>

            {labelData.image && (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <img src={labelData.image} alt="Uploaded" className="w-full rounded-lg border" style={{ borderColor: 'var(--border-color)' }} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onAddToCart}
                    className="flex-1 px-4 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-all font-medium"
                    style={{
                      boxShadow: '0 4px 6px -1px rgba(77, 182, 79, 0.3), 0 2px 4px -1px rgba(77, 182, 79, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(77, 182, 79, 0.4), 0 4px 6px -2px rgba(77, 182, 79, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(77, 182, 79, 0.3), 0 2px 4px -1px rgba(77, 182, 79, 0.2)';
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => {
                      setLabelData({ ...labelData, image: null });
                      setLabelTexture(null);
                    }}
                    className="px-4 py-3 text-red-400 border border-red-400 rounded-lg hover:bg-red-400/10 transition-all font-medium"
                    style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Gallery Panel */}
        {activeTab === 'gallery' && (
          <div>
            <p 
              className="mb-4 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Browse your saved designs and templates
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Placeholder gallery items */}
              {[1, 2, 3, 4].map((item) => (
                <div 
                  key={item} 
                  className="aspect-square border rounded-lg flex items-center justify-center transition-colors"
                  style={{ 
                    backgroundColor: 'var(--card-bg)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <span 
                    className="text-sm transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Template {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cart Panel - Multi-step Checkout */}
        {activeTab === 'cart' && (
          <div className="flex flex-col h-full">
            <div 
              className="flex-1 overflow-y-auto px-4 pb-4 transition-colors max-w-5xl mx-auto w-full"
              style={{ color: 'var(--text-primary)' }}
            >
              {items.length === 0 ? (
                <div 
                  className="border rounded-lg p-8 text-center transition-colors"
                  style={{ 
                    backgroundColor: 'var(--card-bg)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <p 
                    className="mb-4 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Your cart is empty
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-all font-medium"
                    style={{
                      boxShadow: '0 4px 6px -1px rgba(77, 182, 79, 0.3), 0 2px 4px -1px rgba(77, 182, 79, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(77, 182, 79, 0.4), 0 4px 6px -2px rgba(77, 182, 79, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(77, 182, 79, 0.3), 0 2px 4px -1px rgba(77, 182, 79, 0.2)';
                    }}
                  >
                    Continue Designing
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 1: Products */}
                  {checkoutStep === 'products' && (
                    <div className="space-y-6">
                      <h3 
                        className="text-xl font-semibold mb-4 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Products
                      </h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div 
                            key={item.design_id} 
                            className="border rounded-xl p-4 transition-all duration-200 shadow-md hover:shadow-lg"
                            style={{ 
                              backgroundColor: 'var(--card-bg)', 
                              borderColor: 'var(--border-color)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(77, 182, 79, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                          >
                            <div className="flex items-start gap-4">
                              {(item.design?.label_image || item.design?.bottle_snapshot) && (
                                <div className="relative shrink-0">
                                <img
                                  src={item.design?.label_image || item.design?.bottle_snapshot}
                                  alt="Design preview"
                                    className="w-24 h-24 object-cover rounded-lg border transition-colors"
                                    style={{ borderColor: 'var(--border-color)' }}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-3">
                                  <h4 
                                    className="font-semibold text-base transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    Custom Bottle Design
                                  </h4>
                                  <button
                                    onClick={() => removeFromCart(item.design_id)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20 shrink-0 ml-2"
                                    title="Remove item"
                                  >
                                    <X className="w-4 h-4 text-red-400 hover:text-red-300" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label 
                                      className="block text-xs font-medium mb-1.5 transition-colors"
                                      style={{ color: 'var(--text-secondary)' }}
                                    >
                                      Quantity (min 100)
                                    </label>
                                    <input
                                      type="number"
                                      min="100"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleQuantityChange(item.design_id, parseInt(e.target.value) || 100)
                                      }
                                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB64F]/30 transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                                      style={{ 
                                        backgroundColor: 'var(--input-bg)', 
                                        borderColor: 'var(--input-border)',
                                        color: 'var(--text-primary)'
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label 
                                      className="block text-xs font-medium mb-1.5 transition-colors"
                                      style={{ color: 'var(--text-secondary)' }}
                                    >
                                      Price
                                    </label>
                                    <div 
                                      className="px-3 py-2 rounded-lg font-semibold text-lg transition-colors"
                                      style={{ 
                                        backgroundColor: 'rgba(77, 182, 79, 0.1)',
                                        color: '#4DB64F'
                                      }}
                                    >
                                      ${item.price.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div 
                        className="border rounded-xl p-5 mt-6 transition-all shadow-md"
                        style={{ 
                          backgroundColor: 'var(--card-bg)', 
                          borderColor: 'var(--border-color)' 
                        }}
                      >
                        <h4 
                          className="text-lg font-semibold mb-4 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Order Summary
                        </h4>
                        <div className="space-y-3 mb-5">
                          <div 
                            className="flex justify-between py-1.5 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <span className="text-sm">Subtotal</span>
                            <span className="font-medium">${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                          </div>
                          <div 
                            className="flex justify-between py-1.5 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <span className="text-sm">Shipping</span>
                            <span 
                              className="text-xs transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Calculated at checkout
                            </span>
                          </div>
                          <div 
                            className="border-t pt-3 flex justify-between text-lg font-bold transition-colors"
                            style={{ 
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <span>Total</span>
                            <span className="text-[#4DB64F]">${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setCheckoutStep('shipping')}
                          className="w-full px-6 py-3.5 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-all duration-200 font-semibold active:scale-[0.98] flex items-center justify-center gap-2"
                          style={{
                            boxShadow: '0 10px 15px -3px rgba(77, 182, 79, 0.3), 0 4px 6px -2px rgba(77, 182, 79, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(77, 182, 79, 0.4), 0 10px 10px -5px rgba(77, 182, 79, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(77, 182, 79, 0.3), 0 4px 6px -2px rgba(77, 182, 79, 0.2)';
                          }}
                        >
                          Continue to Shipping
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Shipping */}
                  {checkoutStep === 'shipping' && (
                    <div className="space-y-6">
                      <h3 
                        className="text-xl font-semibold mb-4 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Shipping
                      </h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setCheckoutStep('review');
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label 
                            className="block text-sm font-medium mb-2 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={shippingData.company_name}
                            onChange={(e) => setShippingData({ ...shippingData, company_name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                            style={{ 
                              backgroundColor: 'var(--input-bg)', 
                              borderColor: 'var(--input-border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>

                        <div>
                          <label 
                            className="block text-sm font-medium mb-2 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingData.full_name}
                            onChange={(e) => setShippingData({ ...shippingData, full_name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                            style={{ 
                              backgroundColor: 'var(--input-bg)', 
                              borderColor: 'var(--input-border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>

                        <div>
                          <label 
                            className="block text-sm font-medium mb-2 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={shippingData.email}
                            onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                            style={{ 
                              backgroundColor: 'var(--input-bg)', 
                              borderColor: 'var(--input-border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>

                        <div>
                          <label 
                            className="block text-sm font-medium mb-2 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={shippingData.phone}
                            onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                            style={{ 
                              backgroundColor: 'var(--input-bg)', 
                              borderColor: 'var(--input-border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>

                        <div>
                          <label 
                            className="block text-sm font-medium mb-2 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Shipping Address 1 *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingData.address1}
                            onChange={(e) => setShippingData({ ...shippingData, address1: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                            style={{ 
                              backgroundColor: 'var(--input-bg)', 
                              borderColor: 'var(--input-border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>

                        <div>
                          <label 
                            className="block text-sm font-medium mb-2 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Shipping Address 2 (Optional)
                          </label>
                          <input
                            type="text"
                            value={shippingData.address2}
                            onChange={(e) => setShippingData({ ...shippingData, address2: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                            style={{ 
                              backgroundColor: 'var(--input-bg)', 
                              borderColor: 'var(--input-border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label 
                              className="block text-sm font-medium mb-2 transition-colors"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              ZIP *
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingData.zip}
                              onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                              style={{ 
                                backgroundColor: 'var(--input-bg)', 
                                borderColor: 'var(--input-border)',
                                color: 'var(--text-primary)'
                              }}
                            />
                          </div>

                          <div>
                            <label 
                              className="block text-sm font-medium mb-2 transition-colors"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              City *
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingData.city}
                              onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                              style={{ 
                                backgroundColor: 'var(--input-bg)', 
                                borderColor: 'var(--input-border)',
                                color: 'var(--text-primary)'
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label 
                            className="block text-sm font-medium mb-2 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Country *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingData.country}
                            onChange={(e) => setShippingData({ ...shippingData, country: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-all shadow-sm"
                                      style={{
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                      }}
                            style={{ 
                              backgroundColor: 'var(--input-bg)', 
                              borderColor: 'var(--input-border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setCheckoutStep('products')}
                            className="flex-1 px-5 py-3 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 border active:scale-[0.98] shadow-sm"
                            style={{
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                            }}
                            style={{ 
                              backgroundColor: 'var(--card-bg)', 
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-primary)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                              e.currentTarget.style.borderColor = 'var(--text-muted)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                          </button>
                          <button
                            type="submit"
                            className="flex-1 px-5 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-all duration-200 font-semibold active:scale-[0.98] flex items-center justify-center gap-2"
                            style={{
                              boxShadow: '0 10px 15px -3px rgba(77, 182, 79, 0.3), 0 4px 6px -2px rgba(77, 182, 79, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(77, 182, 79, 0.4), 0 10px 10px -5px rgba(77, 182, 79, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(77, 182, 79, 0.3), 0 4px 6px -2px rgba(77, 182, 79, 0.2)';
                            }}
                          >
                            Continue to Review
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Step 3: Review & Pay */}
                  {checkoutStep === 'review' && (
                    <div className="space-y-6">
                      <h3 
                        className="text-xl font-semibold mb-4 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Review & Pay
                      </h3>
                      
                      {orderError && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                          {orderError}
                        </div>
                      )}

                      {/* Products Review */}
                      <div 
                        className="border rounded-xl p-5 transition-colors shadow-sm"
                        style={{ 
                          backgroundColor: 'var(--card-bg)', 
                          borderColor: 'var(--border-color)' 
                        }}
                      >
                        <h4 
                          className="text-lg font-semibold mb-4 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Products
                        </h4>
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div 
                              key={item.design_id} 
                              className="flex items-center gap-4 pb-3 border-b last:border-0 last:pb-0 transition-colors"
                              style={{ borderColor: 'var(--border-color)' }}
                            >
                              {item.design?.bottle_snapshot && (
                                <img
                                  src={item.design.bottle_snapshot}
                                  alt="Design preview"
                                  className="w-20 h-20 object-cover rounded-lg border transition-colors"
                                  style={{ borderColor: 'var(--border-color)' }}
                                />
                              )}
                              <div className="flex-1">
                                <p 
                                  className="font-semibold mb-1 transition-colors"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  Custom Bottle Design
                                </p>
                                <p 
                                  className="text-sm transition-colors"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  Quantity: {item.quantity} bottles
                                </p>
                              </div>
                              <p className="text-[#4DB64F] font-bold text-lg">${item.price.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Review */}
                      <div 
                        className="border rounded-xl p-5 transition-colors shadow-sm"
                        style={{ 
                          backgroundColor: 'var(--card-bg)', 
                          borderColor: 'var(--border-color)' 
                        }}
                      >
                        <h4 
                          className="text-lg font-semibold mb-4 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Shipping Address
                        </h4>
                        <div 
                          className="space-y-1.5 text-sm transition-colors leading-relaxed"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{shippingData.full_name}</p>
                          {shippingData.company_name && <p>{shippingData.company_name}</p>}
                          <p>{shippingData.address1}</p>
                          {shippingData.address2 && <p>{shippingData.address2}</p>}
                          <p>{shippingData.city}, {shippingData.zip}</p>
                          <p>{shippingData.country}</p>
                          <div className="pt-2 space-y-1">
                            <p>{shippingData.phone}</p>
                          <p>{shippingData.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div 
                        className="border rounded-xl p-5 transition-colors shadow-sm"
                        style={{ 
                          backgroundColor: 'var(--card-bg)', 
                          borderColor: 'var(--border-color)' 
                        }}
                      >
                        <h4 
                          className="text-lg font-semibold mb-4 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Order Summary
                        </h4>
                        <div className="space-y-3 mb-5">
                          <div 
                            className="flex justify-between py-1.5 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <span className="text-sm">Subtotal</span>
                            <span className="font-medium">${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                          </div>
                          <div 
                            className="flex justify-between py-1.5 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <span className="text-sm">Shipping</span>
                            <span 
                              className="text-xs transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Calculated at checkout
                            </span>
                          </div>
                          <div 
                            className="border-t pt-3 flex justify-between text-lg font-bold transition-colors"
                            style={{ 
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <span>Total</span>
                            <span className="text-[#4DB64F]">${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div 
                        className="border rounded-xl p-4 transition-colors"
                        style={{ 
                          backgroundColor: 'rgba(234, 179, 8, 0.1)', 
                          borderColor: 'rgba(234, 179, 8, 0.3)'
                        }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: '#fbbf24' }}>
                          <strong style={{ color: '#fde047' }}>Note:</strong> Payment integration is not implemented yet. Orders will be marked as successful for testing purposes.
                        </p>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setCheckoutStep('shipping')}
                          className="flex-1 px-5 py-3.5 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 border active:scale-[0.98]"
                          style={{ 
                            backgroundColor: 'var(--card-bg)', 
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                            e.currentTarget.style.borderColor = 'var(--text-muted)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                          }}
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
                          className="flex-1 px-5 py-3.5 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-all duration-200 font-semibold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            boxShadow: orderLoading ? '0 4px 6px -1px rgba(77, 182, 79, 0.2)' : '0 10px 15px -3px rgba(77, 182, 79, 0.3), 0 4px 6px -2px rgba(77, 182, 79, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            if (!orderLoading) {
                              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(77, 182, 79, 0.4), 0 10px 10px -5px rgba(77, 182, 79, 0.2)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!orderLoading) {
                              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(77, 182, 79, 0.3), 0 4px 6px -2px rgba(77, 182, 79, 0.2)';
                            }
                          }}
                        >
                          {orderLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Processing...
                            </span>
                          ) : (
                            'Place Order'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

