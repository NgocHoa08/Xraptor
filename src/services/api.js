const TOKEN_KEY = 'xraptor_admin_token';

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAdminToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Lỗi máy chủ (${res.status})`);
  }
  return data;
}

export const api = {
  // Public storefront
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return request(`/api/products${qs ? '?' + qs : ''}`);
  },
  getProduct: (id) => request(`/api/products/${encodeURIComponent(id)}`),
  getBlogs: () => request('/api/blogs'),
  createOrder: (payload) =>
    request('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  trackOrders: (query) => request(`/api/orders/track/${encodeURIComponent(query)}`),
  createContact: (payload) =>
    request('/api/contacts', { method: 'POST', body: JSON.stringify(payload) }),
  subscribe: (email) =>
    request('/api/subscribers', { method: 'POST', body: JSON.stringify({ email }) }),

  // Admin auth
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Admin dashboard & CRUD
  getDashboard: () => request('/api/dashboard'),
  createProduct: (payload) =>
    request('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id) =>
    request(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return request('/api/upload', { method: 'POST', body: fd });
  },

  getOrders: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return request(`/api/orders${qs ? '?' + qs : ''}`);
  },
  updateOrderStatus: (id, status) =>
    request(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteOrder: (id) => request(`/api/orders/${id}`, { method: 'DELETE' }),

  getContacts: () => request('/api/contacts'),
  updateContactStatus: (id, status) =>
    request(`/api/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteContact: (id) => request(`/api/contacts/${id}`, { method: 'DELETE' }),

  getSubscribers: () => request('/api/subscribers'),
  deleteSubscriber: (id) => request(`/api/subscribers/${id}`, { method: 'DELETE' }),

  createBlog: (payload) =>
    request('/api/blogs', { method: 'POST', body: JSON.stringify(payload) }),
  updateBlog: (id, payload) =>
    request(`/api/blogs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteBlog: (id) =>
    request(`/api/blogs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
