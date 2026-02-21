import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const registerUser = (data) => API.post('/auth/register', data);
export const changePassword = (data) => API.put('/auth/change-password', data);

// ─── Leads ────────────────────────────────────────────────────────────────────
export const getLeads = (params) => API.get('/leads', { params });
export const getKanban = () => API.get('/leads/kanban');
export const getLeadStats = () => API.get('/leads/stats');
export const getLead = (id) => API.get(`/leads/${id}`);
export const createLead = (data) => API.post('/leads', data);
export const updateLead = (id, data) => API.put(`/leads/${id}`, data);
export const deleteLead = (id) => API.delete(`/leads/${id}`);

// ─── Activities ───────────────────────────────────────────────────────────────
export const getActivities = (params) => API.get('/activities', { params });
export const createActivity = (data) => API.post('/activities', data);
export const deleteActivity = (id) => API.delete(`/activities/${id}`);

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const getTasks = (params) => API.get('/tasks', { params });
export const getCalendarTasks = (params) => API.get('/tasks/calendar', { params });
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// ─── Accounts ─────────────────────────────────────────────────────────────────
export const getAccounts = (params) => API.get('/accounts', { params });
export const getAllAccounts = () => API.get('/accounts/all');
export const createAccount = (data) => API.post('/accounts', data);
export const updateAccount = (id, data) => API.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => API.delete(`/accounts/${id}`);

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = () => API.get('/users');
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// ─── Payments ─────────────────────────────────────────────────────────────────
export const getPayments = (lead_id) => API.get('/payments', { params: { lead_id } });
export const createPayment = (data) => API.post('/payments', data);

// ─── Email Templates ──────────────────────────────────────────────────────────
export const getEmailTemplates = () => API.get('/email-templates');
export const createEmailTemplate = (data) => API.post('/email-templates', data);
export const deleteEmailTemplate = (id) => API.delete(`/email-templates/${id}`);

// ─── Email Triggers ───────────────────────────────────────────────────────────
export const getEmailTriggers = () => API.get('/email-triggers');
export const createEmailTrigger = (data) => API.post('/email-triggers', data);

export default API;
