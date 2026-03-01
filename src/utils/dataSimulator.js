import protobufService from '../services/protobufService';

/**
 * Simulador de datos de sensores para testing
 * Genera datos realistas que simulan el comportamiento de una carcasa de transporte
 */
class DataSimulator {
  constructor() {
    this.sequenceNumber = 0;
    this.previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    this.isRunning = false;
    this.intervalId = null;
    this.scenarioMode = 'normal'; // normal, degradation, security_breach, temperature_failure
  }

  /**
   * Calcula un hash simple simulado
   */
  async calculateSimpleHash(data) {
    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Genera datos de sensores de seguridad
   */
  generateSecurityData() {
    const scenarios = {
      normal: {
        ldr_light_detected: false,
        imu_movement_alert: false,
        hall_magnet_attached: true,
        imu_acceleration_x: (Math.random() - 0.5) * 0.2,
        imu_acceleration_y: (Math.random() - 0.5) * 0.2,
        imu_acceleration_z: 1.0 + (Math.random() - 0.5) * 0.1
      },
      security_breach: {
        ldr_light_detected: Math.random() > 0.5,
        imu_movement_alert: Math.random() > 0.3,
        hall_magnet_attached: Math.random() > 0.4,
        imu_acceleration_x: (Math.random() - 0.5) * 3.0,
        imu_acceleration_y: (Math.random() - 0.5) * 3.0,
        imu_acceleration_z: 1.0 + (Math.random() - 0.5) * 2.0
      }
    };

    return scenarios[this.scenarioMode === 'security_breach' ? 'security_breach' : 'normal'];
  }

  /**
   * Genera datos ambientales
   */
  generateEnvironmentalData() {
    const baseTemp = this.scenarioMode === 'temperature_failure' ? 8.0 : 2.0;
    const tempVariation = this.scenarioMode === 'temperature_failure' ? 5.0 : 1.5;

    return {
      temperature: baseTemp + (Math.random() - 0.5) * tempVariation,
      humidity: 85 + (Math.random() - 0.5) * 10,
      pressure: 1013 + (Math.random() - 0.5) * 20
    };
  }

  /**
   * Genera datos químicos
   */
  generateChemicalData() {
    const env = this.generateEnvironmentalData();
    
    // Modelo de degradación: a mayor temperatura, mayor producción de gases
    const tempFactor = Math.exp(0.1 * env.temperature);
    
    let baseNH3 = 2.0 * tempFactor;
    let baseTMA = 0.5 * tempFactor;
    let baseEthylene = 20 * tempFactor;

    if (this.scenarioMode === 'degradation') {
      baseNH3 *= 5;
      baseTMA *= 8;
      baseEthylene *= 3;
    } else if (this.scenarioMode === 'temperature_failure') {
      // Inconsistencia biológica: temperatura alta sin aumento proporcional de NH3
      baseNH3 *= 10; // Mucho más alto de lo esperado
    }

    return {
      ammonia_nh3: baseNH3 + Math.random() * 2,
      trimethylamine_tma: baseTMA + Math.random() * 1,
      ethylene: baseEthylene + Math.random() * 10,
      duty_cycle_counter: Math.floor(this.sequenceNumber / 30), // 1 ciclo cada 30 mensajes
      next_reading_time: Date.now() + (15 * 60 * 1000) // 15 minutos
    };
  }

  /**
   * Genera un mensaje completo de sensores
   */
  async generateSensorMessage() {
    this.sequenceNumber++;

    const dataToHash = {
      device_id: 'SIM_DEVICE_001',
      timestamp: Date.now(),
      security: this.generateSecurityData(),
      chemical: this.generateChemicalData(),
      environmental: this.generateEnvironmentalData(),
      hash_previous: this.previousHash,
      sequence_number: this.sequenceNumber,
      battery_voltage: 3.7 + (Math.random() - 0.5) * 0.3,
      signal_strength: -85 + Math.floor(Math.random() * 20)
    };

    // Calcular hash actual
    const currentHash = await this.calculateSimpleHash(dataToHash);
    
    const message = {
      ...dataToHash,
      hash_current: currentHash
    };

    // Actualizar hash anterior para el próximo mensaje
    this.previousHash = currentHash;

    return message;
  }

  /**
   * Inicia la simulación
   * @param {number} interval - Intervalo en ms (por defecto 5000 = 5 segundos)
   */
  async start(interval = 5000) {
    if (this.isRunning) {
      console.log('⚠️ Simulator is already running');
      return;
    }

    console.log('🎮 Starting data simulator...');
    this.isRunning = true;

    // Asegurar que los servicios estén inicializados
    if (!protobufService.initialized) {
      await protobufService.initialize();
    }

    console.log('⚠️  Nota: Simulador frontend deshabilitado - Usa el simulador backend');

    // Generar y enviar mensajes periódicamente
    this.intervalId = setInterval(async () => {
      try {
        const message = await this.generateSensorMessage();
        
        // Codificar a Protobuf
        const encoded = protobufService.encode(message);
        
        // Ya no se publica a MQTT - el simulador backend maneja esto
        console.log(`📤 Simulated message #${this.sequenceNumber} generated [${this.scenarioMode}] - Backend simulator handles MQTT`);
      } catch (error) {
        console.error('❌ Error in simulator:', error);
      }
    }, interval);
  }

  /**
   * Detiene la simulación
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Simulator is not running');
      return;
    }

    console.log('🛑 Stopping data simulator...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  /**
   * Cambia el escenario de simulación
   * @param {string} mode - normal, degradation, security_breach, temperature_failure
   */
  setScenario(mode) {
    const validModes = ['normal', 'degradation', 'security_breach', 'temperature_failure'];
    
    if (!validModes.includes(mode)) {
      console.error(`❌ Invalid scenario. Valid: ${validModes.join(', ')}`);
      return;
    }

    console.log(`🎭 Scenario changed to: ${mode}`);
    this.scenarioMode = mode;
  }

  /**
   * Reinicia la simulación
   */
  reset() {
    this.stop();
    this.sequenceNumber = 0;
    this.previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    this.scenarioMode = 'normal';
    console.log('🔄 Simulator reset');
  }
}

// Exportar instancia singleton
const dataSimulator = new DataSimulator();

// Exponer en window para acceso desde consola del navegador
if (typeof window !== 'undefined') {
  window.simulator = dataSimulator;
  console.log('🎮 Data Simulator available as window.simulator');
  console.log('Commands:');
  console.log('  simulator.start()           - Start simulation (default 5s interval)');
  console.log('  simulator.start(2000)       - Start with 2s interval');
  console.log('  simulator.stop()            - Stop simulation');
  console.log('  simulator.setScenario(mode) - Change scenario');
  console.log('  Scenarios: normal, degradation, security_breach, temperature_failure');
}

export default dataSimulator;
