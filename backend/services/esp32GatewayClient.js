/* eslint-env node */
/* eslint-disable no-undef */
const WebSocket = require('ws');

/**
 * Cliente WebSocket para conectarse al Gateway ESP32
 * Este cliente se conecta al Gateway y recibe datos de las hieleras
 */
class ESP32GatewayClient {
  constructor(pool, gatewayHost = '192.168.4.1', gatewayPort = 81) {
    this.pool = pool;
    this.gatewayHost = gatewayHost;
    this.gatewayPort = gatewayPort;
    this.gatewayUrl = `ws://${gatewayHost}:${gatewayPort}`;
    this.ws = null;
    this.reconnectInterval = 5000; // 5 segundos
    this.isConnected = false;
    this.reconnectTimer = null;
    this.hieleras = new Map();
    this.webClients = new Set(); // Clientes web para broadcast
  }

  /**
   * Conectar al Gateway ESP32
   */
  connect() {
    console.log(`🔌 Intentando conectar al Gateway ESP32: ${this.gatewayUrl}`);

    try {
      this.ws = new WebSocket(this.gatewayUrl, {
        handshakeTimeout: 10000
      });

      this.ws.on('open', () => {
        console.log('✅ Conectado al Gateway ESP32');
        console.log(`   URL: ${this.gatewayUrl}`);
        this.isConnected = true;
        
        // Limpiar timer de reconexión si existe
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Solicitar estado inicial
        this.sendMessage({ type: 'status' });
      });

      this.ws.on('message', (message) => {
        this.handleMessage(message);
      });

      this.ws.on('close', () => {
        console.log('⚠️  Desconectado del Gateway ESP32');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('❌ Error de conexión con Gateway:', error.message);
        console.log('💡 Verifica:');
        console.log('   1. Estás conectado al WiFi: ESP32-Gateway-Hieleras');
        console.log('   2. El Gateway ESP32 está encendido');
        console.log(`   3. La IP del Gateway es: ${this.gatewayHost}`);
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ Error al crear conexión WebSocket:', error.message);
      this.scheduleReconnect();
    }
  }

  /**
   * Programar reconexión automática
   */
  scheduleReconnect() {
    if (this.reconnectTimer) return;

    console.log(`🔄 Reconectando en ${this.reconnectInterval / 1000} segundos...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * Enviar mensaje al Gateway
   */
  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Manejar mensajes del Gateway
   */
  async handleMessage(message) {
    try {
      const data = JSON.parse(message.toString());
      
      console.log(`📨 Mensaje del Gateway:`, data.type);

      switch (data.type) {
        case 'sensor_data':
          // Datos de una hielera individual
          await this.processSensorData(data);
          break;

        case 'initial_data':
          // Datos iniciales de todas las hieleras
          console.log(`📊 Datos iniciales recibidos: ${data.total_hieleras} hieleras`);
          console.log(`📊 Array hieleras:`, JSON.stringify(data.hieleras, null, 2));
          if (data.hieleras && Array.isArray(data.hieleras)) {
            console.log(`📊 Procesando ${data.hieleras.length} hieleras con datos...`);
            for (const hielera of data.hieleras) {
              await this.processHieleraData(hielera);
            }
          } else {
            console.log(`⚠️  No hay hieleras para procesar`);
          }
          break;

        case 'status':
          // Estado del gateway
          console.log(`📊 Estado del Gateway:`);
          console.log(`   Uptime: ${(data.uptime_ms / 1000).toFixed(0)}s`);
          console.log(`   Clientes: ${data.clients}`);
          console.log(`   Hieleras activas: ${data.active_hieleras}`);
          console.log(`   Memoria libre: ${data.free_heap} bytes`);
          break;

        default:
          console.log(`📨 Mensaje no reconocido del Gateway:`, data);
      }

    } catch (error) {
      console.error('❌ Error procesando mensaje del Gateway:', error.message);
    }
  }

  /**
   * Procesar datos de sensor individual
   */
  async processSensorData(data) {
    await this.processHieleraData(data);
  }

  /**
   * Procesar datos de una hielera
   */
  async processHieleraData(data) {
    try {
      const { id, temp, hum, ethylene, timestamp } = data;

      // Actualizar caché
      this.hieleras.set(id, {
        id,
        temp,
        hum,
        ethylene,
        timestamp,
        received_at: Date.now()
      });

      console.log(`📦 Hielera ${id}: Temp=${temp.toFixed(1)}°C, Hum=${hum.toFixed(1)}%, Eth=${ethylene.toFixed(1)}ppm`);

      // Guardar en base de datos
      await this.saveToDB(id, temp, hum, ethylene);

      // Clasificar y generar alertas
      await this.classifyAndAlert(id, temp, hum, ethylene);

      // Broadcast a clientes web
      this.broadcastToWebClients({
        type: 'sensor_update',
        data: { id, temp, hum, ethylene, timestamp },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ Error procesando datos de hielera:', error.message);
    }
  }

  /**
   * Guardar datos en la base de datos
   */
  async saveToDB(hieleraId, temp, hum, ethylene) {
    try {
      const query = `
        INSERT INTO iot_sensor_readings 
        (device_id, sensor_type, sensor_value, unit, location_lat, location_lng, truck_id, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      // Guardar temperatura
      await this.pool.query(query, [
        `HIELERA_${hieleraId}`,
        'temperature',
        temp,
        '°C',
        null,
        null,
        `TRUCK_${hieleraId}`
      ]);

      // Guardar humedad
      await this.pool.query(query, [
        `HIELERA_${hieleraId}`,
        'humidity',
        hum,
        '%',
        null,
        null,
        `TRUCK_${hieleraId}`
      ]);

      // Guardar etileno
      await this.pool.query(query, [
        `HIELERA_${hieleraId}`,
        'ethylene',
        ethylene,
        'ppm',
        null,
        null,
        `TRUCK_${hieleraId}`
      ]);

    } catch (error) {
      console.error('❌ Error guardando en BD:', error.message);
    }
  }

  /**
   * Clasificar datos y generar alertas
   */
  async classifyAndAlert(hieleraId, temp, hum, ethylene) {
    try {
      // Clasificar temperatura
      let tempSeverity = 'normal';
      let tempAlert = null;

      if (temp < 0 || temp > 4) {
        tempSeverity = 'critical';
        tempAlert = {
          type: 'temperature_critical',
          severity: 'high',
          message: `Hielera ${hieleraId}: Temperatura crítica (${temp.toFixed(1)}°C)`,
          sensor_type: 'temperature',
          sensor_value: temp
        };
      } else if (temp < 2 || temp > 3.5) {
        tempSeverity = 'warning';
      }

      await this.saveClassification(`HIELERA_${hieleraId}`, 'temperature', temp, tempSeverity);
      if (tempAlert) await this.saveAlert(hieleraId, tempAlert);

      // Clasificar humedad
      let humSeverity = 'normal';
      let humAlert = null;

      if (hum < 60 || hum > 95) {
        humSeverity = 'critical';
        humAlert = {
          type: 'humidity_critical',
          severity: 'medium',
          message: `Hielera ${hieleraId}: Humedad crítica (${hum.toFixed(1)}%)`,
          sensor_type: 'humidity',
          sensor_value: hum
        };
      } else if (hum < 70 || hum > 90) {
        humSeverity = 'warning';
      }

      await this.saveClassification(`HIELERA_${hieleraId}`, 'humidity', hum, humSeverity);
      if (humAlert) await this.saveAlert(hieleraId, humAlert);

      // Clasificar etileno
      let ethyleneSeverity = 'normal';
      let ethyleneAlert = null;

      if (ethylene > 200) {
        ethyleneSeverity = 'critical';
        ethyleneAlert = {
          type: 'ripening_critical',
          severity: 'high',
          message: `Hielera ${hieleraId}: Nivel crítico de etileno (${ethylene.toFixed(1)}ppm) - Maduración acelerada`,
          sensor_type: 'ethylene',
          sensor_value: ethylene
        };
      } else if (ethylene > 100) {
        ethyleneSeverity = 'warning';
      }

      await this.saveClassification(`HIELERA_${hieleraId}`, 'ethylene', ethylene, ethyleneSeverity);
      if (ethyleneAlert) await this.saveAlert(hieleraId, ethyleneAlert);

    } catch (error) {
      console.error('❌ Error en clasificación/alertas:', error.message);
    }
  }

  /**
   * Guardar clasificación en BD
   */
  async saveClassification(deviceId, category, value, severity) {
    try {
      const query = `
        INSERT INTO sensor_classifications 
        (device_id, category, sensor_value, severity, classified_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      await this.pool.query(query, [deviceId, category, value, severity]);
    } catch (error) {
      console.error('❌ Error guardando clasificación:', error.message);
    }
  }

  /**
   * Guardar alerta en BD
   */
  async saveAlert(hieleraId, alert) {
    try {
      const query = `
        INSERT INTO alerts 
        (shipment_id, type, severity, message, sensor_type, sensor_value, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      await this.pool.query(query, [
        hieleraId,
        alert.type,
        alert.severity,
        alert.message,
        alert.sensor_type,
        alert.sensor_value
      ]);
      console.log(`🚨 Alerta generada: ${alert.message}`);
    } catch (error) {
      console.error('❌ Error guardando alerta:', error.message);
    }
  }

  /**
   * Registrar cliente web para recibir updates
   */
  addWebClient(client) {
    this.webClients.add(client);
    console.log(`👤 Cliente web registrado. Total: ${this.webClients.size}`);

    // Enviar estado actual
    this.sendCurrentStateToClient(client);
  }

  /**
   * Remover cliente web
   */
  removeWebClient(client) {
    this.webClients.delete(client);
    console.log(`👤 Cliente web desconectado. Total: ${this.webClients.size}`);
  }

  /**
   * Broadcast a todos los clientes web
   */
  broadcastToWebClients(data) {
    const message = JSON.stringify(data);

    this.webClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Enviar estado actual a un cliente
   */
  sendCurrentStateToClient(client) {
    if (client.readyState !== WebSocket.OPEN) return;

    const hieleras = Array.from(this.hieleras.values());
    client.send(JSON.stringify({
      type: 'current_state',
      hieleras,
      total: hieleras.length,
      timestamp: Date.now()
    }));
  }

  /**
   * Obtener estado de conexión
   */
  getStatus() {
    return {
      connected: this.isConnected,
      gatewayUrl: this.gatewayUrl,
      activeHieleras: this.hieleras.size,
      webClients: this.webClients.size
    };
  }

  /**
   * Obtener datos de todas las hieleras
   */
  getHielerasData() {
    return Array.from(this.hieleras.values());
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log('🛑 Cliente Gateway desconectado');
  }
}

module.exports = ESP32GatewayClient;
