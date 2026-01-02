import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['X-API-Key'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const apiService = {
  // Authentication
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Dashboard
  getDashboardStats: (params) => api.get('/stats/dashboard', { params }),
  getAlerts: (params) => api.get('/stats/alerts', { params }),
  
  // Batches
  getBatches: (params) => api.get('/batches', { params }),
  getBatch: (batchId) => api.get(`/batches/${batchId}`),
  createBatch: (data) => api.post('/batches', data),
  updateBatch: (batchId, data) => api.put(`/batches/${batchId}`, data),
  revokeBatch: (batchId, reason) => api.post(`/batches/${batchId}/revoke`, { reason }),
  getBatchStats: (batchId) => api.get(`/batches/${batchId}/stats`),
  
  // Verification
  getVerificationHistory: (params) => api.get('/stats', { params }),
  generateCodes: (data) => api.post('/verify/generate', data),
  
  // Settings
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export { api };