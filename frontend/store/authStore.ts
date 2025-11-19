import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Mock authentication - replace with real API call
          await new Promise(resolve => setTimeout(resolve, 500));

          // Determine role based on email
          let role: User['role'] = 'admin';
          let name = 'Admin User';

          if (email.includes('manager')) {
            role = 'manager';
            name = 'Warehouse Manager';
          } else if (email.includes('staff')) {
            role = 'warehouse_staff';
            name = 'Warehouse Staff';
          } else if (email.includes('picker')) {
            role = 'picker';
            name = 'Picker User';
          } else if (email.includes('packer')) {
            role = 'packer';
            name = 'Packer User';
          }

          const mockUser: User = {
            id: '1',
            email,
            name,
            role,
            companyId: 'company-1',
            status: 'active',
            permissions: role === 'admin' ? ['*'] : [],
            createdAt: new Date().toISOString(),
          };

          const mockToken = 'mock-jwt-token-' + Date.now();

          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string) => {
        set({ token });
      },
    }),
    {
      name: 'wms-auth-storage',
    }
  )
);
