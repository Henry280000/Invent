/* eslint-env node */
/* eslint-disable no-undef */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Colores para consola
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Configuración
const HIELERA_ID = 99;
const INTERVAL_MS = 30000; // 30 segundos
const GATEWAY_IP = '192.168.4.1';

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

/**
 * Verificar si está conectado al Gateway ESP32
 */
async function isConnectedToGateway() {
  try {
    const { stdout, stderr } = await execPromise(`ping -c 1 -W 1 ${GATEWAY_IP}`);
    return !stderr && stdout.includes('1 packets transmitted, 1 packets received');
  } catch (error) {
    return false;
  }
}

/**
 * Generar datos simulados realistas para MARISCOS
 * Los mariscos requieren:
 * - Temperatura: -1°C a 4°C (ideal: 0-2°C)
 * - Humedad: 85-95% (alta para mantener frescura)
 * - Etileno: 0-5 ppm (muy bajo, no producen etileno)
 */
function generateSensorData() {
  // Temperatura con ligera variación alrededor de 1°C (óptimo para mariscos)
  const baseTemp = 1.0;
  const tempVariation = (Math.random() - 0.5) * 2; // ±1°C
  const temperature = (baseTemp + tempVariation).toFixed(2);

  // Humedad alta y estable (85-95%)
  const baseHum = 90.0;
  const humVariation = (Math.random() - 0.5) * 10; // ±5%
  const humidity = (baseHum + humVariation).toFixed(2);

  // Etileno muy bajo (0-5 ppm)
  const ethylene = (Math.random() * 5).toFixed(2);

  return {
    temperature,
    humidity,
    ethylene
  };
}

/**
 * Guardar datos en MySQL
 */
async function saveSensorData(hieleraId, temp, hum, ethylene) {
  const query = `
    INSERT INTO iot_sensor_readings 
    (device_id, sensor_type, sensor_value, unit, location_lat, location_lng, truck_id, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  try {
    // Guardar temperatura
    await pool.query(query, [
      `HIELERA_${hieleraId}`,
      'temperature',
      parseFloat(temp),
      '°C',
      null,
      null,
      `TRUCK_${hieleraId}`
    ]);

    // Guardar humedad
    await pool.query(query, [
      `HIELERA_${hieleraId}`,
      'humidity',
      parseFloat(hum),
      '%',
      null,
      null,
      `TRUCK_${hieleraId}`
    ]);

    // Guardar etileno
    await pool.query(query, [
      `HIELERA_${hieleraId}`,
      'ethylene',
      parseFloat(ethylene),
      'ppm',
      null,
      null,
      `TRUCK_${hieleraId}`
    ]);

    return true;
  } catch (error) {
    console.error('❌ Error guardando en BD:', error.message);
    return false;
  }
}

/**
 * Ciclo principal de simulación
 */
async function simulateDataLoop() {
  console.log(`${colors.green}🔄 Simulador iniciado${colors.reset}`);
  console.log(`📦 Hielera ID: ${HIELERA_ID}`);
  console.log(`⏱️  Intervalo: ${INTERVAL_MS / 1000} segundos`);
  console.log(`📡 Gateway IP: ${GATEWAY_IP}`);
  console.log(`${colors.yellow}⚠️  SOLO enviará datos cuando conectes a la WiFi del Gateway${colors.reset}\n`);

  let count = 0;

  // Verificar conexión a base de datos
  try {
    await pool.query('SELECT 1');
    console.log(`${colors.green}✅ Conectado a MySQL${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error conectando a MySQL:${colors.reset}`, error.message);
    process.exit(1);
  }

  // Intervalo de envío
  setInterval(async () => {
    count++;
    
    const timestamp = new Date().toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    // SOLO enviar si está conectado al Gateway
    const connected = await isConnectedToGateway();
    
    if (!connected) {
      console.log(`${colors.yellow}⚠️  [${timestamp}] Esperando conexión al Gateway ${GATEWAY_IP}${colors.reset}`);
      console.log(`   ${colors.yellow}→ Conéctate a la WiFi: ESP32-Gateway-Hieleras${colors.reset}\n`);
      return;
    }

    console.log(`${colors.green}✅ [${timestamp}] Conectado al Gateway${colors.reset}`);
    
    const data = generateSensorData();
    
    console.log(`${colors.blue}📊 Envío #${count}${colors.reset}`);
    console.log(`   🌡️  Temperatura: ${data.temperature}°C`);
    console.log(`   💧 Humedad: ${data.humidity}%`);
    console.log(`   🍃 Etileno: ${data.ethylene} ppm`);

    const success = await saveSensorData(
      HIELERA_ID, 
      data.temperature, 
      data.humidity, 
      data.ethylene
    );

    if (success) {
      console.log(`   ${colors.green}✅ Guardado en MySQL${colors.reset}`);
      console.log('');
    } else {
      console.log(`   ${colors.yellow}⚠️  Error al guardar${colors.reset}\n`);
    }
  }, INTERVAL_MS);

  // Verificar conexión inicial y enviar primer dato
  console.log(`${colors.blue}🔍 Verificando conexión al Gateway...${colors.reset}`);
  const initiallyConnected = await isConnectedToGateway();
  
  if (initiallyConnected) {
    console.log(`${colors.green}✅ Conectado al Gateway - Enviando primer dato${colors.reset}\n`);
    
    const firstData = generateSensorData();
    console.log(`${colors.blue}📊 Primer envío${colors.reset}`);
    console.log(`   🌡️  Temperatura: ${firstData.temperature}°C`);
    console.log(`   💧 Humedad: ${firstData.humidity}%`);
    console.log(`   🍃 Etileno: ${firstData.ethylene} ppm`);
    
    const success = await saveSensorData(
      HIELERA_ID, 
      firstData.temperature, 
      firstData.humidity, 
      firstData.ethylene
    );

    if (success) {
      console.log(`   ${colors.green}✅ Guardado en MySQL${colors.reset}`);
      console.log('');
    }
  } else {
    console.log(`${colors.yellow}⚠️  NO conectado al Gateway ${GATEWAY_IP}${colors.reset}`);
    console.log(`   ${colors.yellow}→ Conéctate a la WiFi: ESP32-Gateway-Hieleras${colors.reset}`);
    console.log(`   ${colors.yellow}→ IP del Gateway: 192.168.4.1${colors.reset}`);
    console.log(`   ${colors.yellow}→ Esperando conexión...${colors.reset}\n`);
  }
}

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  console.log(`\n${colors.yellow}⏹️  Simulador detenido${colors.reset}`);
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(`\n${colors.yellow}⏹️  Simulador detenido${colors.reset}`);
  await pool.end();
  process.exit(0);
});

// Iniciar simulación
simulateDataLoop().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
