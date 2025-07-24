import { io } from 'socket.io-client';
import notificationService from './notificationService';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentSessionId = null;
  }

  connect() {
    if (this.socket) return this.socket;

    this.socket = io('http://192.168.1.215:3001', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    // Set up automatic notification listeners
    this.setupNotificationListeners();

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentSessionId = null;
    }
  }

  // Join a table session
  joinSession(sessionId) {
    if (!this.socket) this.connect();
    
    if (this.currentSessionId && this.currentSessionId !== sessionId) {
      this.leaveSession(this.currentSessionId);
    }

    this.currentSessionId = sessionId;
    this.socket.emit('join-session', sessionId);
    console.log('Joined session:', sessionId);
  }

  // Leave a table session
  leaveSession(sessionId) {
    if (!this.socket) return;
    
    this.socket.emit('leave-session', sessionId);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    console.log('Left session:', sessionId);
  }

  // Emit new order to session
  emitNewOrder(sessionId, order) {
    if (!this.socket) return;
    
    this.socket.emit('new-order', { sessionId, order });
  }

  // Emit order status update
  emitOrderStatusUpdate(sessionId, orderId, status) {
    if (!this.socket) return;
    
    this.socket.emit('order-status-update', { sessionId, orderId, status });
  }

  // Share cart with other users
  shareCart(sessionId, customerName, cartItems) {
    if (!this.socket) return;
    
    this.socket.emit('share-cart', { sessionId, customerName, cartItems });
  }

  // Notify when customer joins
  emitCustomerJoined(sessionId, customerName) {
    if (!this.socket) return;
    
    this.socket.emit('customer-joined', { sessionId, customerName });
  }

  // Event listeners
  onUserJoined(callback) {
    if (!this.socket) this.connect();
    this.socket.on('user-joined', callback);
  }

  onUserLeft(callback) {
    if (!this.socket) this.connect();
    this.socket.on('user-left', callback);
  }

  onOrderPlaced(callback) {
    if (!this.socket) this.connect();
    this.socket.on('order-placed', callback);
  }

  onOrderStatusChanged(callback) {
    if (!this.socket) this.connect();
    this.socket.on('order-status-changed', callback);
  }

  onCartShared(callback) {
    if (!this.socket) this.connect();
    this.socket.on('cart-shared', callback);
  }

  onNewCustomer(callback) {
    if (!this.socket) this.connect();
    this.socket.on('new-customer', callback);
  }

  // Set up automatic notification listeners
  setupNotificationListeners() {
    if (!this.socket) return;

    // Order status changed notifications
    this.socket.on('order-status-changed', (data) => {
      console.log('Order status changed:', data);
      
      // Show notification based on status
      if (notificationService.getStatus().enabled) {
        notificationService.showOrderStatusNotification({
          id: data.orderId,
          status: data.status,
          ...data
        });
      }
    });

    // New order placed notifications
    this.socket.on('order-placed', (data) => {
      console.log('Order placed:', data);
      
      if (notificationService.getStatus().enabled) {
        notificationService.showOrderPlacedNotification({
          id: data.order.id,
          items: data.order.items,
          ...data.order
        });
      }
    });

    // Customer joined table notifications
    this.socket.on('new-customer', (data) => {
      console.log('New customer joined:', data);
      
      if (notificationService.getStatus().enabled) {
        notificationService.showCustomerJoinedNotification({
          name: data.customerName,
          ...data
        });
      }
    });

    // Cart shared notifications
    this.socket.on('cart-shared', (data) => {
      console.log('Cart shared:', data);
      
      if (notificationService.getStatus().enabled) {
        notificationService.showCartSharedNotification({
          customerName: data.customerName,
          items: data.cartItems,
          ...data
        });
      }
    });
  }

  // Enhanced event listeners with notification integration
  onOrderStatusChanged(callback) {
    if (!this.socket) this.connect();
    this.socket.on('order-status-changed', (data) => {
      // Call the provided callback
      if (callback) callback(data);
      
      // Also handle notifications automatically
      if (notificationService.getStatus().enabled) {
        notificationService.showOrderStatusNotification({
          id: data.orderId,
          status: data.status,
          ...data
        });
      }
    });
  }

  onOrderPlaced(callback) {
    if (!this.socket) this.connect();
    this.socket.on('order-placed', (data) => {
      // Call the provided callback
      if (callback) callback(data);
      
      // Also handle notifications automatically
      if (notificationService.getStatus().enabled) {
        notificationService.showOrderPlacedNotification({
          id: data.order.id,
          items: data.order.items,
          ...data.order
        });
      }
    });
  }

  onNewCustomer(callback) {
    if (!this.socket) this.connect();
    this.socket.on('new-customer', (data) => {
      // Call the provided callback
      if (callback) callback(data);
      
      // Also handle notifications automatically
      if (notificationService.getStatus().enabled) {
        notificationService.showCustomerJoinedNotification({
          name: data.customerName,
          ...data
        });
      }
    });
  }

  onCartShared(callback) {
    if (!this.socket) this.connect();
    this.socket.on('cart-shared', (data) => {
      // Call the provided callback
      if (callback) callback(data);
      
      // Also handle notifications automatically
      if (notificationService.getStatus().enabled) {
        notificationService.showCartSharedNotification({
          customerName: data.customerName,
          items: data.cartItems,
          ...data
        });
      }
    });
  }

  // Notification management methods
  async enableNotifications() {
    try {
      await notificationService.requestPermission();
      return notificationService.getStatus();
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      throw error;
    }
  }

  disableNotifications() {
    notificationService.disable();
    return notificationService.getStatus();
  }

  getNotificationStatus() {
    return notificationService.getStatus();
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
