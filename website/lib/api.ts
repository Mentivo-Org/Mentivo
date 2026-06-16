import axios from 'axios';
import { AuthEndpoints } from '../constants/endpoints';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

// Request Interceptor: Attach the access token if stored in localStorage and resolve API URL dynamically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      let dynamicBaseUrl = 'https://app.mentivo.in/api';
      
      // If we are developing locally or on a local network IP, point to the respective local port 3000
      if (
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.')
      ) {
        dynamicBaseUrl = `${protocol}//${hostname}:3000/api`;
      }
      
      config.baseURL = process.env.NEXT_PUBLIC_API_URL || dynamicBaseUrl;

      // If config.url is an absolute URL pointing to localhost:3000 or 127.0.0.1:3000, 
      // rewrite it dynamically to match the current location hostname.
      // This is because Axios ignores config.baseURL when passed an absolute URL.
      if (config.url) {
        if (config.url.startsWith('http://localhost:3000/api')) {
          config.url = config.url.replace('http://localhost:3000/api', config.baseURL);
        } else if (config.url.startsWith('http://127.0.0.1:3000/api')) {
          config.url = config.url.replace('http://127.0.0.1:3000/api', config.baseURL);
        }
      }

      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 errors and log responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401, we haven't retried yet, and it's not an auth route
    const isAuthRoute = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/signup');
    const errorMessage = error.response?.data?.error?.toLowerCase() || '';
    const isNoTokenError = errorMessage.includes('no token provided');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute && !isNoTokenError) {
      originalRequest._retry = true;

      try {
        const localRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        
        if (localRefreshToken) {
          // Mobile/local token refresh - resolve URL dynamically to prevent localhost network error
          const { protocol, hostname } = window.location;
          let refreshUrl = AuthEndpoints.refreshToken;
          if (
            hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') || 
            hostname.startsWith('10.') || 
            hostname.startsWith('172.')
          ) {
            refreshUrl = `${protocol}//${hostname}:3000/api/auth/refresh`;
          }
          const response = await axios.post(process.env.NEXT_PUBLIC_API_URL ? AuthEndpoints.refreshToken : refreshUrl, { refreshToken: localRefreshToken });
          if (response.data?.accessToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } else {
          // Standard web cookie refresh - resolve URL dynamically to prevent localhost network error
          const { protocol, hostname } = window.location;
          let refreshUrl = AuthEndpoints.refreshToken;
          if (
            hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') || 
            hostname.startsWith('10.') || 
            hostname.startsWith('172.')
          ) {
            refreshUrl = `${protocol}//${hostname}:3000/api/auth/refresh`;
          }
          await axios.post(process.env.NEXT_PUBLIC_API_URL ? AuthEndpoints.refreshToken : refreshUrl, {}, { withCredentials: true });
        }

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        if (typeof window !== 'undefined') {
          // Prevent infinite redirect loop if already on a guest path
          const guestPaths = ['/', '/login', '/signup', '/verify-otp'];
          if (!guestPaths.includes(window.location.pathname)) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
