import axios from 'axios';
import { AuthEndpoints } from '../constants/endpoints';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

// Response Interceptor: Handle 401 errors and log responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401, we haven't retried yet, and it's not an auth route
    const isAuthRoute = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/signup');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        // Call backend refresh endpoint (no need to pass token, it's in the cookie)
        await axios.post(AuthEndpoints.refreshToken, {}, { withCredentials: true });

        // Retry the original request (browser will send the new cookie automatically)
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        if (typeof window !== 'undefined') {
          // Clear any local state if needed (handled by the app usually)
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
