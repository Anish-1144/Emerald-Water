const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.emeraldwater.ca/api';

async function request(endpoint: string, options: RequestInit = {}) {
  // Check for admin token first, then order token, then regular token
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const orderToken = typeof window !== 'undefined' ? localStorage.getItem('orderToken') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Use admin token for admin endpoints
  if (adminToken && endpoint.includes('/admin')) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }
  // Use orderToken for order endpoints (non-admin)
  else if (orderToken && endpoint.includes('/orders') && !endpoint.includes('/admin')) {
    headers['Authorization'] = `Bearer ${orderToken}`;
  } 
  // Use regular token for other endpoints
  else if (token && !endpoint.includes('/admin')) {
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
  login: (email: string, password: string) =>
    request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getDashboardStats: () => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return request('/admin/dashboard', {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    });
  },
  getAllOrders: () => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return request('/admin/orders', {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    });
  },
  getOrderDetails: (id: string) => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return request(`/admin/orders/${id}`, {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    });
  },
  updateOrderStatus: (id: string, status: string) => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      body: JSON.stringify({ order_status: status }),
    });
  },
  getAllUsers: () => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return request('/admin/users', {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    });
  },
  getUserDetails: (id: string) => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return request(`/admin/users/${id}`, {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    });
  },
  changePassword: (currentPassword: string, newPassword: string) => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return request('/admin/change-password', {
      method: 'PUT',
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

