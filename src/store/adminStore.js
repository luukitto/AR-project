import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE_URL = 'http://localhost:3001/api';

export const useAdminStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,
      
      // Dashboard data
      dashboardStats: null,
      recentOrders: [],
      menuItems: [],
      tables: [],
      orders: [],
      
      // Loading states
      loading: {
        auth: false,
        dashboard: false,
        menu: false,
        tables: false,
        orders: false,
      },

      // Auth actions
      login: async (username, password) => {
        set(state => ({ loading: { ...state.loading, auth: true } }));
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            loading: { ...get().loading, auth: false }
          });

          return data;
        } catch (error) {
          set(state => ({ loading: { ...state.loading, auth: false } }));
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          dashboardStats: null,
          recentOrders: [],
          menuItems: [],
          tables: [],
          orders: [],
        });
      },

      // API helper with auth
      apiCall: async (endpoint, options = {}) => {
        const { token } = get();
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
        });

        if (response.status === 401) {
          get().logout();
          throw new Error('Session expired');
        }

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Request failed');
        }

        return response.json();
      },

      // Dashboard actions
      fetchDashboardStats: async () => {
        set(state => ({ loading: { ...state.loading, dashboard: true } }));
        
        try {
          const stats = await get().apiCall('/admin/dashboard/stats');
          const recentOrders = await get().apiCall('/admin/dashboard/recent-orders?limit=5');
          
          set({
            dashboardStats: stats,
            recentOrders: recentOrders,
            loading: { ...get().loading, dashboard: false }
          });
        } catch (error) {
          set(state => ({ loading: { ...state.loading, dashboard: false } }));
          throw error;
        }
      },

      // Menu management actions
      fetchMenuItems: async () => {
        set(state => ({ loading: { ...state.loading, menu: true } }));
        
        try {
          const menuItems = await get().apiCall('/admin/menu');
          set({
            menuItems,
            loading: { ...get().loading, menu: false }
          });
        } catch (error) {
          set(state => ({ loading: { ...state.loading, menu: false } }));
          throw error;
        }
      },

      createMenuItem: async (itemData) => {
        const newItem = await get().apiCall('/admin/menu', {
          method: 'POST',
          body: JSON.stringify(itemData),
        });
        
        // Refresh menu items
        await get().fetchMenuItems();
        return newItem;
      },

      updateMenuItem: async (id, itemData) => {
        const updatedItem = await get().apiCall(`/admin/menu/${id}`, {
          method: 'PUT',
          body: JSON.stringify(itemData),
        });
        
        // Refresh menu items
        await get().fetchMenuItems();
        return updatedItem;
      },

      deleteMenuItem: async (id) => {
        await get().apiCall(`/admin/menu/${id}`, {
          method: 'DELETE',
        });
        
        // Refresh menu items
        await get().fetchMenuItems();
      },

      // Table management actions
      fetchTables: async () => {
        set(state => ({ loading: { ...state.loading, tables: true } }));
        
        try {
          const tables = await get().apiCall('/admin/tables');
          set({
            tables,
            loading: { ...get().loading, tables: false }
          });
        } catch (error) {
          set(state => ({ loading: { ...state.loading, tables: false } }));
          throw error;
        }
      },

      createTable: async (tableData) => {
        const newTable = await get().apiCall('/admin/tables', {
          method: 'POST',
          body: JSON.stringify(tableData),
        });
        
        // Refresh tables
        await get().fetchTables();
        return newTable;
      },

      updateTable: async (id, tableData) => {
        const updatedTable = await get().apiCall(`/admin/tables/${id}`, {
          method: 'PUT',
          body: JSON.stringify(tableData),
        });
        
        // Refresh tables
        await get().fetchTables();
        return updatedTable;
      },

      deleteTable: async (id) => {
        await get().apiCall(`/admin/tables/${id}`, {
          method: 'DELETE',
        });
        
        // Refresh tables
        await get().fetchTables();
      },

      // Order management actions
      fetchOrders: async (filters = {}) => {
        set(state => ({ loading: { ...state.loading, orders: true } }));
        
        try {
          const queryParams = new URLSearchParams(filters).toString();
          const orders = await get().apiCall(`/admin/orders?${queryParams}`);
          set({
            orders,
            loading: { ...get().loading, orders: false }
          });
        } catch (error) {
          set(state => ({ loading: { ...state.loading, orders: false } }));
          throw error;
        }
      },

      updateOrderStatus: async (orderId, status) => {
        await get().apiCall(`/admin/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        
        // Refresh orders
        await get().fetchOrders();
      },
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
