const API_BASE_URL = 'http://192.168.1.215:3001/api';

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

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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
