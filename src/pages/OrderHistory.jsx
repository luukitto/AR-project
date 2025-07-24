import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTableSharing from '../store/useTableSharing';

export default function OrderHistory() {
  const navigate = useNavigate();
  const { currentSession, sessionOrders, customerName, loadSessionDetails } = useTableSharing();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'mine', 'others'

  useEffect(() => {
    if (!currentSession) {
      navigate('/');
      return;
    }

    const loadOrders = async () => {
      try {
        await loadSessionDetails(currentSession.sessionId);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [currentSession, loadSessionDetails, navigate]);

  if (!currentSession) {
    return null;
  }

  const filteredOrders = sessionOrders.filter(order => {
    if (filter === 'mine') return order.customer_name === customerName;
    if (filter === 'others') return order.customer_name !== customerName;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'preparing': return '👨‍🍳';
      case 'ready': return '🔔';
      case 'delivered': return '✨';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="py-6 px-3">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-3">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold font-georgian">Order History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Table {currentSession.tableNumber} • {currentSession.sessionName}
          </p>
        </div>
        <button
          onClick={() => navigate('/menu')}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
        >
          Back to Menu
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All Orders', count: sessionOrders.length },
          { key: 'mine', label: 'My Orders', count: sessionOrders.filter(o => o.customer_name === customerName).length },
          { key: 'others', label: 'Others Orders', count: sessionOrders.filter(o => o.customer_name !== customerName).length }
        ].map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              filter === tab.key 
                ? 'bg-primary text-dark shadow-soft' 
                : 'bg-muted text-white hover:bg-gray-600'
            }`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-4">
              {filter === 'mine' ? "You haven't placed any orders yet" : 
               filter === 'others' ? "No orders from other customers yet" :
               "No orders have been placed at this table yet"}
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-primary text-dark px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-white transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          filteredOrders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(order => (
              <div key={order.id} className="bg-card rounded-2xl shadow-soft p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">
                        {order.customer_name === customerName ? 'Your Order' : `${order.customer_name}'s Order`}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary">₾{order.total_amount}</div>
                  </div>
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Items:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.menu_item_name || item.menu_item_id}</span>
                          <span className="font-medium">₾{item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Notes:</h4>
                    <p className="text-sm text-gray-600 italic">{order.notes}</p>
                  </div>
                )}
              </div>
            ))
        )}
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <div className="mt-8 bg-card rounded-2xl p-4 shadow-soft">
          <h3 className="font-bold text-lg mb-2 text-white">Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Total Orders:</span>
            <span className="font-medium text-white">{filteredOrders.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Total Amount:</span>
            <span className="font-medium text-primary">
              ₾{filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
