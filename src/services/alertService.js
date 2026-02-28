/**
 * Servicio de monitoreo de alertas y degradación de alimentos
 * Implementa la lógica de "Inconsistencia Biológica"
 */

class AlertService {
  constructor() {
    this.alerts = [];
    this.maxAlerts = 50;
    
    // Umbrales de alerta
    this.thresholds = {
      // Sensores químicos (ppm)
      ammonia: {
        low: 5,
        medium: 15,
        high: 30,
        critical: 50
      },
      tma: {
        low: 2,
        medium: 5,
        high: 10,
        critical: 20
      },
      ethylene: {
        low: 50,
        medium: 100,
        high: 200,
        critical: 500
      },
      // Temperatura (°C)
      temperature: {
        min: -2,
        max: 5,
        critical_min: -5,
        critical_max: 10
      },
      // Humedad (%)
      humidity: {
        min: 80,
        max: 95,
        critical_min: 60,
        critical_max: 100
      },
      // Aceleración (g)
      acceleration: {
        normal: 0.5,
        warning: 1.0,
        critical: 2.0
      }
    };
  }

  /**
   * Analiza datos de sensores y genera alertas
   * @param {Object} data - Datos de sensores
   * @returns {Array} Lista de alertas generadas
   */
  analyzeSensorData(data) {
    const newAlerts = [];
    const timestamp = parseInt(data.timestamp);

    // 1. ALERTAS DE SEGURIDAD
    if (data.security) {
      if (data.security.ldr_light_detected) {
        newAlerts.push(this.createAlert(
          'SECURITY',
          'CRITICAL',
          'Apertura no autorizada detectada (LDR)',
          'Se ha detectado entrada de luz en la carcasa',
          timestamp
        ));
      }

      if (data.security.imu_movement_alert) {
        newAlerts.push(this.createAlert(
          'SECURITY',
          'CRITICAL',
          'Movimiento brusco detectado (IMU)',
          'Aceleración anormal que puede indicar manipulación',
          timestamp
        ));
      }

      if (!data.security.hall_magnet_attached) {
        newAlerts.push(this.createAlert(
          'SECURITY',
          'HIGH',
          'Desacoplamiento detectado (Hall)',
          'La carcasa no está correctamente acoplada a la pared del camión',
          timestamp
        ));
      }

      // Verificar aceleración total
      const { imu_acceleration_x = 0, imu_acceleration_y = 0, imu_acceleration_z = 0 } = data.security;
      const totalAcceleration = Math.sqrt(
        imu_acceleration_x ** 2 + 
        imu_acceleration_y ** 2 + 
        imu_acceleration_z ** 2
      );

      if (totalAcceleration > this.thresholds.acceleration.critical) {
        newAlerts.push(this.createAlert(
          'SECURITY',
          'CRITICAL',
          'Impacto severo',
          `Aceleración: ${totalAcceleration.toFixed(2)}g`,
          timestamp
        ));
      } else if (totalAcceleration > this.thresholds.acceleration.warning) {
        newAlerts.push(this.createAlert(
          'SECURITY',
          'MEDIUM',
          'Vibración elevada',
          `Aceleración: ${totalAcceleration.toFixed(2)}g`,
          timestamp
        ));
      }
    }

    // 2. ALERTAS AMBIENTALES
    if (data.environmental) {
      const { temperature, humidity } = data.environmental;

      // Temperatura
      if (temperature < this.thresholds.temperature.critical_min || 
          temperature > this.thresholds.temperature.critical_max) {
        newAlerts.push(this.createAlert(
          'ENVIRONMENTAL',
          'CRITICAL',
          'Temperatura crítica',
          `${temperature.toFixed(1)}°C está fuera del rango seguro`,
          timestamp
        ));
      } else if (temperature < this.thresholds.temperature.min || 
                 temperature > this.thresholds.temperature.max) {
        newAlerts.push(this.createAlert(
          'ENVIRONMENTAL',
          'MEDIUM',
          'Temperatura fuera de rango óptimo',
          `${temperature.toFixed(1)}°C`,
          timestamp
        ));
      }

      // Humedad
      if (humidity < this.thresholds.humidity.critical_min || 
          humidity > this.thresholds.humidity.critical_max) {
        newAlerts.push(this.createAlert(
          'ENVIRONMENTAL',
          'HIGH',
          'Humedad crítica',
          `${humidity.toFixed(1)}% está fuera del rango seguro`,
          timestamp
        ));
      }
    }

    // 3. ALERTAS QUÍMICAS Y DEGRADACIÓN
    if (data.chemical) {
      const { ammonia_nh3, trimethylamine_tma, ethylene } = data.chemical;

      // Amoniaco
      const nh3Level = this.getChemicalLevel(ammonia_nh3, this.thresholds.ammonia);
      if (nh3Level.severity !== 'normal') {
        newAlerts.push(this.createAlert(
          'CHEMICAL',
          nh3Level.severity.toUpperCase(),
          'Nivel de Amoniaco elevado',
          `${ammonia_nh3.toFixed(2)} ppm - ${nh3Level.message}`,
          timestamp
        ));
      }

      // Trimetilamina (TMA)
      const tmaLevel = this.getChemicalLevel(trimethylamine_tma, this.thresholds.tma);
      if (tmaLevel.severity !== 'normal') {
        newAlerts.push(this.createAlert(
          'FOOD_QUALITY',
          tmaLevel.severity.toUpperCase(),
          'Degradación proteica detectada (TMA)',
          `${trimethylamine_tma.toFixed(2)} ppm - ${tmaLevel.message}`,
          timestamp
        ));
      }

      // Etileno
      const ethyleneLevel = this.getChemicalLevel(ethylene, this.thresholds.ethylene);
      if (ethyleneLevel.severity !== 'normal') {
        newAlerts.push(this.createAlert(
          'FOOD_QUALITY',
          ethyleneLevel.severity.toUpperCase(),
          'Maduración acelerada (Etileno)',
          `${ethylene.toFixed(2)} ppm - ${ethyleneLevel.message}`,
          timestamp
        ));
      }

      // 4. INCONSISTENCIA BIOLÓGICA
      if (data.environmental) {
        const biologicalInconsistency = this.checkBiologicalInconsistency(
          ammonia_nh3,
          data.environmental.temperature,
          data.environmental.humidity
        );

        if (!biologicalInconsistency.consistent) {
          newAlerts.push(this.createAlert(
            'BIOLOGICAL',
            'CRITICAL',
            'Inconsistencia Biológica Detectada',
            biologicalInconsistency.message,
            timestamp
          ));
        }
      }
    }

    // Agregar alertas a la lista
    this.alerts.push(...newAlerts);

    // Mantener solo las últimas N alertas
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    return newAlerts;
  }

  /**
   * Verifica inconsistencia biológica: NH3 vs Temperatura
   * @param {number} nh3 - Nivel de amoniaco (ppm)
   * @param {number} temperature - Temperatura (°C)
   * @param {number} humidity - Humedad (%)
   * @returns {Object} Resultado de la verificación
   */
  checkBiologicalInconsistency(nh3, temperature, humidity) {
    // Modelo simplificado: a temperaturas de refrigeración adecuadas (-2°C a 5°C),
    // el NH3 no debería superar ciertos niveles
    
    // Calcular NH3 esperado basado en temperatura
    // A menor temperatura, menor producción de NH3 (descomposición más lenta)
    const expectedMaxNH3 = this.calculateExpectedNH3(temperature, humidity);
    
    const deviation = nh3 - expectedMaxNH3;
    const deviationPercent = (deviation / expectedMaxNH3) * 100;

    if (deviationPercent > 50) {
      return {
        consistent: false,
        message: `NH3 (${nh3.toFixed(2)} ppm) es ${deviationPercent.toFixed(0)}% más alto de lo esperado para ${temperature.toFixed(1)}°C. Posible falla de refrigeración o contaminación previa.`,
        severity: 'critical',
        expectedNH3: expectedMaxNH3,
        actualNH3: nh3,
        deviation: deviationPercent
      };
    }

    return {
      consistent: true,
      message: 'Niveles de NH3 consistentes con la temperatura',
      expectedNH3: expectedMaxNH3,
      actualNH3: nh3,
      deviation: deviationPercent
    };
  }

  /**
   * Calcula el nivel esperado de NH3 basado en temperatura y humedad
   * @param {number} temperature - Temperatura (°C)
   * @param {number} humidity - Humedad (%)
   * @returns {number} Nivel esperado de NH3 (ppm)
   */
  calculateExpectedNH3(temperature, humidity) {
    // Modelo exponencial simplificado
    // A temperaturas de refrigeración óptimas (-2°C a 5°C), NH3 máximo esperado: 3-8 ppm
    // A mayores temperaturas, crece exponencialmente
    
    const baseNH3 = 3; // ppm a 0°C
    const tempFactor = Math.exp(0.1 * temperature); // Factor exponencial
    const humidityFactor = 1 + (humidity - 85) / 100; // Humedad afecta ligeramente
    
    return baseNH3 * tempFactor * humidityFactor;
  }

  /**
   * Determina el nivel de severidad de un sensor químico
   * @param {number} value - Valor actual
   * @param {Object} thresholds - Umbrales del sensor
   * @returns {Object} Nivel y mensaje
   */
  getChemicalLevel(value, thresholds) {
    if (value >= thresholds.critical) {
      return { severity: 'critical', message: 'Nivel crítico - Acción inmediata requerida' };
    } else if (value >= thresholds.high) {
      return { severity: 'high', message: 'Nivel alto - Revisar estado del producto' };
    } else if (value >= thresholds.medium) {
      return { severity: 'medium', message: 'Nivel moderado - Monitoreo requerido' };
    } else if (value >= thresholds.low) {
      return { severity: 'low', message: 'Nivel bajo detectado' };
    }
    return { severity: 'normal', message: 'Nivel normal' };
  }

  /**
   * Crea un objeto de alerta
   * @param {string} category - Categoría de la alerta
   * @param {string} severity - Severidad (LOW, MEDIUM, HIGH, CRITICAL)
   * @param {string} title - Título de la alerta
   * @param {string} description - Descripción detallada
   * @param {number} timestamp - Timestamp de la alerta
   * @returns {Object} Objeto de alerta
   */
  createAlert(category, severity, title, description, timestamp) {
    return {
      id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      severity,
      title,
      description,
      timestamp,
      acknowledged: false,
      createdAt: Date.now()
    };
  }

  /**
   * Obtiene todas las alertas
   * @param {Object} filters - Filtros opcionales
   * @returns {Array} Lista de alertas
   */
  getAlerts(filters = {}) {
    let filtered = [...this.alerts];

    if (filters.severity) {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }

    if (filters.category) {
      filtered = filtered.filter(a => a.category === filters.category);
    }

    if (filters.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === filters.acknowledged);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Marca una alerta como reconocida
   * @param {string} alertId - ID de la alerta
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
    }
  }

  /**
   * Obtiene estadísticas de alertas
   * @returns {Object} Estadísticas
   */
  getAlertStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recent = this.alerts.filter(a => a.createdAt >= last24h);
    const unacknowledged = this.alerts.filter(a => !a.acknowledged);

    return {
      total: this.alerts.length,
      last24h: recent.length,
      unacknowledged: unacknowledged.length,
      bySeverity: {
        critical: this.alerts.filter(a => a.severity === 'CRITICAL').length,
        high: this.alerts.filter(a => a.severity === 'HIGH').length,
        medium: this.alerts.filter(a => a.severity === 'MEDIUM').length,
        low: this.alerts.filter(a => a.severity === 'LOW').length
      },
      byCategory: {
        security: this.alerts.filter(a => a.category === 'SECURITY').length,
        environmental: this.alerts.filter(a => a.category === 'ENVIRONMENTAL').length,
        chemical: this.alerts.filter(a => a.category === 'CHEMICAL').length,
        foodQuality: this.alerts.filter(a => a.category === 'FOOD_QUALITY').length,
        biological: this.alerts.filter(a => a.category === 'BIOLOGICAL').length
      }
    };
  }

  /**
   * Limpia alertas antiguas
   * @param {number} maxAge - Edad máxima en milisegundos
   */
  cleanOldAlerts(maxAge = 7 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    this.alerts = this.alerts.filter(a => (now - a.createdAt) < maxAge);
  }

  /**
   * Reinicia el servicio
   */
  reset() {
    this.alerts = [];
  }
}

// Exportar instancia singleton
const alertService = new AlertService();
export default alertService;
