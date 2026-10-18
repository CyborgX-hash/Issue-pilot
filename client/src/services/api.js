const DEFAULT_RENDER_BACKEND_URL = 'https://issue-pilot.onrender.com';

export function getBackendUrl() {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }
  return (
    localStorage.getItem('issuepilot_backend_url') || DEFAULT_RENDER_BACKEND_URL
  ).replace(/\/+$/, '');
}

export function setBackendUrl(url) {
  const cleaned = (url || '').trim().replace(/\/+$/, '');
  if (cleaned) {
    localStorage.setItem('issuepilot_backend_url', cleaned);
  } else {
    localStorage.removeItem('issuepilot_backend_url');
  }
  return cleaned;
}

async function request(endpoint, options = {}) {
  const base = getBackendUrl();
  const url = `${base}${endpoint}`;
  const token = localStorage.getItem('issuepilot_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(
      `Received HTML instead of JSON from ${url}. Your frontend is not connected to the Render backend.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `HTTP error ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.details = data?.error?.details || null;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  getMe: () => request('/api/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getAuthUrl: () => request('/api/auth/github?format=json'),

  // GitHub Installations
  getInstallations: () => request('/api/github/installations'),
  getInstallationRepositories: (id) => request(`/api/github/installations/${id}/repositories`),
  syncInstallation: (id) => request(`/api/github/installations/${id}/sync`, { method: 'POST' }),
  linkInstallation: (installation_id) => request('/api/github/installations/link', {
    method: 'POST',
    body: JSON.stringify({ installation_id }),
  }),

  // Repositories
  getRepositories: () => request('/api/repositories'),
  getRepository: (id) => request(`/api/repositories/${id}`),
  getRepositoryIssues: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/repositories/${id}/issues${query ? `?${query}` : ''}`);
  },
  syncRepository: (id) => request(`/api/repositories/${id}/sync`, { method: 'POST' }),
  getRepositoryStats: (id) => request(`/api/repositories/${id}/stats`),
  batchAnalyzeRepository: (id, maxIssues = 10) => request(`/api/repositories/${id}/analyze`, {
    method: 'POST',
    body: JSON.stringify({ maxIssues }),
  }),

  // Issues & Analysis
  getIssue: (id) => request(`/api/issues/${id}`),
  analyzeIssue: (id) => request(`/api/issues/${id}/analyze`, { method: 'POST' }),
  getIssueAnalysis: (id) => request(`/api/issues/${id}/analysis`),
  getIssueDuplicates: (id, threshold = 0.50) => request(`/api/issues/${id}/duplicates?threshold=${threshold}`),

  // Triage Review Queue
  getTriageActions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/triage/actions${query ? `?${query}` : ''}`);
  },
  approveTriageAction: (id, proposedPayload) => request(`/api/triage/actions/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ proposedPayload }),
  }),
  rejectTriageAction: (id) => request(`/api/triage/actions/${id}/reject`, { method: 'POST' }),
  applyTriageAction: (id) => request(`/api/triage/actions/${id}/apply`, { method: 'POST' }),

  // Health
  getHealth: () => request('/api/health'),
};
