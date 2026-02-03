'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orderAPI, designAPI } from '@/lib/api';
import { 
  calculateOrderPrice, 
  SHIPPING_OPTIONS,
  SETUP_FEE,
  MINIMUM_BOTTLES,
  getCapColorOptions,
  hexToCapColor,
  type ShippingMethod,
  type CapColor
} from '@/lib/pricing';
import Header from '@/components/Header';

type Step = 'form' | 'review' | 'payment';

export default function RepeatOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [originalOrder, setOriginalOrder] = useState<any>(null);
  const [design, setDesign] = useState<any>(null);

  // Form data - pre-filled from original order
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

  const [quantity, setQuantity] = useState(MINIMUM_BOTTLES);
  const [capColor, setCapColor] = useState<CapColor>('white');
  const [shrinkWrap, setShrinkWrap] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('pickup');

  // Load original order data
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        const order = await orderAPI.getOrder(orderId);
        setOriginalOrder(order);

        // Pre-fill form with original order data
        if (order.shipping_address) {
          setFormData({
            company_name: order.shipping_address.company_name || '',
            full_name: order.shipping_address.full_name || '',
            email: order.shipping_address.email || '',
            phone: order.shipping_address.phone || '',
            address1: order.shipping_address.address1 || '',
            address2: order.shipping_address.address2 || '',
            zip: order.shipping_address.zip || '',
            country: order.shipping_address.country || '',
            city: order.shipping_address.city || '',
          });
        }

        // Pre-fill quantity
        setQuantity(order.quantity || MINIMUM_BOTTLES);

        // Load design if available
        const designId = order.design_id?._id || order.design_id;
        if (designId) {
          try {
            const designData = await designAPI.getDesign(designId);
            setDesign(designData);
          } catch (err) {
            console.warn('Could not load design:', err);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // Calculate pricing
  const pricing = calculateOrderPrice({
    quantity,
    capColor,
    shrinkWrap,
    shippingMethod,
    hasSetupFee: false, // Repeat orders don't include setup fee
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('review');
  };

  const handleReviewSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      // Get design ID - handle both populated and non-populated cases
      const designId = design?._id || originalOrder?.design_id?._id || originalOrder?.design_id;
      
      if (!designId) {
        throw new Error('Design not found. Cannot repeat order.');
      }

      // Create new order with updated information
      await orderAPI.createOrder({
        design_id: designId,
        quantity,
        total_price: pricing.total,
        shipping_address: formData,
      });

      // Move to payment step
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentComplete = () => {
    alert('Order placed successfully! You will receive a confirmation email shortly.');
    router.push('/orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--background)' }}>
        <Header />
        <main className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-center h-64">
            <p style={{ color: 'var(--text-primary)' }}>Loading order...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !originalOrder) {
    return (
      <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--background)' }}>
        <Header />
        <main className="max-w-6xl mx-auto p-4">
          <div 
            className="border rounded-lg p-4 mb-4"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.2)', 
              borderColor: 'rgba(239, 68, 68, 0.5)',
              color: '#fca5a5'
            }}
          >
            {error}
          </div>
          <button
            onClick={() => router.push('/orders')}
            className="px-4 py-2 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors"
          >
            Back to Orders
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--background)' }}>
      <Header />
      <main className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <button
            onClick={() => router.push('/orders')}
            className="text-sm mb-4 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            ← Back to Orders
          </button>
          <h1 
            className="text-3xl font-bold transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            Repeat Order #{originalOrder?.order_id}
          </h1>
          <p 
            className="text-sm mt-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Review and edit your order details below
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(['form', 'review', 'payment'] as Step[]).map((s, index) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step === s
                        ? 'bg-[#4DB64F] text-white'
                        : step === 'form' && s === 'form'
                        ? 'bg-[#4DB64F] text-white'
                        : step === 'review' && (s === 'form' || s === 'review')
                        ? 'bg-[#4DB64F] text-white'
                        : step === 'payment' && (s === 'form' || s === 'review' || s === 'payment')
                        ? 'bg-[#4DB64F] text-white'
                        : 'bg-var(--input-bg) text-var(--text-muted)'
                    }`}
                    style={{
                      backgroundColor: 
                        step === s || 
                        (step === 'review' && s === 'form') ||
                        (step === 'payment' && (s === 'form' || s === 'review'))
                          ? '#4DB64F'
                          : 'var(--input-bg)',
                      color: 
                        step === s || 
                        (step === 'review' && s === 'form') ||
                        (step === 'payment' && (s === 'form' || s === 'review'))
                          ? '#ffffff'
                          : 'var(--text-muted)'
                    }}
                  >
                    {index + 1}
                  </div>
                  <p 
                    className="text-xs mt-2 text-center transition-colors capitalize"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {s}
                  </p>
                </div>
                {index < 2 && (
                  <div 
                    className="flex-1 h-1 mx-2 transition-colors"
                    style={{
                      backgroundColor: 
                        step === 'review' && s === 'form' ||
                        step === 'payment'
                          ? '#4DB64F'
                          : 'var(--border-color)'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
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

        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div 
              className="border rounded-lg shadow-lg p-6 transition-colors"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-sm font-medium mb-1 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
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
                  />
                </div>

                <div className="md:col-span-2">
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
                  />
                </div>

                <div className="md:col-span-2">
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
                  />
                </div>

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
                  />
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
                  />
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div 
              className="border rounded-lg shadow-lg p-6 transition-colors"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)' 
              }}
            >
              <h2 
                className="text-xl font-semibold mb-4 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Order Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label 
                    className="block text-sm font-medium mb-1 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Quantity (min {MINIMUM_BOTTLES} - 10 cases)
                  </label>
                  <input
                    type="number"
                    min={MINIMUM_BOTTLES}
                    step="30"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(MINIMUM_BOTTLES, parseInt(e.target.value) || MINIMUM_BOTTLES))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p 
                    className="text-xs mt-1 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Packaged in cases of 30
                  </p>
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-1 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cap Color
                  </label>
                  <select
                    value={capColor}
                    onChange={(e) => setCapColor(e.target.value as CapColor)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {getCapColorOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shrinkWrap}
                      onChange={(e) => setShrinkWrap(e.target.checked)}
                      className="w-4 h-4 rounded border focus:ring-2 focus:ring-[#4DB64F] transition-colors"
                      style={{ 
                        backgroundColor: 'var(--input-bg)', 
                        borderColor: 'var(--input-border)',
                      }}
                    />
                    <span 
                      className="text-sm transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Poly Shrink Wrap (+$1.99 per case)
                    </span>
                  </label>
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-1 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Shipping Method *
                  </label>
                  <select
                    required
                    value={shippingMethod}
                    onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="pickup">{SHIPPING_OPTIONS.PICKUP.name}</option>
                    <option value="local_delivery">{SHIPPING_OPTIONS.LOCAL_DELIVERY.name} - ${SHIPPING_OPTIONS.LOCAL_DELIVERY.price}</option>
                    <option value="shipping">{SHIPPING_OPTIONS.SHIPPING.name}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Design Preview */}
            {originalOrder?.bottle_snapshot && (
              <div 
                className="border rounded-lg shadow-lg p-6 transition-colors"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <h2 
                  className="text-xl font-semibold mb-4 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Design Preview
                </h2>
                <img
                  src={originalOrder.bottle_snapshot}
                  alt="Bottle preview"
                  className="w-48 h-48 object-cover rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/orders')}
                className="px-6 py-3 border rounded-lg transition-colors font-medium"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[#4DB64F] hover:bg-[#45a049] text-white rounded-lg font-medium transition-colors"
              >
                Continue to Review
              </button>
            </div>
          </form>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div 
              className="border rounded-lg shadow-lg p-6 transition-colors"
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

              <div className="space-y-4">
                <div>
                  <h3 
                    className="text-sm font-medium mb-2 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Shipping Information
                  </h3>
                  <div 
                    className="p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--input-bg)' }}
                  >
                    <p style={{ color: 'var(--text-primary)' }}>{formData.full_name}</p>
                    {formData.company_name && (
                      <p style={{ color: 'var(--text-primary)' }}>{formData.company_name}</p>
                    )}
                    <p style={{ color: 'var(--text-primary)' }}>{formData.address1}</p>
                    {formData.address2 && (
                      <p style={{ color: 'var(--text-primary)' }}>{formData.address2}</p>
                    )}
                    <p style={{ color: 'var(--text-primary)' }}>
                      {formData.city}, {formData.country} {formData.zip}
                    </p>
                    <p style={{ color: 'var(--text-primary)' }}>{formData.email}</p>
                    <p style={{ color: 'var(--text-primary)' }}>{formData.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 
                    className="text-sm font-medium mb-2 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Order Details
                  </h3>
                  <div 
                    className="p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--input-bg)' }}
                  >
                    <p style={{ color: 'var(--text-primary)' }}>Quantity: {quantity} bottles</p>
                    <p style={{ color: 'var(--text-primary)' }}>Cap Color: {capColor.charAt(0).toUpperCase() + capColor.slice(1)}</p>
                    <p style={{ color: 'var(--text-primary)' }}>Shrink Wrap: {shrinkWrap ? 'Yes' : 'No'}</p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      Shipping: {shippingMethod === 'pickup' ? 'Pick-up (Free)' : 
                                 shippingMethod === 'local_delivery' ? 'Local Delivery ($50)' : 
                                 'Shipping (Quote Required)'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 
                    className="text-sm font-medium mb-2 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Pricing Breakdown
                  </h3>
                  <div 
                    className="p-3 rounded-lg transition-colors space-y-2"
                    style={{ backgroundColor: 'var(--input-bg)' }}
                  >
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Bottles ({quantity} × ${pricing.bottlePrice.toFixed(2)})</span>
                      <span style={{ color: 'var(--text-primary)' }}>${pricing.breakdown.bottles.toFixed(2)}</span>
                    </div>
                    {pricing.breakdown.caps > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Cap Color ({quantity} × ${pricing.capPrice.toFixed(2)})</span>
                        <span style={{ color: 'var(--text-primary)' }}>${pricing.breakdown.caps.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.breakdown.shrinkWrap > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Shrink Wrap</span>
                        <span style={{ color: 'var(--text-primary)' }}>${pricing.breakdown.shrinkWrap.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.breakdown.shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                        <span style={{ color: 'var(--text-primary)' }}>${pricing.breakdown.shipping.toFixed(2)}</span>
                      </div>
                    )}
                    <div 
                      className="flex justify-between text-lg font-semibold pt-2 border-t"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span>Total</span>
                      <span>${pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('form')}
                className="px-6 py-3 border rounded-lg transition-colors font-medium"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                Back to Edit
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-[#4DB64F] hover:bg-[#45a049] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div 
            className="border rounded-lg shadow-lg p-6 transition-colors"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <h2 
              className="text-xl font-semibold mb-4 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              Payment
            </h2>

            <div 
              className="border rounded-lg p-4 mb-4 transition-colors"
              style={{ 
                backgroundColor: 'rgba(234, 179, 8, 0.2)', 
                borderColor: 'rgba(234, 179, 8, 0.5)',
                color: '#fde047'
              }}
            >
              <p className="text-sm">
                <strong style={{ color: '#fef08a' }}>Note:</strong> Payment integration is not implemented yet. 
                Your order has been created and will be processed. You will receive a confirmation email shortly.
              </p>
            </div>

            <div 
              className="p-4 rounded-lg mb-4 transition-colors"
              style={{ backgroundColor: 'var(--input-bg)' }}
            >
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: 'var(--text-secondary)' }}>Order Total</span>
                <span 
                  className="text-2xl font-bold"
                  style={{ color: '#4DB64F' }}
                >
                  ${pricing.total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePaymentComplete}
              className="w-full px-6 py-3 bg-[#4DB64F] hover:bg-[#45a049] text-white rounded-lg font-medium transition-colors"
            >
              Complete Order
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

