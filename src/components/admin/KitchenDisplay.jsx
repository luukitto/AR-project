import { useState, useEffect, useRef } from 'react';
import { useAdminStore } from '../../store/adminStore';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderTimers, setOrderTimers] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState('active'); // active, all, completed
  const audioRef = useRef(null);
  
  const { apiCall } = useAdminStore();

  // Status colors and icons
  const statusConfig = {
    pending: { 
      color: 'bg-red-500', 
      textColor: 'text-red-100',
      icon: '🔔', 
      label: 'New Order',
      priority: 1 
    },
    confirmed: { 
      color: 'bg-blue-500', 
      textColor: 'text-blue-100',
      icon: '✅', 
      label: 'Confirmed',
      priority: 2 
    },
    preparing: { 
      color: 'bg-orange-500', 
      textColor: 'text-orange-100',
      icon: '👨‍🍳', 
      label: 'Preparing',
      priority: 3 
    },
    ready: { 
      color: 'bg-green-500', 
      textColor: 'text-green-100',
      icon: '🔔', 
      label: 'Ready',
      priority: 4 
    },
    delivered: { 
      color: 'bg-gray-500', 
      textColor: 'text-gray-100',
      icon: '✨', 
      label: 'Delivered',
      priority: 5 
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update timers every second
    const interval = setInterval(() => {
      setOrderTimers(prev => {
        const updated = { ...prev };
        orders.forEach(order => {
          if (order.status !== 'delivered') {
            // Handle different date formats and ensure proper parsing
            let orderTime;
            try {
              // Try parsing the date - handle both ISO and SQLite datetime formats
              const dateStr = order.created_at;
              if (dateStr.includes('T')) {
                // ISO format
                orderTime = new Date(dateStr).getTime();
              } else {
                // SQLite datetime format (YYYY-MM-DD HH:MM:SS)
                // Convert to ISO format for proper parsing
                const isoDate = dateStr.replace(' ', 'T') + 'Z';
                orderTime = new Date(isoDate).getTime();
              }
              
              const now = new Date().getTime();
              const diffSeconds = Math.floor((now - orderTime) / 1000);
              
              // Ensure we have a valid positive time difference
              updated[order.id] = Math.max(0, diffSeconds);
            } catch (error) {
              console.error('Error parsing date for order', order.id, ':', error);
              // Fallback to 0 if date parsing fails
              updated[order.id] = 0;
            }
          } else {
            // Clear timer for delivered orders
            delete updated[order.id];
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const data = await apiCall('/admin/orders');
      
      // Sort orders by priority and time
      const sortedOrders = data.sort((a, b) => {
        const aPriority = statusConfig[a.status]?.priority || 999;
        const bPriority = statusConfig[b.status]?.priority || 999;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return new Date(a.created_at) - new Date(b.created_at);
      });

      // Check for new orders and play sound
      if (orders.length > 0 && soundEnabled) {
        const newOrders = sortedOrders.filter(order => 
          order.status === 'pending' && 
          !orders.find(existing => existing.id === order.id)
        );
        
        if (newOrders.length > 0) {
          playNotificationSound();
        }
      }

      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const playNotificationSound = () => {
    // Simple beep sound for new orders
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiCall(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Refresh orders to get updated data
      await fetchOrders();
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status: ' + error.message);
    }
  };

  const updateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      await apiCall(`/admin/orders/${orderId}/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Update the selectedOrder state immediately to reflect the change in the modal
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          items: prev.items.map(item => 
            item.id === itemId 
              ? { ...item, item_status: newStatus }
              : item
          )
        }));
      }
      
      // Refresh orders to get updated data
      await fetchOrders();
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Failed to update item status: ' + error.message);
    }
  };

  const formatTimer = (seconds) => {
    // Handle invalid or negative values
    if (!seconds || seconds < 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    // For very long times (over 99 minutes), show hours
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (seconds, status) => {
    if (status === 'delivered') return 'text-gray-400';
    if (seconds < 600) return 'text-green-400'; // < 10 min
    if (seconds < 1200) return 'text-yellow-400'; // < 20 min
    return 'text-red-400'; // > 20 min
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') return order.status !== 'delivered';
    if (filter === 'completed') return order.status === 'delivered';
    return true;
  });

  const getNextStatus = (currentStatus) => {
    const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-orange-400">👨‍🍳 Kitchen Display</h1>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Live Orders</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Filter Buttons */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              {[
                { key: 'active', label: 'Active', count: filteredOrders.filter(o => o.status !== 'delivered').length },
                { key: 'all', label: 'All', count: orders.length },
                { key: 'completed', label: 'Completed', count: filteredOrders.filter(o => o.status === 'delivered').length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">No orders to display</h3>
            <p className="text-gray-500">
              {filter === 'active' ? 'All orders are completed' : 
               filter === 'completed' ? 'No completed orders yet' :
               'No orders have been placed yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrders.map(order => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const timer = orderTimers[order.id] || 0;
              const nextStatus = getNextStatus(order.status);
              
              return (
                <div
                  key={order.id}
                  className={`${config.color} rounded-xl p-4 shadow-lg border-2 ${
                    order.status === 'pending' ? 'border-red-400 animate-pulse' : 'border-transparent'
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className={`text-sm font-medium ${config.textColor}`}>
                        Order #{order.id}
                      </span>
                    </div>
                    <div className={`text-right ${config.textColor}`}>
                      <div className={`text-lg font-bold ${getTimerColor(timer, order.status)}`}>
                        {formatTimer(timer)}
                      </div>
                      <div className="text-xs opacity-75">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Customer & Table */}
                  <div className={`mb-3 ${config.textColor}`}>
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-sm opacity-75">Table: {order.table_number || 'N/A'}</div>
                  </div>

                  {/* Order Items with Status */}
                  <div className={`mb-4 ${config.textColor}`}>
                    <div className="text-sm font-medium mb-2">Items:</div>
                    <div className="space-y-2">
                      {Array.isArray(order.items) && order.items.slice(0, 3).map((item, index) => {
                        const itemStatusConfig = statusConfig[item.item_status] || statusConfig.pending;
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs">{itemStatusConfig.icon}</span>
                              <span className="opacity-90">
                                {item.quantity}x {item.menu_item_name || item.menu_item_id}
                              </span>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${itemStatusConfig.color} ${itemStatusConfig.textColor}`}>
                              {itemStatusConfig.label}
                            </div>
                          </div>
                        );
                      })}
                      {Array.isArray(order.items) && order.items.length > 3 && (
                        <div className="text-sm opacity-75">
                          +{order.items.length - 3} more items (click to view all)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${config.textColor}`}>
                      {config.label}
                    </span>
                    {nextStatus && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, nextStatus);
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Mark {statusConfig[nextStatus]?.label}
                      </button>
                    )}
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className={`mt-3 pt-3 border-t border-white/20 ${config.textColor}`}>
                      <div className="text-xs font-medium mb-1">Notes:</div>
                      <div className="text-sm opacity-90">{order.notes}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Order #{selectedOrder.id}</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-white">
                <div>
                  <strong>Customer:</strong> {selectedOrder.customer_name}
                </div>
                <div>
                  <strong>Status:</strong> {statusConfig[selectedOrder.status]?.label}
                </div>
                <div>
                  <strong>Time:</strong> {formatTimer(orderTimers[selectedOrder.id] || 0)}
                </div>
                <div>
                  <strong>Total:</strong> ₾{selectedOrder.total_amount}
                </div>
              </div>

              {selectedOrder.items && (
                <div className="mb-6">
                  <h4 className="font-medium text-white mb-3">Items & Status:</h4>
                  <div className="space-y-3">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, index) => {
                      const itemStatusConfig = statusConfig[item.item_status] || statusConfig.pending;
                      const nextItemStatus = getNextStatus(item.item_status);
                      
                      return (
                        <div key={index} className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{itemStatusConfig.icon}</span>
                              <span className="text-white font-medium">
                                {item.quantity}x {item.menu_item_name || item.menu_item_id}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded ${itemStatusConfig.color} ${itemStatusConfig.textColor}`}>
                                {itemStatusConfig.label}
                              </span>
                              <span className="text-gray-400">₾{item.subtotal}</span>
                            </div>
                          </div>
                          
                          {/* Item Status Control Buttons */}
                          <div className="flex space-x-2">
                            {['confirmed', 'preparing', 'ready', 'delivered'].map(status => {
                              const statusConf = statusConfig[status];
                              const isCurrentStatus = item.item_status === status;
                              
                              // Define status order for progression logic
                              const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
                              const currentIndex = statusOrder.indexOf(item.item_status);
                              const buttonIndex = statusOrder.indexOf(status);
                              
                              // Button is completed if it's before current status
                              const isCompleted = buttonIndex < currentIndex;
                              // Button is available if it's the next logical step
                              const isAvailable = buttonIndex === currentIndex + 1 || buttonIndex <= currentIndex;
                              
                              return (
                                <button
                                  key={status}
                                  onClick={() => updateItemStatus(selectedOrder.id, item.id, status)}
                                  disabled={isCurrentStatus}
                                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    isCurrentStatus 
                                      ? `${statusConf.color} ${statusConf.textColor} cursor-not-allowed opacity-100` 
                                      : isCompleted
                                        ? `bg-green-700 text-green-200 cursor-pointer hover:bg-green-600`
                                        : isAvailable
                                          ? `${statusConf.color} ${statusConf.textColor} hover:opacity-80`
                                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                  }`}
                                >
                                  {isCompleted ? '✓' : statusConf.icon} {statusConf.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="mb-4">
                  <h4 className="font-medium text-white mb-2">Notes:</h4>
                  <p className="text-gray-300">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex space-x-2">
                {['confirmed', 'preparing', 'ready', 'delivered'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(selectedOrder.id, status)}
                    disabled={selectedOrder.status === status}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedOrder.status === status
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    Mark {statusConfig[status]?.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
