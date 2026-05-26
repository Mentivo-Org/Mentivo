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
  isSignedIn: boolean;
  setAuth: (user: User) => void;
  logout: () => Promise<void>;
  validateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isSignedIn: false,
      setAuth: (user) => {
        set({ user, isSignedIn: true });
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
      },
      logout: async () => {
        const { default: api } = await import('@/lib/api');
        const { AuthEndpoints } = await import('@/constants/endpoints');
        try {
          await api.post(`${AuthEndpoints.login.replace('/login', '/logout')}`);
        } catch (e) {
          console.error('Logout API failed', e);
        }

        set({ user: null, isSignedIn: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
        }
      },
      validateSession: async () => {
        try {
          const { default: api } = await import('@/lib/api');
          const { AuthEndpoints } = await import('@/constants/endpoints');
          
          const { data } = await api.get(AuthEndpoints.whoAmI, { 
            // @ts-ignore
            skipLoader: true 
          });
          
          if (data.user) {
            set({ user: data.user, isSignedIn: true });
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          set({ user: null, isSignedIn: false });
        }
      },
    }),
    {
      name: 'mentivo-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
