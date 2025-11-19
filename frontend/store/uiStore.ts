import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  selectedWarehouseId: string | null;
  selectedCompanyId: string | null;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSelectedWarehouse: (id: string) => void;
  setSelectedCompany: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      selectedWarehouseId: null,
      selectedCompanyId: null,

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },

      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        }));
      },

      setSelectedWarehouse: (id: string) => {
        set({ selectedWarehouseId: id });
      },

      setSelectedCompany: (id: string) => {
        set({ selectedCompanyId: id });
      },
    }),
    {
      name: 'wms-ui-storage',
    }
  )
);
