const API_BASE = 'http://localhost:5000/api';

let activeCondominiumId = localStorage.getItem('praticom_active_condo_id') || '1';

export function setActiveCondominiumId(id) {
  activeCondominiumId = String(id);
  localStorage.setItem('praticom_active_condo_id', String(id));
}

export function getActiveCondominiumId() {
  return activeCondominiumId;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Condominium-Id': activeCondominiumId,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : await res.text();
    if (!res.ok) {
      const detail = typeof data === 'object'
        ? data.error
        : `A API respondeu HTTP ${res.status} em formato inválido. Reinicie o backend se ele tiver sido atualizado.`;
      throw new Error(detail || `A API respondeu com HTTP ${res.status}. Reinicie o backend se ele tiver sido atualizado.`);
    }
    if (typeof data === 'string') {
      throw new Error('A API respondeu HTML/texto em vez de JSON. Reinicie o backend e tente novamente.');
    }
    return data;
  } catch (error) {
    console.error(`Erro na API [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Condomínios e blocos
  getCondominiums: (params = {}) => request(`/condominiums${Object.keys(params).length ? '?' + new URLSearchParams(params) : ''}`),
  createCondominium: (data) => request('/condominiums', { method: 'POST', body: JSON.stringify(data) }),
  updateCondominium: (id, data) => request(`/condominiums/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateCondominiumStatus: (id, status) => request(`/condominiums/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getBlocks: (condominiumId) => request(`/condominiums/${condominiumId}/blocks`),
  createBlock: (condominiumId, data) => request(`/condominiums/${condominiumId}/blocks`, { method: 'POST', body: JSON.stringify(data) }),
  updateBlock: (id, data) => request(`/blocks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateBlockStatus: (id, status) => request(`/blocks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteCondominium: (id) => request(`/condominiums/${id}`, { method: 'DELETE' }),
  deleteBlock: (id) => request(`/blocks/${id}`, { method: 'DELETE' }),
  getPendingUnits: () => request('/territory/pending-units'),
  mapLegacyUnits: (blockId, legacy_block) => request(`/blocks/${blockId}/map-legacy-units`, { method: 'PATCH', body: JSON.stringify({ legacy_block }) }),
  getCondominiumModules: (id) => request(`/condominiums/${id}/modules`),
  updateCondominiumModules: (id, modules) => request(`/condominiums/${id}/modules`, { method: 'PUT', body: JSON.stringify({ modules }) }),
  getActiveCondominiumModules: () => request('/condominiums/active/modules'),
  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Encomendas
  getDeliveries: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/deliveries${qs ? '?' + qs : ''}`);
  },
  createDelivery: (data) => request('/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  pickupDelivery: (id, data) => request(`/deliveries/${id}/pickup`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Portaria / Acesso
  getAccessLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/access${qs ? '?' + qs : ''}`);
  },
  registerEntry: (data) => request('/access/entry', { method: 'POST', body: JSON.stringify(data) }),
  registerExit: (id) => request(`/access/${id}/exit`, { method: 'PATCH' }),
  deleteAccess: (id) => request(`/access/${id}`, { method: 'DELETE' }),

  // Unidades & Moradores
  getUnits: () => request('/units'),
  getUnit: (id) => request(`/units/${id}`),
  createUnit: (data) => request('/units', { method: 'POST', body: JSON.stringify(data) }),
  updateUnit: (id, data) => request(`/units/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUnit: (id) => request(`/units/${id}`, { method: 'DELETE' }),
  getResidents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/residents${qs ? '?' + qs : ''}`);
  },
  createResident: (data) => request('/residents', { method: 'POST', body: JSON.stringify(data) }),
  updateResident: (id, data) => request(`/residents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteResident: (id) => request(`/residents/${id}`, { method: 'DELETE' }),
  getVehicles: () => request('/vehicles'),
  getVehicle: (id) => request(`/vehicles/${id}`),
  createVehicle: (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  getPets: () => request('/pets'),

  // Reservas
  getSpaces: () => request('/spaces'),
  getReservations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reservations${qs ? '?' + qs : ''}`);
  },
  createReservation: (data) => request('/reservations', { method: 'POST', body: JSON.stringify(data) }),
  cancelReservation: (id) => request(`/reservations/${id}/cancel`, { method: 'PATCH' }),

  // Financeiro
  getFinancialSummary: () => request('/financial/summary'),
  getFinancialTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/financial/transactions${qs ? '?' + qs : ''}`);
  },
  createFinancialTransaction: (data) => request('/financial/transactions', { method: 'POST', body: JSON.stringify(data) }),
  payFinancialTransaction: (id) => request(`/financial/transactions/${id}/pay`, { method: 'PATCH' }),

  // Comunicados
  getAnnouncements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/announcements${qs ? '?' + qs : ''}`);
  },
  createAnnouncement: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),

  // Mercadinho
  getMarketProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/market/products${qs ? '?' + qs : ''}`);
  },
  createMarketProduct: (data) => request('/market/products', { method: 'POST', body: JSON.stringify(data) }),
  updateMarketStock: (id, data) => request(`/market/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify(data) }),
  checkoutMarket: (data) => request('/market/checkout', { method: 'POST', body: JSON.stringify(data) }),
  getMarketSales: () => request('/market/sales'),

  // Configuração LPS
  getFeatures: () => request('/config/features'),
  updateFeature: (feature, enabled) => request('/config/features', { method: 'PATCH', body: JSON.stringify({ feature, enabled }) }),

  // Contexto Multi-Tenant
  setActiveCondominiumId,
  getActiveCondominiumId
};
