// export const baseUrl = 'http://192.168.29.18:3000/api';
// export const baseUrl = 'https://dev.mentivo.in/api';
export const baseUrl = 'https://app.mentivo.in/api';

export const websiteUrl = baseUrl.includes('localhost')
  ? 'http://localhost:3001'
  : baseUrl.includes('192.168.')
    ? baseUrl.replace(':3000/api', ':3001')
    : 'https://www.mentivo.in';

export const AGORA_APP_ID = '1f1c2710de9a48bd88bc0470aa0204fc';
export const AGORA_CHAT_APP_KEY = '61200019669#200025201'
export const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.mentivo.in';

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
    completeProfileMentor: `${baseUrl}/auth/complete-profile/mentor`,
    updateProfile: `${baseUrl}/auth/profile`
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
    setStatus: `${baseUrl}/mentors/me/status`,
    getMeStats: `${baseUrl}/mentors/me/stats`,
    getPromotionConditions: `${baseUrl}/mentors/promotion-conditions`,
    updateProfile: `${baseUrl}/mentors/me/profile`,
    reapply: `${baseUrl}/mentors/me/reapply`,
}

export const WalletEndpoints = {
    getBalance: `${baseUrl}/wallet/balance`,
    topup: `${baseUrl}/wallet/topup`,
    confirm: `${baseUrl}/wallet/topup/confirm`
}

export const CallEndpoints = {
    initiate: `${baseUrl}/calls/initiate`,
    freeMatchmaking: `${baseUrl}/calls/free-matchmaking`,
    schedule: `${baseUrl}/calls/schedule`,
    getMentorSchedule: (id: string) => `${baseUrl}/calls/mentor/${id}/schedule`,
    getMentorSessions: `${baseUrl}/calls/mentor/sessions`,
    getStudentSchedule: `${baseUrl}/calls/student/schedule`,
    getStudentSessions: `${baseUrl}/calls/student/sessions`,
    getUpcoming: `${baseUrl}/calls/student/upcoming`,
    token: (id: string) => `${baseUrl}/calls/${id}/token`,
    start: (id: string) => `${baseUrl}/calls/${id}/start`,
    ringing: (id: string) => `${baseUrl}/calls/${id}/ringing`,
    heartbeat: (id: string) => `${baseUrl}/calls/${id}/heartbeat`,
    end: (id: string) => `${baseUrl}/calls/${id}/end`,
    reject: (id: string) => `${baseUrl}/calls/${id}/reject`,
    rate: (id: string) => `${baseUrl}/calls/${id}/rate`,
    status: (id: string) => `${baseUrl}/calls/${id}/status`,
}

export const NotificationEndpoints = {
    syncFcmToken: `${baseUrl}/auth/fcm-token`
}

export const ProfilePictureEndpoints = {
    uploadProfilePicture: `${baseUrl}/profile-picture`
}

export const ChatEndpoints = {
    getSessions: `${baseUrl}/chat/sessions`,
    createSession: `${baseUrl}/chat/sessions`,
    getMessages: (sessionId: string) => `${baseUrl}/chat/sessions/${sessionId}/messages`,
    getToken: `${baseUrl}/chat/token`,
    markRead: (sessionId: string) => `${baseUrl}/chat/sessions/${sessionId}/read`,
    linkCall: (sessionId: string) => `${baseUrl}/chat/sessions/${sessionId}/link-call`,
}

export const AskEndpoints = {
    config: `${baseUrl}/ask/config`,
    questions: `${baseUrl}/ask/questions`,
    questionById: (id: string) => `${baseUrl}/ask/questions/${id}`,
    postAnswer: (questionId: string) => `${baseUrl}/ask/questions/${questionId}/answers`,
    voteAnswer: (answerId: string) => `${baseUrl}/ask/answers/${answerId}/vote`,
}

export const PartnerEndpoints = {
    validate: `${baseUrl}/partners/validate`
}

export const VersionEndpoint = {
    check: `${baseUrl}/config/version`
}