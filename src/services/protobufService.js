import protobuf from 'protobufjs';

// Definición del esquema Protobuf inline (equivalente al .proto)
const protoDef = `
syntax = "proto3";

package sensordata;

message SecuritySensors {
  bool ldr_light_detected = 1;
  bool imu_movement_alert = 2;
  bool hall_magnet_attached = 3;
  double imu_acceleration_x = 4;
  double imu_acceleration_y = 5;
  double imu_acceleration_z = 6;
}

message ChemicalSensors {
  double ammonia_nh3 = 1;
  double trimethylamine_tma = 2;
  double ethylene = 3;
  uint32 duty_cycle_counter = 4;
  uint64 next_reading_time = 5;
}

message EnvironmentalSensors {
  double temperature = 1;
  double humidity = 2;
  double pressure = 3;
}

message SensorData {
  string device_id = 1;
  uint64 timestamp = 2;
  SecuritySensors security = 3;
  ChemicalSensors chemical = 4;
  EnvironmentalSensors environmental = 5;
  string hash_previous = 6;
  string hash_current = 7;
  uint32 sequence_number = 8;
  double battery_voltage = 9;
  int32 signal_strength = 10;
}
`;

class ProtobufService {
  constructor() {
    this.root = null;
    this.SensorData = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.root = protobuf.parse(protoDef).root;
      this.SensorData = this.root.lookupType('sensordata.SensorData');
      this.initialized = true;
      console.log('✅ Protobuf service initialized');
    } catch (error) {
      console.error('❌ Error initializing Protobuf:', error);
      throw error;
    }
  }

  /**
   * Decodifica un mensaje Protocol Buffer
   * @param {Uint8Array|Buffer} buffer - Buffer con datos codificados
   * @returns {Object} Datos decodificados
   */
  decode(buffer) {
    if (!this.initialized) {
      throw new Error('ProtobufService not initialized. Call initialize() first.');
    }

    try {
      const message = this.SensorData.decode(buffer);
      return this.SensorData.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true
      });
    } catch (error) {
      console.error('❌ Error decoding Protobuf message:', error);
      throw error;
    }
  }

  /**
   * Codifica un objeto JavaScript a Protocol Buffer
   * @param {Object} data - Datos a codificar
   * @returns {Uint8Array} Buffer codificado
   */
  encode(data) {
    if (!this.initialized) {
      throw new Error('ProtobufService not initialized. Call initialize() first.');
    }

    try {
      const errMsg = this.SensorData.verify(data);
      if (errMsg) {
        throw new Error(errMsg);
      }

      const message = this.SensorData.create(data);
      return this.SensorData.encode(message).finish();
    } catch (error) {
      console.error('❌ Error encoding Protobuf message:', error);
      throw error;
    }
  }
}

// Exportar una instancia singleton
const protobufService = new ProtobufService();
export default protobufService;
