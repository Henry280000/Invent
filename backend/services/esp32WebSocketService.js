/* eslint-env node */
/* eslint-disable no-undef */
const WebSocket = require('ws');

/**
 * Servicio WebSocket para comunicación con Gateway ESP32
 * Recibe datos de las hieleras y los distribuye a clientes web
 */
class ESP32WebSocketService {
  constructor(pool, port = 8080) {
    this.pool = pool;
    this.port = port;
    this.wss = null;
    this.esp32Client = null;
    this.webClients = new Set();
    this.hieleras = new Map(); // Almacenar último estado de cada hielera
    this.isRunning = false;
  }

  /**
   * Iniciar servidor WebSocket
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Servidor WebSocket ya está corriendo');
      return;
    }

    this.wss = new WebSocket.Server({ port: this.port });
    console.log(`🌐 Servidor WebSocket iniciado en puerto ${this.port}`);
    console.log(`📍 Gateway ESP32 debe conectarse a: ws://localhost:${this.port}`);

    this.wss.on('connection', (ws, req) => {
      const clientIP = req.socket.remoteAddress;
      console.log(`🔌 Nueva conexión WebSocket desde ${clientIP}`);

      // Identificar tipo de cliente
      ws.clientType = 'unknown';
      ws.clientIP = clientIP;
      ws.connectedAt = new Date();

      // Enviar mensaje de bienvenida
      this.sendToClient(ws, {
        type: 'welcome',
        message: 'Conectado al servidor de hieleras IoT',
        timestamp: Date.now()
      });

      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        console.log(`🔌 Cliente desconectado: ${ws.clientType} (${clientIP})`);
        
        if (ws.clientType === 'esp32') {
          this.esp32Client = null;
          console.log('⚠️  Gateway ESP32 desconectado');
        } else if (ws.clientType === 'web') {
          this.webClients.delete(ws);
          console.log(`👥 Clientes web activos: ${this.webClients.size}`);
        }
      });

      ws.on('error', (error) => {
        console.error(`❌ Error en conexión WebSocket: ${error.message}`);
      });
    });

    this.isRunning = true;
    console.log('✅ Servicio ESP32 WebSocket iniciado correctamente');
  }

  /**
   * Manejar mensajes entrantes
   */
  async handleMessage(ws, message) {
    try {
      const data = JSON.parse(message.toString());

      // Identificar Gateway ESP32 por tipo de mensaje inicial_data o sensor_data
      if (data.type === 'initial_data' && data.gateway) {
        ws.clientType = 'esp32';
        this.esp32Client = ws;
        console.log(`✅ Gateway ESP32 identificado: ${data.gateway}`);
        console.log(`   Hieleras disponibles: ${data.total_hieleras}`);
        
        // Procesar datos iniciales de hieleras
        if (data.hieleras && Array.isArray(data.hieleras)) {
          for (const hielera of data.hieleras) {
            await this.processHieleraData(hielera);
          }
        }
        return;
      }

      // Datos de sensor de una hielera
      if (data.type === 'sensor_data') {
        if (ws.clientType === 'unknown') {
          ws.clientType = 'esp32';
          this.esp32Client = ws;
          console.log('✅ Gateway ESP32 identificado por sensor_data');
        }
        
        await this.processHieleraData(data);
        
        // Broadcast a todos los clientes web
        this.broadcastToWebClients(data);
        return;
      }

      // Solicitudes de clientes web
      if (data.type === 'register' && data.client === 'web') {
        ws.clientType = 'web';
        this.webClients.add(ws);
        console.log(`👤 Cliente web registrado. Total: ${this.webClients.size}`);
        
        // Enviar estado actual de todas las hieleras
        this.sendCurrentStateToClient(ws);
        return;
      }

      // Comando de status
      if (data.type === 'get_status') {
        this.sendStatus(ws);
        return;
      }

      console.log(`📨 Mensaje no reconocido:`, data);

    } catch (error) {
      console.error('❌ Error procesando mensaje WebSocket:', error.message);
    }
  }

  /**
   * Procesar datos de una hielera y guardar en BD
   */
  async processHieleraData(data) {
    try {
      const { id, temp, hum, ethylene, timestamp } = data;

      // Actualizar caché en memoria
      this.hieleras.set(id, {
        id,
        temp,
        hum,
        ethylene,
        timestamp,
        received_at: Date.now()
      });

      console.log(`📦 Hielera ${id}: Temp=${temp.toFixed(1)}°C, Hum=${hum.toFixed(1)}%, Eth=${ethylene.toFixed(1)}ppm`);

      // Guardar en base de datos - tabla iot_sensor_readings
      const query = `
        INSERT INTO iot_sensor_readings 
        (device_id, sensor_type, sensor_value, unit, location_lat, location_lng, truck_id, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      // Guardar temperatura
      await this.pool.query(query, [
        `HIELERA_${id}`,
        'temperature',
        temp,
        '°C',
        null,
        null,
        `TRUCK_${id}`
      ]);

      // Guardar humedad
      await this.pool.query(query, [
        `HIELERA_${id}`,
        'humidity',
        hum,
        '%',
        null,
        null,
        `TRUCK_${id}`
      ]);

      // Guardar etileno
      await this.pool.query(query, [
        `HIELERA_${id}`,
        'ethylene',
        ethylene,
        'ppm',
        null,
        null,
        `TRUCK_${id}`
      ]);

      // Clasificar datos automáticamente
      await this.classifySensorData(id, temp, hum, ethylene);

      // Generar alertas si es necesario
      await this.checkAndCreateAlerts(id, temp, hum, ethylene);

    } catch (error) {
      console.error('❌ Error guardando datos de hielera:', error.message);
    }
  }

  /**
   * Clasificar datos de sensores por severidad
   */
  async classifySensorData(hieleraId, temp, hum, ethylene) {
    try {
      // Clasificar temperatura
      let tempSeverity = 'normal';
      if (temp < 0 || temp > 4) tempSeverity = 'critical';
      else if (temp < 2 || temp > 3.5) tempSeverity = 'warning';

      await this.saveClassification(`HIELERA_${hieleraId}`, 'temperature', temp, tempSeverity);

      // Clasificar humedad
      let humSeverity = 'normal';
      if (hum < 60 || hum > 95) humSeverity = 'critical';
      else if (hum < 70 || hum > 90) humSeverity = 'warning';

      await this.saveClassification(`HIELERA_${hieleraId}`, 'humidity', hum, humSeverity);

      // Clasificar etileno
      let ethyleneSeverity = 'normal';
      if (ethylene > 200) ethyleneSeverity = 'critical';
      else if (ethylene > 100) ethyleneSeverity = 'warning';

      await this.saveClassification(`HIELERA_${hieleraId}`, 'ethylene', ethylene, ethyleneSeverity);

    } catch (error) {
      console.error('❌ Error clasificando datos:', error.message);
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
   * Verificar y crear alertas si es necesario
   */
  async checkAndCreateAlerts(hieleraId, temp, hum, ethylene) {
    try {
      const alerts = [];

      // Alerta de temperatura
      if (temp < 0 || temp > 4) {
        alerts.push({
          type: 'temperature_critical',
          severity: 'high',
          message: `Hielera ${hieleraId}: Temperatura fuera de rango (${temp.toFixed(1)}°C)`,
          sensor_type: 'temperature',
          sensor_value: temp
        });
      }

      // Alerta de humedad
      if (hum < 60 || hum > 95) {
        alerts.push({
          type: 'humidity_critical',
          severity: 'medium',
          message: `Hielera ${hieleraId}: Humedad fuera de rango (${hum.toFixed(1)}%)`,
          sensor_type: 'humidity',
          sensor_value: hum
        });
      }

      // Alerta de etileno (maduración acelerada)
      if (ethylene > 200) {
        alerts.push({
          type: 'ripening_critical',
          severity: 'high',
          message: `Hielera ${hieleraId}: Nivel crítico de etileno (${ethylene.toFixed(1)}ppm) - Maduración acelerada`,
          sensor_type: 'ethylene',
          sensor_value: ethylene
        });
      }

      // Guardar alertas en BD
      for (const alert of alerts) {
        const query = `
          INSERT INTO alerts 
          (shipment_id, type, severity, message, sensor_type, sensor_value, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        // Usar hieleraId como referencia de envío
        await this.pool.query(query, [
          hieleraId,
          alert.type,
          alert.severity,
          alert.message,
          alert.sensor_type,
          alert.sensor_value
        ]);
      }

      if (alerts.length > 0) {
        console.log(`🚨 ${alerts.length} alertas generadas para Hielera ${hieleraId}`);
      }

    } catch (error) {
      console.error('❌ Error creando alertas:', error.message);
    }
  }

  /**
   * Enviar mensaje a un cliente específico
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast a todos los clientes web
   */
  broadcastToWebClients(data) {
    const message = JSON.stringify({
      type: 'sensor_update',
      data,
      timestamp: Date.now()
    });

    this.webClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Enviar estado actual al cliente
   */
  sendCurrentStateToClient(ws) {
    const hieleras = Array.from(this.hieleras.values());
    this.sendToClient(ws, {
      type: 'current_state',
      hieleras,
      total: hieleras.length,
      timestamp: Date.now()
    });
  }

  /**
   * Enviar status del servidor
   */
  sendStatus(ws) {
    this.sendToClient(ws, {
      type: 'status',
      esp32_connected: this.esp32Client !== null,
      web_clients: this.webClients.size,
      active_hieleras: this.hieleras.size,
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  }

  /**
   * Detener servidor
   */
  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('🛑 Servidor WebSocket detenido');
      this.isRunning = false;
    }
  }

  /**
   * Obtener estado actual de todas las hieleras
   */
  getHielerasState() {
    return Array.from(this.hieleras.values());
  }
}

module.exports = ESP32WebSocketService;
