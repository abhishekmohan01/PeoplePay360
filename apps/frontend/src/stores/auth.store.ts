import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Temporary mock types until we build the backend
export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: (token, user) => set({ token, user }),
      
      logout: () => set({ token: null, user: null }),
      
      isAuthenticated: () => !!get().token && !!get().user,
      
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        return user.roles.includes(role) || user.roles.includes('Admin');
      },
    }),
    {
      name: 'pp360-auth',
    }
  )
);
