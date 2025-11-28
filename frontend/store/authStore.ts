import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

// Ensure API URL always ends with /api for correct routing
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wms-api.alexandratechlab.com';
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.replace('/api', '') : rawApiUrl;

// Demo users for client-side authentication (when backend is not available)
const DEMO_USERS = [
  // Database users (matches backend database)
  { id: 'super-admin-001', email: 'admin@kiaan-wms.com', password: 'Admin@123', name: 'Super Administrator', role: 'super_admin', companyId: 'demo-company' },
  { id: 'company-admin-001', email: 'companyadmin@kiaan-wms.com', password: 'Admin@123', name: 'Company Administrator', role: 'company_admin', companyId: 'demo-company' },
  { id: 'picker-001', email: 'picker@kiaan-wms.com', password: 'Admin@123', name: 'Picker User', role: 'picker', companyId: 'demo-company' },
  { id: 'viewer-001', email: 'viewer@kiaan-wms.com', password: 'Admin@123', name: 'Viewer User', role: 'viewer', companyId: 'demo-company' },
  { id: 'warehouse-manager-001', email: 'warehousemanager@kiaan-wms.com', password: 'Admin@123', name: 'Warehouse Manager', role: 'warehouse_manager', companyId: 'demo-company' },
  { id: 'inventory-manager-001', email: 'inventorymanager@kiaan-wms.com', password: 'Admin@123', name: 'Inventory Manager', role: 'inventory_manager', companyId: 'demo-company' },
  // Quick demo access
  { id: 'demo-1', email: 'demo@kiaan.com', password: 'demo123', name: 'Demo User', role: 'super_admin', companyId: 'demo-company' },
  { id: 'demo-2', email: 'admin', password: 'admin', name: 'Quick Admin', role: 'super_admin', companyId: 'demo-company' },
];

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearError: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Try backend API FIRST (production mode)
          try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Login failed');
            }

            // Transform user data to match frontend type
            const user: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role.toLowerCase().replace('_', '_'),
              companyId: data.user.companyId || '',
              status: data.user.isActive ? 'active' : 'inactive',
              permissions: [],
              createdAt: data.user.createdAt,
            };

            set({
              user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            console.log('✅ Backend authentication successful:', user.email);
            return;
          } catch (backendError: any) {
            // Backend not available or failed, try demo users as fallback
            console.log('Backend auth failed, trying demo mode...');
          }

          // Fallback: Try demo user authentication (when backend is not available)
          const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);

          if (demoUser) {
            // Client-side demo authentication successful
            const user: User = {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name,
              role: demoUser.role,
              companyId: demoUser.companyId,
              status: 'active',
              permissions: [],
              createdAt: new Date().toISOString(),
            };

            const token = `demo_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            console.log('✅ Demo authentication successful:', user.email);
            return;
          }

          // Neither backend nor demo worked
          throw new Error('Invalid email or password');
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed'
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          // For demo purposes, create a new user client-side
          const newUser: User = {
            id: `demo_${Date.now()}`,
            email,
            name,
            role: 'viewer', // Default role for new registrations
            companyId: 'demo-company',
            status: 'active',
            permissions: [],
            createdAt: new Date().toISOString(),
          };

          const token = `demo_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;

          set({
            user: newUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log('✅ Demo registration successful:', newUser.email);
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Registration failed'
          });
          throw error;
        }
      },

      logout: async () => {
        const { token } = get();

        try {
          // Only call backend logout if using a real (non-demo) token
          if (token && !token.startsWith('demo_token_')) {
            await fetch(`${API_URL}/api/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state regardless of API call success
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
          console.log('✅ Logout successful');
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string) => {
        set({ token });
      },

      clearError: () => {
        set({ error: null });
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'wms-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
