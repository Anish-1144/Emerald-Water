const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  // Check for order token first, then regular token
  const orderToken = typeof window !== 'undefined' ? localStorage.getItem('orderToken') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Use orderToken for order endpoints, regular token for others
  if (orderToken && endpoint.includes('/orders')) {
    headers['Authorization'] = `Bearer ${orderToken}`;
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// Auth API - OTP based authentication for order access
export const authAPI = {
  sendOTP: (email: string) =>
    request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOTP: (email: string, otp: string) =>
    request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
};

// Design API
export const designAPI = {
  saveDesign: (data: any) =>
    request('/designs', { method: 'POST', body: JSON.stringify(data) }),
  getDesigns: () => request('/designs'),
  getDesign: (id: string) => request(`/designs/${id}`),
  deleteDesign: (id: string) =>
    request(`/designs/${id}`, { method: 'DELETE' }),
};

// Order API
export const orderAPI = {
  createOrder: (data: any) =>
    request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => request('/orders'),
  getOrdersByContact: () => {
    // No parameters needed - email comes from JWT token
    return request('/orders/search');
  },
  getOrder: (id: string) => request(`/orders/${id}`),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => request('/admin/dashboard'),
  getAllOrders: () => request('/admin/orders'),
  updateOrderStatus: (id: string, status: string) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ order_status: status }),
    }),
  getAllUsers: () => request('/admin/users'),
  getUserDetails: (id: string) => request(`/admin/users/${id}`),
};

