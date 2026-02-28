# 🔌 Integración con Arduino/ESP32

Guía completa para integrar sensores físicos con el dashboard.

## 📋 Hardware Requerido

### Microcontrolador
- **ESP32** (recomendado) o **Arduino con módulo LoRa**
- Módulo LoRaWAN (ej: RN2903, RFM95W)

### Sensores de Seguridad
- **LDR** (Light Dependent Resistor): 5mm, cualquier modelo
- **IMU**: MPU6050 o MPU9250 (I2C)
- **Sensor de Efecto Hall**: A3144 o similar

### Sensores Químicos
- **MQ-137** (Amoniaco NH₃)
- **MQ-138** (TMA - Trimetilamina)
- **MQ-3** o sensor específico para etileno (si disponible)

### Sensores Ambientales
- **DHT22** o **BME280** (Temperatura y Humedad)
- **BMP280** (Presión atmosférica)

### Alimentación
- Batería LiPo 3.7V (para monitoreo de voltaje)
- Regulador de voltaje si es necesario

---

## 🔧 Código Arduino/ESP32

### Instalación de Librerías

```cpp
// En Arduino IDE: Sketch > Include Library > Manage Libraries
// Instalar:
// - LoRa by Sandeep Mistry
// - Adafruit MPU6050
// - DHT sensor library
// - Adafruit BME280
// - Nanopb (para Protocol Buffers)
```

### Estructura del Proyecto

```
IoT-Food-Transport/
├── IoT-Food-Transport.ino    # Archivo principal
├── sensors.h                  # Funciones de sensores
├── lora.h                     # LoRaWAN
├── sensordata.pb.h            # Protobuf generado
└── sensordata.pb.c
```

---

## 📝 Código Principal (IoT-Food-Transport.ino)

```cpp
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <DHT.h>
#include <LoRa.h>
#include <pb_encode.h>
#include "sensordata.pb.h"
#include <mbedtls/sha256.h>

// Configuración de pines
#define LDR_PIN A0
#define HALL_PIN 2
#define DHT_PIN 4
#define MQ137_PIN A1  // NH3
#define MQ138_PIN A2  // TMA
#define MQ3_PIN A3    // Etileno (aproximado)
#define BATTERY_PIN A4

// Configuración LoRa
#define LORA_SS 10
#define LORA_RST 9
#define LORA_DIO0 2

// Objetos de sensores
Adafruit_MPU6050 mpu;
DHT dht(DHT_PIN, DHT22);

// Variables globales
uint32_t sequenceNumber = 0;
uint8_t previousHash[32] = {0};
unsigned long lastTransmission = 0;
const unsigned long TRANSMISSION_INTERVAL = 300000; // 5 minutos

// Duty cycle para sensores de gas (30-45s cada 15 min)
unsigned long lastGasReading = 0;
const unsigned long GAS_READING_INTERVAL = 900000; // 15 minutos
const unsigned long GAS_WARMUP_TIME = 40000; // 40 segundos de calentamiento
bool gasReadingActive = false;
uint32_t dutyCycleCounter = 0;

void setup() {
  Serial.begin(115200);
  
  // Inicializar pines
  pinMode(LDR_PIN, INPUT);
  pinMode(HALL_PIN, INPUT_PULLUP);
  pinMode(BATTERY_PIN, INPUT);
  
  // Inicializar I2C
  Wire.begin();
  
  // Inicializar IMU
  if (!mpu.begin()) {
    Serial.println("Error: MPU6050 not found");
    while (1) delay(10);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  
  // Inicializar DHT
  dht.begin();
  
  // Inicializar LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(915E6)) {  // 915 MHz para América
    Serial.println("Error: LoRa init failed");
    while (1) delay(10);
  }
  
  Serial.println("✅ Food Transport Monitor - Ready");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Gestión de duty cycle de sensores de gas
  if (currentTime - lastGasReading >= GAS_READING_INTERVAL) {
    gasReadingActive = true;
    lastGasReading = currentTime;
    dutyCycleCounter++;
    Serial.println("🔥 Starting gas sensor warm-up...");
  }
  
  // Desactivar sensores de gas después del tiempo de lectura
  if (gasReadingActive && (currentTime - lastGasReading >= GAS_WARMUP_TIME)) {
    gasReadingActive = false;
    Serial.println("❄️ Gas sensors in sleep mode");
  }
  
  // Transmisión principal
  if (currentTime - lastTransmission >= TRANSMISSION_INTERVAL) {
    lastTransmission = currentTime;
    
    // Leer todos los sensores
    SensorData data = readAllSensors();
    
    // Calcular hash
    calculateHash(&data);
    
    // Codificar con Protobuf
    uint8_t buffer[256];
    pb_ostream_t stream = pb_ostream_from_buffer(buffer, sizeof(buffer));
    
    if (pb_encode(&stream, SensorData_fields, &data)) {
      // Transmitir vía LoRa
      transmitLoRa(buffer, stream.bytes_written);
      
      sequenceNumber++;
      Serial.print("📤 Message #");
      Serial.print(sequenceNumber);
      Serial.println(" sent");
    } else {
      Serial.println("❌ Protobuf encoding failed");
    }
  }
  
  delay(100);
}

// Función para leer todos los sensores
SensorData readAllSensors() {
  SensorData data = SensorData_init_zero;
  
  // Device ID
  strcpy(data.device_id, "DEVICE_001");
  
  // Timestamp
  data.timestamp = millis();
  
  // Secuencia
  data.sequence_number = sequenceNumber;
  
  // === SENSORES DE SEGURIDAD ===
  
  // LDR: detecta luz (apertura)
  int ldrValue = analogRead(LDR_PIN);
  data.security.ldr_light_detected = (ldrValue > 100); // Umbral ajustable
  
  // Efecto Hall: detecta imán (acoplamiento)
  data.security.hall_magnet_attached = digitalRead(HALL_PIN) == LOW;
  
  // IMU: aceleración
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  
  data.security.imu_acceleration_x = a.acceleration.x;
  data.security.imu_acceleration_y = a.acceleration.y;
  data.security.imu_acceleration_z = a.acceleration.z;
  
  // Calcular magnitud total
  float totalAccel = sqrt(
    pow(a.acceleration.x, 2) + 
    pow(a.acceleration.y, 2) + 
    pow(a.acceleration.z, 2)
  );
  
  // Alerta si aceleración supera 1.5g (después de restar gravedad)
  data.security.imu_movement_alert = (abs(totalAccel - 9.8) > 1.5);
  
  // === SENSORES QUÍMICOS ===
  
  if (gasReadingActive) {
    // Leer sensores MQ (calibración requerida)
    float mq137 = analogRead(MQ137_PIN);
    float mq138 = analogRead(MQ138_PIN);
    float mq3 = analogRead(MQ3_PIN);
    
    // Conversión a ppm (fórmulas aproximadas, calibrar con gases conocidos)
    data.chemical.ammonia_nh3 = convertMQ137ToPPM(mq137);
    data.chemical.trimethylamine_tma = convertMQ138ToPPM(mq138);
    data.chemical.ethylene = convertMQ3ToPPM(mq3);
    
    data.chemical.duty_cycle_counter = dutyCycleCounter;
    data.chemical.next_reading_time = lastGasReading + GAS_READING_INTERVAL;
  } else {
    // Sensores en modo sleep, usar últimos valores o 0
    data.chemical.ammonia_nh3 = 0;
    data.chemical.trimethylamine_tma = 0;
    data.chemical.ethylene = 0;
    data.chemical.duty_cycle_counter = dutyCycleCounter;
    data.chemical.next_reading_time = lastGasReading + GAS_READING_INTERVAL;
  }
  
  // === SENSORES AMBIENTALES ===
  
  data.environmental.temperature = dht.readTemperature();
  data.environmental.humidity = dht.readHumidity();
  data.environmental.pressure = 1013.25; // Si tienes BMP280, leer aquí
  
  // === SISTEMA ===
  
  // Batería
  int batteryRaw = analogRead(BATTERY_PIN);
  data.battery_voltage = (batteryRaw / 1023.0) * 4.2; // Ajustar según divisor de voltaje
  
  // RSSI (señal LoRa)
  data.signal_strength = LoRa.packetRssi();
  
  return data;
}

// Conversión MQ137 a ppm de NH3 (calibrar con sensor real)
float convertMQ137ToPPM(float rawValue) {
  // Fórmula aproximada: ajustar según datasheet y calibración
  float ratio = rawValue / 1023.0;
  float ppm = pow(10, ((log10(ratio) - 0.8) / -0.4));
  return ppm;
}

// Conversión MQ138 a ppm de TMA (calibrar)
float convertMQ138ToPPM(float rawValue) {
  float ratio = rawValue / 1023.0;
  float ppm = pow(10, ((log10(ratio) - 0.6) / -0.35));
  return ppm;
}

// Conversión MQ3 a ppm (aproximación para etileno)
float convertMQ3ToPPM(float rawValue) {
  float ratio = rawValue / 1023.0;
  float ppm = ratio * 500; // Muy aproximado, idealmente usar sensor específico
  return ppm;
}

// Calcular hash SHA-256
void calculateHash(SensorData* data) {
  mbedtls_sha256_context ctx;
  mbedtls_sha256_init(&ctx);
  mbedtls_sha256_starts(&ctx, 0);
  
  // Hashear campos relevantes (sin el hash actual)
  mbedtls_sha256_update(&ctx, (uint8_t*)data->device_id, strlen(data->device_id));
  mbedtls_sha256_update(&ctx, (uint8_t*)&data->timestamp, sizeof(data->timestamp));
  mbedtls_sha256_update(&ctx, (uint8_t*)&data->sequence_number, sizeof(data->sequence_number));
  
  uint8_t currentHash[32];
  mbedtls_sha256_finish(&ctx, currentHash);
  
  // Copiar hash anterior
  memcpy(data->hash_previous, previousHash, 32);
  
  // Guardar hash actual
  memcpy(data->hash_current, currentHash, 32);
  memcpy(previousHash, currentHash, 32);
  
  mbedtls_sha256_free(&ctx);
}

// Transmitir datos vía LoRa
void transmitLoRa(uint8_t* buffer, size_t length) {
  LoRa.beginPacket();
  LoRa.write(buffer, length);
  LoRa.endPacket();
  
  Serial.print("📡 Transmitted ");
  Serial.print(length);
  Serial.println(" bytes");
}
```

---

## 🌐 Gateway LoRaWAN → MQTT

El gateway debe recibir los datos LoRaWAN y reenviarlos al broker MQTT.

### Opción 1: The Things Network (TTN)

1. Registrar dispositivo en TTN: https://www.thethingsnetwork.org/
2. Configurar integración MQTT
3. Usar webhook para reenviar a tu broker

### Opción 2: Gateway Personalizado (Raspberry Pi + LoRa)

```python
# gateway.py - Python script en Raspberry Pi
import paho.mqtt.client as mqtt
from SX127x.LoRa import LoRa
import time

class LoRaGateway(LoRa):
    def __init__(self):
        super(LoRaGateway, self).__init__(verbose=False)
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect("broker.emqx.io", 1883, 60)
        
    def on_rx_done(self):
        payload = self.read_payload(nocheck=True)
        rssi = self.get_pkt_rssi_value()
        
        # Publicar en MQTT
        topic = "food/transport/sensors/DEVICE_001"
        self.mqtt_client.publish(topic, bytes(payload))
        
        print(f"📦 Forwarded {len(payload)} bytes (RSSI: {rssi})")
        
        self.clear_irq_flags(RxDone=1)
        self.reset_ptr_rx()
        self.set_mode(MODE.RXCONT)

# Iniciar gateway
gateway = LoRaGateway()
gateway.set_mode(MODE.STDBY)
gateway.set_pa_config(pa_select=1)
gateway.set_freq(915.0)
gateway.set_mode(MODE.RXCONT)

print("🌐 LoRa Gateway listening...")

while True:
    time.sleep(1)
```

---

## 🔐 Carcasa IP65

### Diseño Mecánico

1. **Membrana Hidrofóbica**: Colocar en orificios de ventilación para sensores de gas
   - Gore-Tex u otra membrana PTFE
   - Permite paso de gases, bloquea agua

2. **Sellado**: 
   - O-rings en tapas
   - Silicona en bordes
   - Prensaestopas para cables

3. **Montaje de Sensores**:
   - IMU: Fijo a estructura interna
   - LDR: Apuntando hacia tapa
   - Hall: En tapa, imán en pared del camión

### Materiales
- **Caja**: Policarbonato o ABS
- **Certificación**: IP65 (resistente a polvo y chorros de agua)

---

## ⚡ Gestión de Energía

```cpp
// Modo de bajo consumo entre transmisiones
void enterDeepSleep(unsigned long sleepTimeMs) {
  Serial.println("💤 Entering deep sleep...");
  
  // Apagar sensores no críticos
  digitalWrite(GAS_SENSOR_POWER_PIN, LOW);
  
  // ESP32 deep sleep
  esp_sleep_enable_timer_wakeup(sleepTimeMs * 1000);
  esp_deep_sleep_start();
}
```

---

## 📊 Calibración de Sensores MQ

Los sensores MQ requieren calibración con gases conocidos:

1. **Precalentamiento**: 24-48 horas al aire limpio
2. **Curva R0**: Determinar resistencia en aire limpio
3. **Curvas de gas**: Usar concentraciones conocidas
4. **Fórmulas**: Ajustar según datasheet

**Referencia**: https://www.instructables.com/How-to-Calibrate-MQ-Gas-Sensors/

---

## ✅ Checklist de Implementación

- [ ] Hardware ensamblado y cableado correcto
- [ ] Sensores funcionando individualmente
- [ ] LoRa transmitiendo y recibiendo
- [ ] Gateway reenviando a MQTT
- [ ] Dashboard mostrando datos
- [ ] Hash-chaining validando correctamente
- [ ] Alertas activándose según esperado
- [ ] Carcasa sellada IP65
- [ ] Batería con autonomía suficiente
- [ ] Pruebas de campo en camión real

---

## 🆘 Soporte

Para problemas de integración:
- Revisar logs en Serial Monitor (115200 baud)
- Verificar voltajes y conexiones
- Usar simulador del dashboard primero
- Consultar datasheets de sensores

---

**¡Éxito con tu implementación! 🚀**
