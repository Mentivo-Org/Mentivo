export const baseUrl = 'http://10.150.63.231:3000/api';
// export const baseUrl = 'https://api.mentivo.in/api';

export const LoginEndpoints = {
    googleLogin: `${baseUrl}/auth/google-native`,
    refreshToken: `${baseUrl}/auth/refresh`,
    login: `${baseUrl}/auth/login`,
    verifyOtp: `${baseUrl}/auth/otp/verify`,
}