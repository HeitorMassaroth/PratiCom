const BASE_URL = '/api';

export function getActiveCondoId() {
  return localStorage.getItem('praticom_active_condo') || '1';
}

export function setActiveCondoId(id) {
  localStorage.setItem('praticom_active_condo', String(id));
  window.dispatchEvent(new Event('condo-changed'));
}

async function request(endpoint, options = {}) {
  const condoId = getActiveCondoId();
  const headers = {
    'Content-Type': 'application/json',
    'X-Condominium-Id': condoId,
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Erro HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

export default api;
