import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  authProvider: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isSignedIn: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  validateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isSignedIn: false,
      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isSignedIn: true });
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
        }
      },
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isSignedIn: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      },
      validateSession: async () => {
        try {
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) return;

          const { default: api } = await import('@/lib/api');
          const { AuthEndpoints } = await import('@/constants/endpoints');
          
          const { data } = await api.get(AuthEndpoints.whoAmI);
          
          if (data.user) {
            set({ user: data.user, isSignedIn: true });
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          // If 401, the interceptor in api.ts will handle it (attempt refresh or logout)
        }
      },
    }),
    {
      name: 'mentivo-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
