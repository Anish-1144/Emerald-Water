const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
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

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; phone?: string; company_name?: string }) =>
    request('/users/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request('/users/login', { method: 'POST', body: JSON.stringify(data) }),
  getCurrentUser: () => request('/users/me'),
  updateProfile: (data: { name?: string; email?: string; phone?: string; company_name?: string; currentPassword?: string; newPassword?: string }) =>
    request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
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

