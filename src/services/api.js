// Dynamic API base URL configuration
const getApiBaseUrl = () => {
  // If running on localhost (development), use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // For mobile devices, try to use the same host as the frontend
  const currentHost = window.location.hostname;
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return `http://${currentHost}:3001/api`;
  }
  
  // Fallback to the configured IP
  return 'http://192.168.1.215:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('🌐 API Request:', {
      url,
      method: config.method || 'GET',
      hostname: window.location.hostname,
      apiBaseUrl: API_BASE_URL
    });

    try {
      const response = await fetch(url, config);
      
      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const error = await response.json();
          errorMessage = error.error || `HTTP error! status: ${response.status}`;
        } catch (parseError) {
          errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ API request failed:', {
        url,
        error: error.message,
        stack: error.stack
      });
      
      // Provide more helpful error messages for common issues
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Cannot connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  // Menu API methods
  async getMenuItems(category = null) {
    const params = category ? `?category=${category}` : '';
    return this.request(`/menu/items${params}`);
  }

  async getMenuItem(id) {
    return this.request(`/menu/items/${id}`);
  }

  async getCategories() {
    return this.request('/menu/categories');
  }

  // Table API methods
  async getTables() {
    return this.request('/tables');
  }

  async createTableSession(tableNumber, hostName, sessionName = null) {
    return this.request('/tables/sessions', {
      method: 'POST',
      body: JSON.stringify({ tableNumber, hostName, sessionName }),
    });
  }

  async joinTableSession(sessionId, customerName) {
    return this.request(`/tables/sessions/${sessionId}/join`, {
      method: 'POST',
      body: JSON.stringify({ customerName }),
    });
  }

  async getSessionDetails(sessionId) {
    return this.request(`/tables/sessions/${sessionId}`);
  }

  async endTableSession(sessionId, hostName) {
    return this.request(`/tables/sessions/${sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({ hostName }),
    });
  }

  // Order API methods
  async createOrder(sessionId, customerName, items, notes = null) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ sessionId, customerName, items, notes }),
    });
  }

  async getSessionOrders(sessionId) {
    return this.request(`/orders/session/${sessionId}`);
  }

  async getCustomerOrders(sessionId, customerName) {
    return this.request(`/orders/session/${sessionId}/customer/${encodeURIComponent(customerName)}`);
  }

  async updateOrderStatus(orderId, status) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getOrderSummary(sessionId) {
    return this.request(`/orders/session/${sessionId}/summary`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();
