/* eslint-env node */
/* eslint-disable no-undef */
const mqtt = require('mqtt');

class MQTTService {
  constructor(pool) {
    this.pool = pool;
    this.client = null;
    this.connected = false;
    
    // Configuración de tópicos MQTT
    this.topics = {
      temperature: 'iot/sensors/temperature/#',
      humidity: 'iot/sensors/humidity/#',
      pressure: 'iot/sensors/pressure/#',
      gas: 'iot/sensors/gas/#',
      motion: 'iot/sensors/motion/#',
      light: 'iot/sensors/light/#',
      location: 'iot/sensors/location/#',
      coupling: 'iot/sensors/coupling/#',
      all: 'iot/sensors/#'
    };

    // Umbrales para clasificación automática
    this.thresholds = {
      temperature: { warning: { min: 0, max: 4 }, critical: { min: -5, max: 8 } },
      humidity: { warning: { min: 30, max: 70 }, critical: { min: 20, max: 80 } },
      pressure: { warning: { min: 1000, max: 1020 }, critical: { min: 980, max: 1040 } },
      nh3: { warning: 25, critical: 50 },
      tma: { warning: 10, critical: 20 },
      ethylene: { warning: 100, critical: 200 }
    };
  }

  // Conectar al broker MQTT
  async connect() {
    const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost';
    const port = process.env.MQTT_PORT || 1883;

    console.log(`📡 Conectando al broker MQTT: ${brokerUrl}:${port}...`);

    this.client = mqtt.connect(`${brokerUrl}:${port}`, {
      clientId: `backend_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000
    });

    this.client.on('connect', () => {
      console.log('✅ Conectado al broker MQTT');
      this.connected = true;
      this.subscribeToTopics();
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });

    this.client.on('error', (error) => {
      console.error('❌ Error MQTT:', error);
      this.connected = false;
    });

    this.client.on('close', () => {
      console.log('⚠️  Conexión MQTT cerrada');
      this.connected = false;
    });

    this.client.on('reconnect', () => {
      console.log('🔄 Reconectando al broker MQTT...');
    });
  }

  // Suscribirse a todos los tópicos
  subscribeToTopics() {
    this.client.subscribe(this.topics.all, (err) => {
      if (err) {
        console.error('Error al suscribirse:', err);
      } else {
        console.log('📥 Suscrito a todos los sensores:', this.topics.all);
      }
    });
  }

  // Manejar mensajes MQTT entrantes
  async handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`📨 Mensaje recibido en ${topic}:`, payload);

      // Guardar dato en la base de datos
      const readingId = await this.saveSensorReading(topic, payload);

      // Clasificar el dato automáticamente
      if (readingId) {
        await this.classifySensorReading(readingId, payload);
      }
    } catch (error) {
      console.error('Error procesando mensaje MQTT:', error);
    }
  }

  // Guardar lectura de sensor en la base de datos
  async saveSensorReading(topic, payload) {
    try {
      const sensorType = this.extractSensorType(topic);
      
      const insertQuery = `
        INSERT INTO iot_sensor_readings 
        (device_id, truck_id, sensor_type, sensor_value, unit, location_lat, location_lng, raw_payload, mqtt_topic)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await this.pool.execute(insertQuery, [
        payload.deviceId || payload.device_id || 'unknown',
        payload.truckId || payload.truck_id || null,
        sensorType,
        payload.value || payload.sensor_value || null,
        payload.unit || null,
        payload.lat || payload.latitude || null,
        payload.lng || payload.longitude || null,
        JSON.stringify(payload),
        topic
      ]);

      console.log(`💾 Dato guardado con ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      console.error('Error guardando lectura:', error);
      return null;
    }
  }

  // Clasificar lectura de sensor automáticamente
  async classifySensorReading(readingId, payload) {
    try {
      const sensorType = payload.sensorType || payload.sensor_type || 'unknown';
      const value = parseFloat(payload.value || payload.sensor_value || 0);

      let category = this.determinateCategory(sensorType);
      let severity = this.determinateSeverity(sensorType, value);
      let classification = `${sensorType}_${severity}`;

      const threshold = this.getThreshold(sensorType);

      const insertQuery = `
        INSERT INTO sensor_classifications 
        (reading_id, classification, category, severity, threshold_min, threshold_max)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await this.pool.execute(insertQuery, [
        readingId,
        classification,
        category,
        severity,
        threshold?.min || null,
        threshold?.max || null
      ]);

      console.log(`🏷️  Clasificado: ${classification} (${severity})`);

      // Si es crítico, crear alerta
      if (severity === 'critical') {
        await this.createAlert(payload, sensorType, value);
      }
    } catch (error) {
      console.error('Error clasificando lectura:', error);
    }
  }

  // Extraer tipo de sensor del tópico MQTT
  extractSensorType(topic) {
    const parts = topic.split('/');
    return parts[2] || 'unknown'; // iot/sensors/[tipo]/...
  }

  // Determinar categoría según tipo de sensor
  determinateCategory(sensorType) {
    const categoryMap = {
      temperature: 'temperature',
      humidity: 'humidity',
      pressure: 'pressure',
      nh3: 'gas',
      tma: 'gas',
      ethylene: 'gas',
      motion: 'motion',
      movement: 'motion',
      light: 'light',
      location: 'location',
      gps: 'location',
      coupling: 'other'
    };

    return categoryMap[sensorType.toLowerCase()] || 'other';
  }

  // Determinar severidad basado en umbrales
  determinateSeverity(sensorType, value) {
    const type = sensorType.toLowerCase();
    const threshold = this.thresholds[type];

    if (!threshold) return 'normal';

    // Para gases (valores críticos son más altos)
    if (type === 'nh3' || type === 'tma' || type === 'ethylene') {
      if (value >= threshold.critical) return 'critical';
      if (value >= threshold.warning) return 'warning';
      return 'normal';
    }

    // Para temperatura, humedad, presión (rangos)
    if (threshold.critical) {
      if (value < threshold.critical.min || value > threshold.critical.max) return 'critical';
    }
    if (threshold.warning) {
      if (value < threshold.warning.min || value > threshold.warning.max) return 'warning';
    }

    return 'normal';
  }

  // Obtener umbral para el tipo de sensor
  getThreshold(sensorType) {
    const type = sensorType.toLowerCase();
    const threshold = this.thresholds[type];

    if (!threshold) return null;

    if (threshold.warning && threshold.warning.min !== undefined) {
      return { min: threshold.warning.min, max: threshold.warning.max };
    }

    return null;
  }

  // Crear alerta en caso de lectura crítica
  async createAlert(payload, sensorType, value) {
    try {
      const insertQuery = `
        INSERT INTO alerts 
        (shipment_id, type, severity, category, message, acknowledged)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const message = `⚠️ Valor crítico detectado: ${sensorType} = ${value} ${payload.unit || ''}`;

      await this.pool.execute(insertQuery, [
        null, // shipment_id puede ser null para alertas generales
        sensorType.toUpperCase(),
        'CRITICAL',
        this.determinateCategory(sensorType),
        message,
        false
      ]);

      console.log('🚨 Alerta creada:', message);
    } catch (error) {
      console.error('Error creando alerta:', error);
    }
  }

  // Publicar mensaje en tópico MQTT
  publish(topic, message) {
    if (!this.connected) {
      console.error('No conectado al broker MQTT');
      return false;
    }

    const payload = typeof message === 'object' ? JSON.stringify(message) : message;
    
    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('Error publicando:', err);
      } else {
        console.log(`📤 Mensaje publicado en ${topic}`);
      }
    });

    return true;
  }

  // Obtener estadísticas de clasificaciones
  async getClassificationStats() {
    try {
      const query = `
        SELECT 
          category,
          severity,
          COUNT(*) as count
        FROM sensor_classifications
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        GROUP BY category, severity
        ORDER BY category, severity
      `;

      const [rows] = await this.pool.execute(query);
      return rows;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return [];
    }
  }

  // Desconectar del broker
  disconnect() {
    if (this.client) {
      this.client.end();
      this.connected = false;
      console.log('Desconectado del broker MQTT');
    }
  }
}

module.exports = MQTTService;
