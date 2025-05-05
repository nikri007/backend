import axios from 'axios';
import { getToken } from '../utils/auth';

// Base axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Request interceptor to add auth token to all requests
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    // Only redirect on 401/403 errors and only if they're not from the auth endpoints
    if (error.response && 
        (error.response.status === 401 || error.response.status === 403) && 
        !error.config.url.includes('/auth/')) {
      console.error('Authentication error:', error.response.data);
      // Don't automatically redirect - let the component handle it
      // This prevents redirect loops
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (userData) => {
    // For multipart/form-data (when uploading profile picture)
    if (userData instanceof FormData) {
      return await api.post('/auth/register', userData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    // For regular JSON data
    return await api.post('/auth/register', userData);
  },
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  }
};

// Contact services
export const contactService = {
  create: async (contactData) => {
    return await api.post('/contacts/', contactData);
  },
  getAll: async (page = 1, perPage = 10, search = '') => {
    const params = new URLSearchParams({
      page,
      per_page: perPage,
      search
    });
    return await api.get(`/contacts/?${params.toString()}`);
  },
  getById: async (id) => {
    return await api.get(`/contacts/${id}`);
  },
  update: async (id, contactData) => {
    return await api.put(`/contacts/${id}`, contactData);
  },
  delete: async (id) => {
    return await api.delete(`/contacts/${id}`);
  }
};