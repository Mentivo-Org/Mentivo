// export const baseUrl = 'http://10.150.63.231:3000/api';
export const baseUrl = 'http://192.168.29.18:3000/api';
// export const baseUrl = 'https://api.mentivo.in/api';

export const LoginEndpoints = {
    whoAmI: `${baseUrl}/auth/whoami`,
    googleLogin: `${baseUrl}/auth/google-native`,
    refreshToken: `${baseUrl}/auth/refresh`,
    login: `${baseUrl}/auth/login`,
    signup: `${baseUrl}/auth/signup`,
    resendOtp: `${baseUrl}/auth/otp/resend`,
    verifyOtp: `${baseUrl}/auth/otp/verify`,
    getIIT: `${baseUrl}/auth/get-iit`,
    completeProfileStudent: `${baseUrl}/auth/complete-profile/student`,
    completeProfileMentor: `${baseUrl}/auth/complete-profile/mentor`
}

export const ForgotPassEndpoints = {
    forgotPass: `${baseUrl}/auth/forgot-password`,
    verifyOtp: `${baseUrl}/auth/verify-forgot-password`,
    resetPass: `${baseUrl}/auth/reset-password`
}

export const MentorEndpoints = {
    getAllMentors: `${baseUrl}/mentors`,
    getMentorsPaginated: `${baseUrl}/mentors/paginated`,
    getOnlineCount: `${baseUrl}/mentors/count/online`,
    searchMentors: `${baseUrl}/mentors/search`,
    getFavoriteMentors: `${baseUrl}/mentors/favorites`,
    toggleFavoriteMentor: `${baseUrl}/mentors/`, // append :id/favorite
    getMentorById: `${baseUrl}/mentors/`, // append id
    heartbeat: `${baseUrl}/mentors/me/heartbeat`
}

export const WalletEndpoints = {
    getBalance: `${baseUrl}/wallet/balance`,
    topup: `${baseUrl}/wallet/topup`,
    confirm: `${baseUrl}/wallet/topup/confirm`
}

export const CallEndpoints = {
    initiate: `${baseUrl}/calls/initiate`,
    schedule: `${baseUrl}/calls/schedule`,
    getStudentSessions: `${baseUrl}/calls/student/sessions`,
    getUpcoming: `${baseUrl}/calls/student/upcoming`,
    start: (id: string) => `${baseUrl}/calls/${id}/start`,
    heartbeat: (id: string) => `${baseUrl}/calls/${id}/heartbeat`,
    end: (id: string) => `${baseUrl}/calls/${id}/end`,
    rate: (id: string) => `${baseUrl}/calls/${id}/rate`,
}