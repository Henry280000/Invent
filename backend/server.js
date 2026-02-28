/* eslint-env node */
/* eslint-disable no-undef */
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const MQTTService = require('./services/mqttService');
const ESP32WebSocketService = require('./services/esp32WebSocketService');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'foodapp',
  password: process.env.DB_PASSWORD || 'foodapp123',
  database: process.env.DB_NAME || 'food_transport',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Inicializar servicio MQTT
const mqttService = new MQTTService(pool);
mqttService.connect();

// Inicializar servicio WebSocket para ESP32
const esp32WSService = new ESP32WebSocketService(pool, 8080);
esp32WSService.start();
console.log('✅ Servicio WebSocket ESP32 iniciado en puerto 8080');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar rol de admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

// ==================== RUTAS DE AUTENTICACIÓN ====================

// POST /api/auth/register - Registrar nuevo usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role, company } = req.body;

    // Validación
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password y nombre son requeridos' });
    }

    // Verificar si el usuario ya existe
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [result] = await pool.query(
      'INSERT INTO users (email, password, name, role, company) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, role || 'client', company || null]
    );

    // Obtener usuario creado
    const [users] = await pool.query(
      'SELECT id, email, name, role, company, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = users[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// POST /api/auth/login - Iniciar sesión
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    // Buscar usuario
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/auth/me - Obtener usuario actual
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, name, role, company, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// ==================== RUTAS DE ENVÍOS ====================

// GET /api/shipments - Obtener todos los envíos (admin) o envíos del usuario (client)
app.get('/api/shipments', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        s.*,
        u.email as client_email,
        u.name as client_name,
        u.company as client_company,
        (SELECT temperature FROM sensor_data WHERE shipment_id = s.id ORDER BY recorded_at DESC LIMIT 1) as last_temperature,
        (SELECT humidity FROM sensor_data WHERE shipment_id = s.id ORDER BY recorded_at DESC LIMIT 1) as last_humidity,
        (SELECT recorded_at FROM sensor_data WHERE shipment_id = s.id ORDER BY recorded_at DESC LIMIT 1) as last_sensor_update
      FROM shipments s
      JOIN users u ON s.client_id = u.id
    `;

    const params = [];

    // Si es cliente, solo ver sus envíos
    if (req.user.role === 'client') {
      query += ' WHERE s.client_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY s.created_at DESC';

    const [shipments] = await pool.query(query, params);

    res.json({ shipments });
  } catch (error) {
    console.error('Error al obtener envíos:', error);
    res.status(500).json({ error: 'Error al obtener envíos' });
  }
});

// GET /api/shipments/:id - Obtener un envío específico
app.get('/api/shipments/:id', authenticateToken, async (req, res) => {
  try {
    const [shipments] = await pool.query(
      `SELECT 
        s.*,
        u.email as client_email,
        u.name as client_name,
        u.company as client_company
      FROM shipments s
      JOIN users u ON s.client_id = u.id
      WHERE s.id = ?`,
      [req.params.id]
    );

    if (shipments.length === 0) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    const shipment = shipments[0];

    // Si es cliente, verificar que sea su envío
    if (req.user.role === 'client' && shipment.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    res.json({ shipment });
  } catch (error) {
    console.error('Error al obtener envío:', error);
    res.status(500).json({ error: 'Error al obtener envío' });
  }
});

// POST /api/shipments - Crear nuevo envío (solo admin)
app.post('/api/shipments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientEmail, truckId, origin, destination, product, estimatedArrival } = req.body;

    // Validación
    if (!clientEmail || !truckId || !origin || !destination || !product || !estimatedArrival) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Buscar cliente
    const [clients] = await pool.query('SELECT id FROM users WHERE email = ? AND role = ?', [clientEmail, 'client']);
    
    if (clients.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const clientId = clients[0].id;

    // Crear envío
    const [result] = await pool.query(
      `INSERT INTO shipments (
        client_id, truck_id, origin, destination, product, 
        estimated_arrival, status, current_lat, current_lng, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'en_ruta', ?, ?, ?)`,
      [
        clientId,
        truckId,
        origin,
        destination,
        product,
        estimatedArrival,
        19.4326 + (Math.random() - 0.5) * 0.1,
        -99.1332 + (Math.random() - 0.5) * 0.1,
        req.user.id
      ]
    );

    // Obtener envío creado
    const [shipments] = await pool.query(
      `SELECT 
        s.*,
        u.email as client_email,
        u.name as client_name
      FROM shipments s
      JOIN users u ON s.client_id = u.id
      WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ shipment: shipments[0] });
  } catch (error) {
    console.error('Error al crear envío:', error);
    res.status(500).json({ error: 'Error al crear envío' });
  }
});

// PATCH /api/shipments/:id - Actualizar envío (solo admin)
app.patch('/api/shipments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, currentLat, currentLng } = req.body;
    const shipmentId = req.params.id;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (currentLat !== undefined) {
      updates.push('current_lat = ?');
      params.push(currentLat);
    }
    if (currentLng !== undefined) {
      updates.push('current_lng = ?');
      params.push(currentLng);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(shipmentId);

    await pool.query(
      `UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Obtener envío actualizado
    const [shipments] = await pool.query(
      `SELECT 
        s.*,
        u.email as client_email,
        u.name as client_name
      FROM shipments s
      JOIN users u ON s.client_id = u.id
      WHERE s.id = ?`,
      [shipmentId]
    );

    res.json({ shipment: shipments[0] });
  } catch (error) {
    console.error('Error al actualizar envío:', error);
    res.status(500).json({ error: 'Error al actualizar envío' });
  }
});

// DELETE /api/shipments/:id - Eliminar envío (solo admin)
app.delete('/api/shipments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM shipments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Envío eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar envío:', error);
    res.status(500).json({ error: 'Error al eliminar envío' });
  }
});

// ==================== RUTAS DE DATOS DE SENSORES ====================

// POST /api/sensor-data/:shipmentId - Agregar datos de sensores
app.post('/api/sensor-data/:shipmentId', authenticateToken, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const {
      temperature,
      humidity,
      pressure,
      nh3_level,
      tma_level,
      ethylene_level,
      light_detected,
      movement_detected,
      coupling_status
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO sensor_data (
        shipment_id, temperature, humidity, pressure, 
        nh3_level, tma_level, ethylene_level,
        light_detected, movement_detected, coupling_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shipmentId,
        temperature,
        humidity,
        pressure,
        nh3_level,
        tma_level,
        ethylene_level,
        light_detected,
        movement_detected,
        coupling_status
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'Datos guardados' });
  } catch (error) {
    console.error('Error al guardar datos de sensores:', error);
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

// GET /api/sensor-data/:shipmentId - Obtener histórico de sensores
app.get('/api/sensor-data/:shipmentId', authenticateToken, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const limit = req.query.limit || 100;

    const [data] = await pool.query(
      `SELECT * FROM sensor_data 
       WHERE shipment_id = ? 
       ORDER BY recorded_at DESC 
       LIMIT ?`,
      [shipmentId, parseInt(limit)]
    );

    res.json({ data });
  } catch (error) {
    console.error('Error al obtener datos de sensores:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// ==================== RUTAS DE USUARIOS ====================

// GET /api/users - Listar usuarios (solo admin)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, name, role, company, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({ users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/users/clients - Listar solo clientes (para admin al crear envíos)
app.get('/api/users/clients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [clients] = await pool.query(
      'SELECT id, email, name, company FROM users WHERE role = ? ORDER BY name',
      ['client']
    );

    res.json({ clients });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// ==================== DATOS IOT Y CLASIFICACIONES ====================

// GET /api/iot/readings - Obtener lecturas de sensores IoT
app.get('/api/iot/readings', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, sensorType, truckId, deviceId } = req.query;

    let query = 'SELECT * FROM iot_sensor_readings WHERE 1=1';
    const params = [];

    if (sensorType) {
      query += ' AND sensor_type = ?';
      params.push(sensorType);
    }

    if (truckId) {
      query += ' AND truck_id = ?';
      params.push(truckId);
    }

    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }

    query += ' ORDER BY recorded_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [readings] = await pool.query(query, params);

    res.json({ readings, count: readings.length });
  } catch (error) {
    console.error('Error al obtener lecturas IoT:', error);
    res.status(500).json({ error: 'Error al obtener lecturas IoT' });
  }
});

// GET /api/iot/classifications - Obtener datos clasificados por categoría
app.get('/api/iot/classifications', authenticateToken, async (req, res) => {
  try {
    const { category, severity, limit = 100 } = req.query;

    let query = `
      SELECT 
        sc.*,
        isr.device_id,
        isr.truck_id,
        isr.sensor_type,
        isr.sensor_value,
        isr.unit,
        isr.location_lat,
        isr.location_lng,
        isr.recorded_at
      FROM sensor_classifications sc
      INNER JOIN iot_sensor_readings isr ON sc.reading_id = isr.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND sc.category = ?';
      params.push(category);
    }

    if (severity) {
      query += ' AND sc.severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY sc.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [classifications] = await pool.query(query, params);

    res.json({ classifications, count: classifications.length });
  } catch (error) {
    console.error('Error al obtener clasificaciones:', error);
    res.status(500).json({ error: 'Error al obtener clasificaciones' });
  }
});

// GET /api/iot/stats - Estadísticas de clasificaciones
app.get('/api/iot/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await mqttService.getClassificationStats();
    
    // Estadísticas adicionales
    const [totals] = await pool.query(`
      SELECT 
        COUNT(DISTINCT device_id) as total_devices,
        COUNT(*) as total_readings,
        COUNT(DISTINCT truck_id) as total_trucks
      FROM iot_sensor_readings
      WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    res.json({ 
      classifications: stats,
      totals: totals[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/iot/by-category/:category - Datos agrupados por categoría
app.get('/api/iot/by-category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;

    const query = `
      SELECT 
        isr.*,
        sc.severity,
        sc.classification
      FROM iot_sensor_readings isr
      INNER JOIN sensor_classifications sc ON sc.reading_id = isr.id
      WHERE sc.category = ?
      ORDER BY isr.recorded_at DESC
      LIMIT ?
    `;

    const [data] = await pool.query(query, [category, parseInt(limit)]);

    res.json({ 
      category,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error al obtener datos por categoría:', error);
    res.status(500).json({ error: 'Error al obtener datos por categoría' });
  }
});

// POST /api/iot/publish - Publicar mensaje MQTT (para testing)
app.post('/api/iot/publish', authenticateToken, async (req, res) => {
  try {
    const { topic, message } = req.body;

    if (!topic || !message) {
      return res.status(400).json({ error: 'Topic y message son requeridos' });
    }

    const success = mqttService.publish(topic, message);

    if (success) {
      res.json({ message: 'Mensaje publicado exitosamente', topic });
    } else {
      res.status(500).json({ error: 'Error al publicar mensaje' });
    }
  } catch (error) {
    console.error('Error al publicar mensaje MQTT:', error);
    res.status(500).json({ error: 'Error al publicar mensaje MQTT' });
  }
});

// ==================== RUTAS DE TESTING (ESP32 NODO TEST) ====================

// GET /api/testing/data - Obtener datos del nodo de prueba (ID 99)
app.get('/api/testing/data', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    
    // Obtener últimos datos del nodo test (HIELERA_99)
    const query = `
      SELECT 
        isr.*,
        sc.severity,
        sc.category
      FROM iot_sensor_readings isr
      LEFT JOIN sensor_classifications sc ON sc.device_id = isr.device_id 
        AND sc.classified_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
      WHERE isr.device_id = 'HIELERA_99'
      ORDER BY isr.recorded_at DESC
      LIMIT ?
    `;

    const [data] = await pool.query(query, [parseInt(limit)]);

    // Agrupar por tipo de sensor para facilitar visualización
    const grouped = {
      temperature: [],
      humidity: [],
      ethylene: []
    };

    data.forEach(row => {
      if (grouped[row.sensor_type]) {
        grouped[row.sensor_type].push({
          value: row.sensor_value,
          unit: row.unit,
          severity: row.severity || 'normal',
          timestamp: row.recorded_at
        });
      }
    });

    res.json({ 
      testMode: true,
      deviceId: 'HIELERA_99',
      data: grouped,
      rawData: data,
      count: data.length
    });
  } catch (error) {
    console.error('Error al obtener datos de testing:', error);
    res.status(500).json({ error: 'Error al obtener datos de testing' });
  }
});

// GET /api/testing/stats - Estadísticas del modo testing
app.get('/api/testing/stats', authenticateToken, async (req, res) => {
  try {
    // Total de lecturas del nodo test
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total FROM iot_sensor_readings WHERE device_id = 'HIELERA_99'`
    );

    // Últimas 24 horas
    const [last24h] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM iot_sensor_readings 
       WHERE device_id = 'HIELERA_99' 
       AND recorded_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    // Promedios de los últimos datos
    const [avgData] = await pool.query(
      `SELECT 
        sensor_type,
        AVG(sensor_value) as avg_value,
        MIN(sensor_value) as min_value,
        MAX(sensor_value) as max_value,
        COUNT(*) as count
       FROM iot_sensor_readings
       WHERE device_id = 'HIELERA_99'
       AND recorded_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
       GROUP BY sensor_type`
    );

    // Primera y última lectura
    const [firstReading] = await pool.query(
      `SELECT MIN(recorded_at) as first_timestamp 
       FROM iot_sensor_readings 
       WHERE device_id = 'HIELERA_99'`
    );

    const [lastReading] = await pool.query(
      `SELECT MAX(recorded_at) as last_timestamp 
       FROM iot_sensor_readings 
       WHERE device_id = 'HIELERA_99'`
    );

    // Contadores por severidad
    const [severityCounts] = await pool.query(
      `SELECT 
        severity,
        COUNT(*) as count
       FROM sensor_classifications
       WHERE device_id = 'HIELERA_99'
       AND classified_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY severity`
    );

    const stats = {
      testMode: true,
      deviceId: 'HIELERA_99',
      total_readings: totalRows[0]?.total || 0,
      readings_24h: last24h[0]?.count || 0,
      first_reading: firstReading[0]?.first_timestamp,
      last_reading: lastReading[0]?.last_timestamp,
      averages: avgData.reduce((acc, row) => {
        acc[row.sensor_type] = {
          avg: parseFloat(row.avg_value).toFixed(2),
          min: parseFloat(row.min_value).toFixed(2),
          max: parseFloat(row.max_value).toFixed(2),
          count: row.count
        };
        return acc;
      }, {}),
      severity_summary: severityCounts.reduce((acc, row) => {
        acc[row.severity] = row.count;
        return acc;
      }, { normal: 0, warning: 0, critical: 0 })
    };

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de testing:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de testing' });
  }
});

// GET /api/testing/latest - Obtener última lectura del nodo test
app.get('/api/testing/latest', authenticateToken, async (req, res) => {
  try {
    const [latestData] = await pool.query(
      `SELECT 
        sensor_type,
        sensor_value,
        unit,
        recorded_at
       FROM iot_sensor_readings
       WHERE device_id = 'HIELERA_99'
       AND recorded_at = (
         SELECT MAX(recorded_at) 
         FROM iot_sensor_readings 
         WHERE device_id = 'HIELERA_99'
       )`
    );

    const latest = latestData.reduce((acc, row) => {
      acc[row.sensor_type] = {
        value: row.sensor_value,
        unit: row.unit,
        timestamp: row.recorded_at
      };
      return acc;
    }, {});

    res.json({
      testMode: true,
      deviceId: 'HIELERA_99',
      data: latest,
      hasData: latestData.length > 0
    });
  } catch (error) {
    console.error('Error al obtener última lectura:', error);
    res.status(500).json({ error: 'Error al obtener última lectura' });
  }
});

// DELETE /api/testing/clear - Limpiar todos los datos de testing (solo admin)
app.delete('/api/testing/clear', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Eliminar clasificaciones primero (foreign key)
    await pool.query(`DELETE FROM sensor_classifications WHERE device_id = 'HIELERA_99'`);
    
    // Eliminar lecturas
    const [result] = await pool.query(`DELETE FROM iot_sensor_readings WHERE device_id = 'HIELERA_99'`);

    res.json({ 
      message: 'Datos de testing eliminados correctamente',
      deletedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error al limpiar datos de testing:', error);
    res.status(500).json({ error: 'Error al limpiar datos de testing' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`🚀 Backend servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`🔐 JWT Secret configurado: ${JWT_SECRET ? 'Sí' : 'No'}`);
});
