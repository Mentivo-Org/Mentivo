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

export default api;