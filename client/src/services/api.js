const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) errorMsg = errJson.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Settings & Vocabulary
  getSettings: () => fetch(`${API_BASE}/settings`).then(handleResponse),
  updateSettings: (data) =>
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

  testGoogleSheets: (data) =>
    fetch(`${API_BASE}/settings/google-sheets/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

  exportToGoogleSheets: (data) =>
    fetch(`${API_BASE}/settings/google-sheets/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

  // Types
  getTypes: () => fetch(`${API_BASE}/types`).then(handleResponse),
  createItemType: (data) =>
    fetch(`${API_BASE}/types/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  deleteItemType: (id) =>
    fetch(`${API_BASE}/types/items/${id}`, { method: 'DELETE' }).then(handleResponse),

  createExpenseType: (data) =>
    fetch(`${API_BASE}/types/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  deleteExpenseType: (id) =>
    fetch(`${API_BASE}/types/expenses/${id}`, { method: 'DELETE' }).then(handleResponse),

  createIncomeType: (data) =>
    fetch(`${API_BASE}/types/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  deleteIncomeType: (id) =>
    fetch(`${API_BASE}/types/income/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Names (Vendors, Employees, Customers)
  getNames: (type) => fetch(`${API_BASE}/names${type ? `?type=${type}` : ''}`).then(handleResponse),
  getNameById: (id) => fetch(`${API_BASE}/names/${id}`).then(handleResponse),
  createName: (data) =>
    fetch(`${API_BASE}/names`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  updateName: (id, data) =>
    fetch(`${API_BASE}/names/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  deleteName: (id) =>
    fetch(`${API_BASE}/names/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Items Catalog
  getItems: () => fetch(`${API_BASE}/items`).then(handleResponse),
  createItem: (data) =>
    fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  updateItem: (id, data) =>
    fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  deleteItem: (id) =>
    fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Orders
  getOrders: (type, status) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetch(`${API_BASE}/orders${qs ? `?${qs}` : ''}`).then(handleResponse);
  },
  getOrderById: (id) => fetch(`${API_BASE}/orders/${id}`).then(handleResponse),
  createOrder: (data) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  updateOrder: (id, data) =>
    fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  deleteOrder: (id) =>
    fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' }).then(handleResponse),
  getOrderPdfUrl: (id) => `${API_BASE}/orders/${id}/pdf`,

  // Transactions
  getTransactions: (type) =>
    fetch(`${API_BASE}/transactions${type ? `?type=${type}` : ''}`).then(handleResponse),
  createTransaction: (data) =>
    fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  deleteTransaction: (id) =>
    fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Dashboard
  getDashboardStats: () => fetch(`${API_BASE}/dashboard/stats`).then(handleResponse)
};
