class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.isEnabled = false;
  }

  // Check if notifications are supported
  isNotificationSupported() {
    return this.isSupported;
  }

  // Request permission for notifications
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    if (this.permission === 'granted') {
      this.isEnabled = true;
      return true;
    }

    if (this.permission === 'denied') {
      throw new Error('Notifications are blocked. Please enable them in browser settings.');
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.isEnabled = permission === 'granted';
      
      if (permission === 'granted') {
        // Show welcome notification
        this.showNotification('🍽️ Notifications Enabled', {
          body: 'You\'ll receive updates when your order status changes!',
          icon: '/favicon.ico',
          tag: 'welcome'
        });
        return true;
      } else {
        throw new Error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  // Show a notification
  showNotification(title, options = {}) {
    if (!this.isEnabled || this.permission !== 'granted') {
      console.warn('Notifications not enabled or permission not granted');
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Order',
          icon: '/favicon.ico'
        }
      ]
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const notification = new Notification(title, finalOptions);
      
      // Auto-close after 10 seconds if not requiring interaction
      if (!finalOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to orders or cart page
        if (options.onClick) {
          options.onClick();
        } else {
          // Default action - focus the window
          if (window.location.pathname !== '/cart') {
            window.location.href = '/cart';
          }
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Order status notification handlers
  showOrderPlacedNotification(orderData) {
    return this.showNotification('🎉 Order Placed Successfully!', {
      body: `Your order for ${orderData.items?.length || 0} items has been received`,
      tag: `order-${orderData.id}`,
      data: { orderId: orderData.id, type: 'order_placed' }
    });
  }

  showOrderPreparingNotification(orderData) {
    return this.showNotification('👨‍🍳 Your Order is Being Prepared', {
      body: `Order #${orderData.id} is now being prepared by our kitchen`,
      tag: `order-${orderData.id}`,
      data: { orderId: orderData.id, type: 'order_preparing' }
    });
  }

  showOrderReadyNotification(orderData) {
    return this.showNotification('🍽️ Your Order is Ready!', {
      body: `Order #${orderData.id} is ready for pickup or delivery`,
      tag: `order-${orderData.id}`,
      requireInteraction: true,
      data: { orderId: orderData.id, type: 'order_ready' }
    });
  }

  showOrderDeliveredNotification(orderData) {
    return this.showNotification('✅ Order Delivered', {
      body: `Order #${orderData.id} has been delivered. Enjoy your meal!`,
      tag: `order-${orderData.id}`,
      data: { orderId: orderData.id, type: 'order_delivered' }
    });
  }

  showOrderCancelledNotification(orderData) {
    return this.showNotification('❌ Order Cancelled', {
      body: `Order #${orderData.id} has been cancelled`,
      tag: `order-${orderData.id}`,
      data: { orderId: orderData.id, type: 'order_cancelled' }
    });
  }

  // Generic order status notification
  showOrderStatusNotification(orderData) {
    const statusMessages = {
      'pending': {
        title: '⏳ Order Received',
        body: `Order #${orderData.id} is pending confirmation`
      },
      'confirmed': {
        title: '✅ Order Confirmed',
        body: `Order #${orderData.id} has been confirmed and will be prepared soon`
      },
      'preparing': {
        title: '👨‍🍳 Being Prepared',
        body: `Order #${orderData.id} is now being prepared by our kitchen`
      },
      'ready': {
        title: '🍽️ Order Ready!',
        body: `Order #${orderData.id} is ready for pickup or delivery`
      },
      'delivered': {
        title: '✅ Order Delivered',
        body: `Order #${orderData.id} has been delivered. Enjoy your meal!`
      },
      'cancelled': {
        title: '❌ Order Cancelled',
        body: `Order #${orderData.id} has been cancelled`
      }
    };

    const statusInfo = statusMessages[orderData.status] || {
      title: '📋 Order Update',
      body: `Order #${orderData.id} status: ${orderData.status}`
    };

    return this.showNotification(statusInfo.title, {
      body: statusInfo.body,
      tag: `order-${orderData.id}`,
      requireInteraction: ['ready', 'delivered'].includes(orderData.status),
      data: { orderId: orderData.id, type: 'order_status', status: orderData.status }
    });
  }

  // Table sharing notifications
  showCustomerJoinedNotification(customerData) {
    return this.showNotification('👥 Someone Joined Your Table', {
      body: `${customerData.name} has joined your table session`,
      tag: 'customer-joined',
      data: { type: 'customer_joined', customer: customerData }
    });
  }

  showCartSharedNotification(shareData) {
    return this.showNotification('🛒 Cart Shared', {
      body: `${shareData.customerName} shared their cart with the table`,
      tag: 'cart-shared',
      data: { type: 'cart_shared', share: shareData }
    });
  }

  // Enable/disable notifications
  enable() {
    this.isEnabled = true;
    localStorage.setItem('notifications_enabled', 'true');
  }

  disable() {
    this.isEnabled = false;
    localStorage.setItem('notifications_enabled', 'false');
  }

  // Get notification settings from localStorage
  loadSettings() {
    const saved = localStorage.getItem('notifications_enabled');
    if (saved !== null) {
      this.isEnabled = saved === 'true' && this.permission === 'granted';
    }
  }

  // Get current status
  getStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.isEnabled
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Load settings on initialization
notificationService.loadSettings();

export default notificationService;
