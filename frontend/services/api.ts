import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl, LoginEndpoints } from '../constants/endpoint';

const api = axios.create({
  baseURL: baseUrl,
});

// Request Interceptor: Attach the access token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response, // If request is successful, just return it
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        
        // Call your backend proxy refresh endpoint
        const { data } = await axios.post(LoginEndpoints.refreshToken, {
          refreshToken,
        });

        // Store new tokens
        await AsyncStorage.setItem('access_token', data.accessToken);
        await AsyncStorage.setItem('refresh_token', data.refreshToken);

        // Update the header and retry the original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is also expired -> Force logout
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        // Redirect to Login here (e.g., via navigation reference)
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// frontend/services/api.ts

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Log the details before the request is sent
    console.log('--- [API REQUEST START] ---');
    console.log(`Method: ${config.method?.toUpperCase()}`);
    console.log(`URL: ${config.url}`);
    if (config.data) {
      console.log('Payload:', JSON.stringify(config.data, null, 2));
    }
    console.log('---------------------------');
    return config;
  },
  (error) => {
    console.error('!!! [API REQUEST ERROR] !!!', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    console.log('--- [API RESPONSE SUCCESS] ---');
    console.log(`Status: ${response.status}`);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('------------------------------');
    return response;
  },
  (error) => {
    console.log('--- [API RESPONSE ERROR] ---');
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.log(`Status: ${error.response.status}`);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received (Network Error)
      console.log('No response received. Possible Network/CORS issue.');
      console.log('Request Details:', error.request);
    } else {
      console.log('Error Message:', error.message);
    }
    console.log('----------------------------');
    return Promise.reject(error);
  }
);

export default api;