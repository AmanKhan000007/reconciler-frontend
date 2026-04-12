const BASE = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '/api');

const getToken = () => localStorage.getItem('rec_token');

async function req(method, path, body, isFormData = false) {
  if (!BASE) {
    throw new Error('Backend API URL is not configured. Set VITE_API_URL in the frontend environment.');
  }

  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Unable to connect to backend API at ${BASE}: ${err.message}`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const login    = (email, password) => req('POST', '/auth/login', { email, password });
export const register = (name, email, password) => req('POST', '/auth/register', { name, email, password });
export const getMe    = () => req('GET', '/auth/me');
export const updateProfile  = (data) => req('PUT', '/auth/profile', data);
export const changePassword = (currentPassword, newPassword) => req('PUT', '/auth/password', { currentPassword, newPassword });

// ── Transactions ──────────────────────────────────────────────
export const getTransactions = (params = {}) => {
  const clean = Object.fromEntries(
  Object.entries(params).filter(([_, v]) => v !== undefined)
);
const q = new URLSearchParams(clean).toString();
  return req('GET', `/transactions${q ? '?' + q : ''}`);
};
export const createTransaction = (data) => req('POST', '/transactions', data);
export const deleteTransaction = (id)   => req('DELETE', `/transactions/${id}`);
export const updateTransaction = (id, data) => req('PATCH', `/transactions/${id}`, data);
export const importCSV = (file, source) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('source', source);
  return req('POST', '/transactions/import', fd, true);
};
export const reconcile  = () => req('POST', '/transactions/reconcile');
export const getLedger  = (source) => req('GET', `/transactions/ledger?source=${source}`);
export const getSummary = () => req('GET', '/transactions/summary');

// ── Tickets ───────────────────────────────────────────────────
export const getTickets    = () => req('GET', '/tickets');
export const createTicket  = (data) => req('POST', '/tickets', data);
export const getTicket     = (id)   => req('GET', `/tickets/${id}`);
export const updateTicket  = (id, data) => req('PATCH', `/tickets/${id}`, data);
export const deleteTicket  = (id)   => req('DELETE', `/tickets/${id}`);

// ── Admin ─────────────────────────────────────────────────────
export const getAdminUsers    = () => req('GET', '/admin/users');
export const getAdminUser     = (id) => req('GET', `/admin/users/${id}`);
export const updateAdminUser  = (id, data) => req('PATCH', `/admin/users/${id}`, data);
export const deleteAdminUser  = (id) => req('DELETE', `/admin/users/${id}`);
export const getAdminAnalytics = () => req('GET', '/admin/analytics');
export const getMonitoring    = () => req('GET', '/admin/monitoring');
export const getAuditLog      = (page = 1) => req('GET', `/admin/audit?page=${page}`);

// ── Team ──────────────────────────────────────────────────────
export const getTeamMembers  = () => req('GET', '/team');
export const inviteTeamMember = (email, role) => req('POST', '/team/invite', { email, role });
export const updateTeamMemberRole = (id, role) => req('PATCH', `/team/${id}`, { role });
export const removeTeamMember = (id) => req('DELETE', `/team/${id}`);