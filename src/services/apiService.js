const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    // Siempre leer el token más reciente de localStorage
    const token = localStorage.getItem('token') || this.token;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==================== AUTH ====================

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('user');
  }

  // ==================== SHIPMENTS ====================

  async getShipments() {
    return await this.request('/shipments');
  }

  async getShipment(id) {
    return await this.request(`/shipments/${id}`);
  }

  async createShipment(shipmentData) {
    return await this.request('/shipments', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async updateShipment(id, updates) {
    return await this.request(`/shipments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteShipment(id) {
    return await this.request(`/shipments/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== SHIPMENT UPDATES ====================

  async createShipmentUpdate(shipmentId, updateData) {
    return await this.request(`/shipments/${shipmentId}/updates`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  }

  async getShipmentUpdates(shipmentId) {
    return await this.request(`/shipments/${shipmentId}/updates`);
  }

  // ==================== SENSOR DATA ====================

  async addSensorData(shipmentId, sensorData) {
    return await this.request(`/sensor-data/${shipmentId}`, {
      method: 'POST',
      body: JSON.stringify(sensorData),
    });
  }

  async getSensorData(shipmentId, limit = 100) {
    return await this.request(`/sensor-data/${shipmentId}?limit=${limit}`);
  }

  // ==================== USERS ====================

  async getUsers() {
    return await this.request('/users');
  }

  async getClients() {
    return await this.request('/users/clients');
  }

  // ==================== IOT SENSOR DATA ====================

  async getIotReadings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/iot/readings${queryString ? '?' + queryString : ''}`);
  }

  async getIotClassifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/iot/classifications${queryString ? '?' + queryString : ''}`);
  }

  async getIotStats() {
    return await this.request('/iot/stats');
  }

  async getIotByCategory(category, limit = 50) {
    return await this.request(`/iot/by-category/${category}?limit=${limit}`);
  }

  async publishMqttMessage(topic, message) {
    return await this.request('/iot/publish', {
      method: 'POST',
      body: JSON.stringify({ topic, message }),
    });
  }

  // ==================== TESTING (ESP32 NODO TEST) ====================

  async getTestingData(limit = 50) {
    return await this.request(`/testing/data?limit=${limit}`);
  }

  async getTestingStats() {
    return await this.request('/testing/stats');
  }

  async getTestingLatest() {
    return await this.request('/testing/latest');
  }

  async clearTestingData() {
    return await this.request('/testing/clear', {
      method: 'DELETE',
    });
  }

  // ==================== HEALTH ====================

  async healthCheck() {
    return await this.request('/health');
  }
}

export default new ApiService();
