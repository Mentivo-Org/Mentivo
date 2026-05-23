import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl, LoginEndpoints } from '../constants/endpoint';

const api = axios.create({
  baseURL: baseUrl,
});

// Request Interceptor: Attach the access token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log request details
  console.log('--- [API REQUEST START] ---');
  console.log(`Method: ${config.method?.toUpperCase()}`);
  console.log(`URL: ${config.url}`);
  if(config.headers) {
    console.log('Headers: ', JSON.stringify(config.headers, null, 2))
  }
  if (config.data) {
    console.log('Payload:', JSON.stringify(config.data, null, 2));
  }
  console.log('---------------------------');
  
  return config;
}, (error) => {
  console.error('!!! [API REQUEST ERROR] !!!', error);
  return Promise.reject(error);
});

// Response Interceptor: Handle 401 errors and log responses
api.interceptors.response.use(
  (response) => {
    console.log('--- [API RESPONSE SUCCESS] ---');
    console.log(`Status: ${response.status}`);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('------------------------------');
    return response;
  },
  async (error) => {
    console.log('--- [API RESPONSE ERROR] ---');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received. Possible Network/CORS issue.');
    } else {
      console.log('Error Message:', error.message);
    }
    console.log('----------------------------');

    const originalRequest = error.config;

    // Check if error is 401, we haven't retried yet, and it's not an auth route
    const isAuthRoute = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/signup');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) return;
        
        // Call backend refresh endpoint
        const { data } = await axios.post(LoginEndpoints.refreshToken, {
          refreshToken,
        });

        // Store new tokens
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);

        // Update the header and retry the original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        // Refresh token is also expired or invalid -> Force logout
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
