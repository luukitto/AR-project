import { io } from 'socket.io-client';

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

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
