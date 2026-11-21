const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Health
  health: () => request('/health'),
  getSellingPrices: () => request('/prices'),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  createSupplier: (body) => request('/suppliers', { method: 'POST', body: JSON.stringify(body) }),
  updateSupplier: (id, body) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Fruits & Stock
  getFruits: () => request('/fruits'),
  createFruit: (body) => request('/fruits', { method: 'POST', body: JSON.stringify(body) }),
  updateFruit: (id, body) => request(`/fruits/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFruit: (id) => request(`/fruits/${id}`, { method: 'DELETE' }),
  getStock: () => request('/fruits/stock'),
  getLowStock: (threshold = 15) => request(`/fruits/stock/low?threshold=${threshold}`),

  // Vendors
  getVendors: (search = '') => request(`/vendors${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createVendor: (body) => request('/vendors', { method: 'POST', body: JSON.stringify(body) }),
  updateVendor: (id, body) => request(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // Purchases
  getPurchases: () => request('/purchases'),
  createPurchase: (body) => request('/purchases', { method: 'POST', body: JSON.stringify(body) }),

  // Sales
  getSales: () => request('/sales'),
  createSale: (body) => request('/sales', { method: 'POST', body: JSON.stringify(body) }),

  // Reports
  getTopFruits: () => request('/reports/top-fruits'),
  getRevenue: (start, end) => request(`/reports/revenue?start_date=${start}&end_date=${end}`),
  getHighestVolumeVendor: () => request('/reports/highest-volume-vendor'),
  getStockReport: () => request('/reports/stock'),
};
