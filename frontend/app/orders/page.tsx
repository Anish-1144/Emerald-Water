'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI, authAPI } from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

type AuthStep = 'email' | 'otp' | 'authenticated';

export default function OrdersPage() {
  const router = useRouter();
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('orderToken');
    if (token) {
      setAuthStep('authenticated');
      loadOrders();
    }
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (otpExpiresIn > 0) {
      const timer = setTimeout(() => {
        setOtpExpiresIn(otpExpiresIn - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpExpiresIn]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await authAPI.sendOTP(email);
      setOtpSent(true);
      setOtpExpiresIn(response.expiresIn || 600);
      setAuthStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP(email, otp);
      // Store token in localStorage
      localStorage.setItem('orderToken', response.token);
      setAuthStep('authenticated');
      await loadOrders();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await orderAPI.getOrdersByContact();
      setOrders(data);
      if (data.length === 0) {
        setError('No orders found for your email address');
      }
    } catch (err: any) {
      // If token is invalid, clear it and reset to email step
      if (err.message?.includes('expired') || err.message?.includes('Invalid token')) {
        localStorage.removeItem('orderToken');
        setAuthStep('email');
        setError('Your session has expired. Please authenticate again.');
      } else {
        setError(err.message || 'Error loading orders. Please try again.');
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('orderToken');
    setAuthStep('email');
    setEmail('');
    setOtp('');
    setOrders([]);
    setOtpSent(false);
  };

  const getStatusColor = (status: string) => {
    // Theme-aware status colors using inline styles
    const colors: Record<string, { bg: string; text: string }> = {
      pending_production: { bg: 'rgba(234, 179, 8, 0.2)', text: '#fbbf24' },
      printing: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
      packed: { bg: 'rgba(168, 85, 247, 0.2)', text: '#a78bfa' },
      shipped: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' },
      cancelled: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
    };
    return colors[status] || { bg: 'var(--card-bg)', text: 'var(--text-primary)' };
  };

  return (
    <div className="flex flex-col h-screen transition-colors" style={{ backgroundColor: 'var(--background)' }}>
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={null} onTabChange={() => {}} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 
                  className="text-3xl font-bold mb-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  My Orders
                </h1>
                <p 
                  className="text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {authStep === 'authenticated' 
                    ? 'View and manage your orders' 
                    : 'Enter your email to receive an OTP and access your orders'}
                </p>
              </div>
              {authStep === 'authenticated' && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border rounded-lg transition-all duration-200 font-medium"
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
                  Logout
                </button>
              )}
            </div>

            {/* Authentication Flow */}
            {authStep === 'email' && (
              <div 
                className="border rounded-xl shadow-sm p-6 mb-6 transition-colors"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <h2 
                  className="text-xl font-semibold mb-4 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Enter Your Email
                </h2>
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors"
                      style={{ 
                        backgroundColor: 'var(--input-bg)', 
                        borderColor: 'var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  {error && (
                    <div 
                      className="border rounded-lg px-4 py-3 transition-colors"
                      style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        color: '#fca5a5'
                      }}
                    >
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full px-6 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    {otpLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Sending OTP...
                      </span>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </form>
              </div>
            )}

            {authStep === 'otp' && (
              <div 
                className="border rounded-xl shadow-sm p-6 mb-6 transition-colors"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <h2 
                  className="text-xl font-semibold mb-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Enter OTP
                </h2>
                <p 
                  className="text-sm mb-4 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  We've sent a 6-digit OTP to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                </p>
                {otpExpiresIn > 0 && (
                  <p 
                    className="text-xs mb-4 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    OTP expires in {Math.floor(otpExpiresIn / 60)}:{(otpExpiresIn % 60).toString().padStart(2, '0')}
                  </p>
                )}
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      OTP Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors text-center text-2xl font-mono tracking-widest"
                      style={{ 
                        backgroundColor: 'var(--input-bg)', 
                        borderColor: 'var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                  {error && (
                    <div 
                      className="border rounded-lg px-4 py-3 transition-colors"
                      style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        color: '#fca5a5'
                      }}
                    >
                      {error}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('email');
                        setOtp('');
                        setError('');
                      }}
                      className="flex-1 px-4 py-3 border rounded-lg transition-all duration-200 font-medium"
                      style={{ 
                        backgroundColor: 'var(--card-bg)', 
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Change Email
                    </button>
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="flex-1 px-6 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Verifying...
                        </span>
                      ) : (
                        'Verify OTP'
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading || otpExpiresIn > 540}
                    className="w-full text-sm text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: '#4DB64F' }}
                  >
                    {otpLoading ? 'Sending...' : 'Resend OTP'}
                  </button>
                </form>
              </div>
            )}

            {/* Orders List - Only show when authenticated */}
            {authStep === 'authenticated' && (
              <>
                {loading ? (
              <div 
                className="text-center py-12 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                <div className="inline-block w-8 h-8 border-4 border-[#4DB64F] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div 
                className="border rounded-xl shadow-sm p-8 text-center transition-colors"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                {error ? (
                  <p 
                    className="mb-4 transition-colors"
                    style={{ color: '#fca5a5' }}
                  >
                    {error}
                  </p>
                ) : (
                  <p 
                    className="mb-4 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Enter your email or phone number above to view your orders
                  </p>
                )}
                <button
                  onClick={() => router.push('/design')}
                  className="px-6 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-all duration-200 font-semibold shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Start Designing
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const statusColor = getStatusColor(order.order_status);
                  return (
                    <div 
                      key={order._id} 
                      className="border rounded-xl shadow-sm transition-all duration-200 hover:shadow-lg overflow-hidden"
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
                      <div className="flex flex-col md:flex-row">
                        {/* Left Side - Image */}
                        <div 
                          className="w-full md:w-80 lg:w-96 h-64 md:h-auto shrink-0 border-r transition-colors"
                          style={{ 
                            borderColor: 'var(--border-color)',
                            backgroundColor: 'var(--input-bg)'
                          }}
                        >
                          {order.bottle_snapshot || order.label_image ? (
                            <img
                              src={order.bottle_snapshot || order.label_image}
                              alt="Order preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <p 
                                className="text-sm transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Image Label
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right Side - Order Information */}
                        <div className="flex-1 p-5 flex flex-col">
                          {/* Order Header */}
                          <div className="mb-4">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 
                                className="text-lg font-semibold transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                Order #{order.order_id}
                              </h3>
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: statusColor.bg,
                                  color: statusColor.text
                                }}
                              >
                                {order.order_status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <p 
                              className="text-sm transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Placed on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Order Details Row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p 
                                className="text-xs font-medium mb-1 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Quantity
                              </p>
                              <p 
                                className="font-semibold transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {order.quantity} bottles
                              </p>
                            </div>
                            <div>
                              <p 
                                className="text-xs font-medium mb-1 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Payment Status
                              </p>
                              <p 
                                className="font-semibold capitalize transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {order.payment_status}
                              </p>
                            </div>
                            <div>
                              <p 
                                className="text-xs font-medium mb-1 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Shipping Address
                              </p>
                              <p 
                                className="font-semibold text-sm transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {order.shipping_address?.city || order.shipping_address?.full_name || 'N/A'}, {order.shipping_address?.country || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Contact Information */}
                          {order.shipping_address && (
                            <div className="mb-4">
                              <p 
                                className="text-xs font-medium mb-2 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Contact Information
                              </p>
                              <div className="space-y-1 text-sm">
                                {order.shipping_address.email && (
                                  <p 
                                    className="transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    <span style={{ color: 'var(--text-muted)' }}>Email:</span> {order.shipping_address.email}
                                  </p>
                                )}
                                {order.shipping_address.phone && (
                                  <p 
                                    className="transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    <span style={{ color: 'var(--text-muted)' }}>Phone:</span> {order.shipping_address.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Bottom Section - Price and Actions */}
                          <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                            <button
                              onClick={() => router.push(`/orders/repeat/${order._id}`)}
                              className="px-4 py-2 bg-[#4DB64F] hover:bg-[#45a049] text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Repeat Order
                            </button>
                            <button
                              className="px-4 py-2 border rounded-lg font-medium transition-colors text-sm"
                              style={{ 
                                backgroundColor: 'var(--card-bg)', 
                                borderColor: '#3b82f6',
                                color: '#3b82f6'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                              }}
                            >
                              ${order.total_price.toFixed(2)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

