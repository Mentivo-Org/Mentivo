// website/constants/endpoints.ts

export const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const AuthEndpoints = {
    signup: `${baseUrl}/auth/signup`,
    login: `${baseUrl}/auth/login`,
    verifyOtp: `${baseUrl}/auth/otp/verify`,
    googleLogin: `${baseUrl}/auth/google-native`,
    refreshToken: `${baseUrl}/auth/refresh`,
};

export const HealthEndpoints = {
    health: `${baseUrl}/health`,
};
