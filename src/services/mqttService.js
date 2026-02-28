import mqtt from 'mqtt';
import protobufService from './protobufService';
import hashChainService from './hashChainService';

/**
 * Servicio de conexión MQTT para recibir datos de sensores
 */
class MqttService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscribers = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Conecta al broker MQTT
   * @param {Object} config - Configuración del broker
   * @param {string} config.url - URL del broker (ej: 'ws://localhost:8083/mqtt')
   * @param {string} config.username - Usuario (opcional)
   * @param {string} config.password - Contraseña (opcional)
   * @param {string} config.clientId - ID del cliente (opcional)
   */
  async connect(config) {
    const {
      url = 'ws://broker.emqx.io:8083/mqtt',
      username = '',
      password = '',
      clientId = `food_dashboard_${Math.random().toString(16).slice(2, 10)}`
    } = config || {};

    try {
      console.log(`🔌 Connecting to MQTT broker: ${url}`);

      const options = {
        clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 5000,
      };

      if (username) {
        options.username = username;
        options.password = password;
      }

      this.client = mqtt.connect(url, options);

      // Manejar eventos
      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT broker');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.notifySubscribers({ type: 'connection', status: 'connected' });
        
        // Suscribirse al topic de datos de sensores
        this.subscribe('food/transport/sensors/+');
      });

      this.client.on('disconnect', () => {
        console.log('⚠️ Disconnected from MQTT broker');
        this.connected = false;
        this.notifySubscribers({ type: 'connection', status: 'disconnected' });
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT Error:', error);
        this.notifySubscribers({ type: 'error', error: error.message });
      });

      this.client.on('message', async (topic, message) => {
        await this.handleMessage(topic, message);
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached');
          this.client.end(true);
        }
      });

    } catch (error) {
      console.error('❌ Error connecting to MQTT:', error);
      throw error;
    }
  }

  /**
   * Suscribe a un topic MQTT
   * @param {string} topic - Topic MQTT (puede incluir wildcards + y #)
   */
  subscribe(topic) {
    if (!this.client || !this.connected) {
      console.error('Cannot subscribe: Not connected to broker');
      return;
    }

    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Error subscribing to ${topic}:`, err);
      } else {
        console.log(`✅ Subscribed to ${topic}`);
      }
    });
  }

  /**
   * Maneja mensajes entrantes
   * @param {string} topic - Topic del mensaje
   * @param {Buffer} message - Contenido del mensaje
   */
  async handleMessage(topic, message) {
    try {
      // Intentar decodificar como Protobuf
      const decoded = protobufService.decode(message);
      
      console.log('📦 Received sensor data:', {
        topic,
        deviceId: decoded.device_id,
        sequence: decoded.sequence_number,
        timestamp: new Date(parseInt(decoded.timestamp))
      });

      // Validar hash chain
      const validation = await hashChainService.validateMessage(decoded);
      
      // Notificar a los suscriptores
      this.notifySubscribers({
        type: 'data',
        topic,
        data: decoded,
        validation,
        receivedAt: Date.now()
      });

    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      // Si falla Protobuf, intentar JSON
      try {
        const jsonData = JSON.parse(message.toString());
        this.notifySubscribers({
          type: 'data',
          topic,
          data: jsonData,
          validation: { valid: false, message: 'JSON fallback' },
          receivedAt: Date.now()
        });
      } catch (jsonError) {
        console.error('❌ Failed to parse as JSON too:', jsonError);
      }
    }
  }

  /**
   * Registra un callback para recibir notificaciones
   * @param {Function} callback - Función a llamar cuando lleguen datos
   * @returns {Function} Función para desuscribirse
   */
  onMessage(callback) {
    this.subscribers.push(callback);
    
    // Retornar función de cleanup
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica a todos los suscriptores
   * @param {Object} data - Datos a notificar
   */
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Publica un mensaje en un topic
   * @param {string} topic - Topic de destino
   * @param {Object|string} message - Mensaje a enviar
   */
  publish(topic, message) {
    if (!this.client || !this.connected) {
      console.error('Cannot publish: Not connected to broker');
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.client.publish(topic, payload, (err) => {
      if (err) {
        console.error(`❌ Error publishing to ${topic}:`, err);
      } else {
        console.log(`✅ Published to ${topic}`);
      }
    });
  }

  /**
   * Desconecta del broker
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      this.connected = false;
      console.log('🔌 Disconnected from MQTT broker');
    }
  }

  /**
   * Obtiene el estado de la conexión
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }
}

// Exportar instancia singleton
const mqttService = new MqttService();
export default mqttService;
