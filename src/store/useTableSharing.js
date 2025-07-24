import { create } from 'zustand';
import apiService from '../services/api';
import socketService from '../services/socket';

const useTableSharing = create((set, get) => ({
  // State
  currentSession: null,
  isHost: false,
  customerName: '',
  customers: [],
  sessionOrders: [],
  isConnected: false,
  isLoading: false,
  error: null,

  // Actions
  setCustomerName: (name) => {
    set({ customerName: name });
    localStorage.setItem('customerName', name);
  },

  // Create a new table session (host)
  createSession: async (tableNumber, hostName, sessionName = null) => {
    set({ isLoading: true, error: null });
    
    try {
      const session = await apiService.createTableSession(tableNumber, hostName, sessionName);
      
      // Connect to socket and join session
      socketService.connect();
      socketService.joinSession(session.sessionId);
      
      // Emit that customer joined
      socketService.emitCustomerJoined(session.sessionId, hostName);
      
      set({
        currentSession: session,
        isHost: true,
        customerName: hostName,
        isConnected: true,
        isLoading: false
      });
      
      // Store in localStorage for persistence
      localStorage.setItem('currentSession', JSON.stringify(session));
      localStorage.setItem('isHost', 'true');
      localStorage.setItem('customerName', hostName);
      
      // Set up socket listeners
      get().setupSocketListeners();
      
      // Load session details
      await get().loadSessionDetails(session.sessionId);
      
      return session;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Join an existing table session
  joinSession: async (sessionId, customerName) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await apiService.joinTableSession(sessionId, customerName);
      
      // Connect to socket and join session
      socketService.connect();
      socketService.joinSession(sessionId);
      
      // Emit that customer joined
      socketService.emitCustomerJoined(sessionId, customerName);
      
      const session = {
        sessionId: result.sessionId,
        tableNumber: result.tableNumber,
        sessionName: result.sessionName,
        hostName: null // Will be loaded from session details
      };
      
      set({
        currentSession: session,
        isHost: false,
        customerName: customerName,
        isConnected: true,
        isLoading: false
      });
      
      // Store in localStorage for persistence
      localStorage.setItem('currentSession', JSON.stringify(session));
      localStorage.setItem('isHost', 'false');
      localStorage.setItem('customerName', customerName);
      
      // Set up socket listeners
      get().setupSocketListeners();
      
      // Load session details
      await get().loadSessionDetails(sessionId);
      
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Load session details and customers
  loadSessionDetails: async (sessionId) => {
    try {
      const details = await apiService.getSessionDetails(sessionId);
      const orders = await apiService.getSessionOrders(sessionId);
      
      set({
        customers: details.customers || [],
        sessionOrders: orders || [],
        currentSession: {
          ...get().currentSession,
          hostName: details.host_name,
          sessionName: details.session_name,
          tableNumber: details.table_number
        }
      });
    } catch (error) {
      console.error('Failed to load session details:', error);
      set({ error: error.message });
    }
  },

  // Leave current session
  leaveSession: () => {
    const { currentSession } = get();
    
    if (currentSession) {
      socketService.leaveSession(currentSession.sessionId);
      socketService.disconnect();
    }
    
    // Clear localStorage
    localStorage.removeItem('currentSession');
    localStorage.removeItem('isHost');
    localStorage.removeItem('customerName');
    
    set({
      currentSession: null,
      isHost: false,
      customerName: '',
      customers: [],
      sessionOrders: [],
      isConnected: false,
      error: null
    });
  },

  // End session (host only)
  endSession: async () => {
    const { currentSession, customerName, isHost } = get();
    
    if (!currentSession || !isHost) {
      throw new Error('Only the host can end the session');
    }
    
    try {
      await apiService.endTableSession(currentSession.sessionId, customerName);
      get().leaveSession();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Place an order
  placeOrder: async (items, notes = null) => {
    const { currentSession, customerName } = get();
    
    if (!currentSession || !customerName) {
      throw new Error('Must be in a session to place order');
    }
    
    try {
      const order = await apiService.createOrder(
        currentSession.sessionId,
        customerName,
        items,
        notes
      );
      
      // Emit new order to other users
      socketService.emitNewOrder(currentSession.sessionId, order);
      
      // Refresh session orders
      await get().loadSessionDetails(currentSession.sessionId);
      
      return order;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Share cart with other users
  shareCart: (cartItems) => {
    const { currentSession, customerName } = get();
    
    if (!currentSession || !customerName) return;
    
    socketService.shareCart(currentSession.sessionId, customerName, cartItems);
  },

  // Setup socket event listeners
  setupSocketListeners: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    // User joined session
    socketService.onUserJoined((data) => {
      console.log('User joined:', data);
    });

    // User left session
    socketService.onUserLeft((data) => {
      console.log('User left:', data);
    });

    // New customer joined
    socketService.onNewCustomer((data) => {
      console.log('New customer joined:', data.customerName);
      // Refresh session details to get updated customer list
      get().loadSessionDetails(currentSession.sessionId);
    });

    // New order placed
    socketService.onOrderPlaced((data) => {
      console.log('New order placed:', data.order);
      // Refresh session orders
      get().loadSessionDetails(currentSession.sessionId);
    });

    // Order status changed
    socketService.onOrderStatusChanged((data) => {
      console.log('Order status changed:', data);
      // Refresh session orders
      get().loadSessionDetails(currentSession.sessionId);
    });

    // Cart shared
    socketService.onCartShared((data) => {
      console.log('Cart shared by:', data.customerName, data.cartItems);
      // You could show a notification or update UI here
    });
  },

  // Restore session from localStorage
  restoreSession: async () => {
    const savedSession = localStorage.getItem('currentSession');
    const savedIsHost = localStorage.getItem('isHost') === 'true';
    const savedCustomerName = localStorage.getItem('customerName');
    
    if (savedSession && savedCustomerName) {
      try {
        const session = JSON.parse(savedSession);
        
        // Verify session is still active
        const details = await apiService.getSessionDetails(session.sessionId);
        
        if (details && details.is_active) {
          // Reconnect to socket
          socketService.connect();
          socketService.joinSession(session.sessionId);
          
          set({
            currentSession: session,
            isHost: savedIsHost,
            customerName: savedCustomerName,
            isConnected: true
          });
          
          // Set up listeners and load details
          get().setupSocketListeners();
          await get().loadSessionDetails(session.sessionId);
          
          return true;
        } else {
          // Session expired, clear storage
          get().leaveSession();
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        get().leaveSession();
      }
    }
    
    return false;
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useTableSharing;
