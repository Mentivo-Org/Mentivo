// website/constants/endpoints.ts

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const AuthEndpoints = {
    signup: `${baseUrl}/auth/signup`,
    login: `${baseUrl}/auth/login`,
    verifyOtp: `${baseUrl}/auth/otp/verify`,
    googleLogin: `${baseUrl}/auth/google-native`,
    refreshToken: `${baseUrl}/auth/refresh`,
    whoAmI: `${baseUrl}/auth/whoami`,
};

const HealthEndpoints = {
    health: `${baseUrl}/health`,
};
