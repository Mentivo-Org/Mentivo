import axios from 'axios';
import { storage } from './storage';
import { baseUrl, LoginEndpoints } from '../constants/endpoint';
import { socketManager } from './socketManager';

const api = axios.create({
  baseURL: baseUrl,
  timeout: 15000,
  headers: {
    'x-client-type': 'mobile'
  }
});

// Request Interceptor: Attach the access token to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (__DEV__) {
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
  }

  return config;
}, (error) => {
  console.error('!!! [API REQUEST ERROR] !!!', error);
  return Promise.reject(error);
});

// Shared in-flight refresh call so concurrent 401s trigger one refresh, not one each.
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

function refreshTokens(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { data } = await axios.post(LoginEndpoints.refreshToken, { refreshToken });
      await storage.setItem('accessToken', data.accessToken);
      await storage.setItem('refreshToken', data.refreshToken);
      socketManager.reconnectWithNewToken(data.accessToken);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Response Interceptor: Handle 401 errors and log responses
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API RESPONSE] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      if (error.response) {
        console.log(`[API RESPONSE ERROR] ${error.response.status} ${error.config?.url}`);
      } else if (error.request) {
        console.log('[API RESPONSE ERROR] No response received. Possible Network/CORS issue.');
      } else {
        console.log('[API RESPONSE ERROR]', error.message);
      }
    }

    const originalRequest = error.config;

    // Check if error is 401, we haven't retried yet, and it's not an auth route
    const isAuthRoute = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/signup');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute && error.response?.data?.error==="Invalid or expired token") {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) return Promise.reject(error);

        const data = await refreshTokens(refreshToken);

        // Update the header and retry the original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        // Refresh token is also expired or invalid -> Force logout
        await storage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
