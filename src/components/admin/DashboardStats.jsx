import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';

export default function DashboardStats() {
  const { 
    dashboardStats, 
    recentOrders, 
    loading, 
    fetchDashboardStats 
  } = useAdminStore();

  useEffect(() => {
    fetchDashboardStats().catch(console.error);
  }, [fetchDashboardStats]);

  if (loading.dashboard) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Menu Items',
      value: dashboardStats?.menuItems || 0,
      icon: '🍽️',
      color: 'bg-blue-500'
    },
    {
      name: 'Tables',
      value: dashboardStats?.tables || 0,
      icon: '🪑',
      color: 'bg-green-500'
    },
    {
      name: "Today's Orders",
      value: dashboardStats?.todayOrders || 0,
      icon: '📋',
      color: 'bg-amber-500'
    },
    {
      name: "Today's Revenue",
      value: `$${(dashboardStats?.todayRevenue || 0).toFixed(2)}`,
      icon: '💰',
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                <span className="text-white text-xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No recent orders</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {order.table_number}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Order #{order.id} - {order.customer_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Table {order.table_number} • {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${order.total_amount}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h4 className="text-lg font-medium mb-2">Active Sessions</h4>
          <p className="text-3xl font-bold mb-2">{dashboardStats?.activeSessions || 0}</p>
          <p className="text-blue-100 text-sm">Tables currently in use</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <h4 className="text-lg font-medium mb-2">Average Order</h4>
          <p className="text-3xl font-bold mb-2">
            ${dashboardStats?.todayOrders > 0 
              ? (dashboardStats.todayRevenue / dashboardStats.todayOrders).toFixed(2) 
              : '0.00'
            }
          </p>
          <p className="text-green-100 text-sm">Per order today</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <h4 className="text-lg font-medium mb-2">Peak Hours</h4>
          <p className="text-3xl font-bold mb-2">12-2 PM</p>
          <p className="text-purple-100 text-sm">Busiest time today</p>
        </div>
      </div>
    </div>
  );
}
