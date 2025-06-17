import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instances
const authService = axios.create({ baseURL: API_BASE_URL });
const fileService = axios.create({ baseURL: API_BASE_URL });
const shareService = axios.create({ baseURL: API_BASE_URL });

// Setup interceptors for token management
export const setupAxiosInterceptors = (setToken, setView) => {
  const addToken = (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  };

  const handleExpiredToken = (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      setToken(null);
      setView('login');
    }
    return Promise.reject(error);
  };

  // Add interceptors to all services
  [authService, fileService, shareService].forEach(service => {
    service.interceptors.request.use(addToken);
    service.interceptors.response.use(response => response, handleExpiredToken);
  });

  // Return cleanup function
  return () => {
    [authService, fileService, shareService].forEach(service => {
      service.interceptors.request.clear();
      service.interceptors.response.clear();
    });
  };
};

export { authService, fileService, shareService }; 
