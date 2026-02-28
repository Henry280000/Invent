/*
 * ESP32 NODO HIELERA - Sistema de Monitoreo de Hieleras
 * 
 * Funciones:
 * 1. Lee sensores DHT22 (Temperatura y Humedad)
 * 2. Lee sensor MQ-135 (Etileno/gas de maduración)
 * 3. Envía datos al Gateway vía ESP-NOW
 * 
 * Hardware: 
 * - ESP32 DevKit v1 o compatible
 * - DHT22 (pin GPIO 4)
 * - MQ-135 o análogo (pin GPIO 34 - ADC1)
 * 
 * IMPORTANTE: Cambiar HIELERA_ID para cada nodo (1, 2, 3...)
 * Compatible con: ESP32 Arduino Core 3.3.7
 */

#include <esp_now.h>
#include <WiFi.h>
#include <DHT.h>

// Version check
#if !defined(ESP_ARDUINO_VERSION_MAJOR) || ESP_ARDUINO_VERSION_MAJOR < 3
#warning "Este código está optimizado para ESP32 Arduino Core 3.x"
#endif

// ==================== CONFIGURACIÓN ====================

// ¡¡¡ CAMBIAR ESTE NÚMERO PARA CADA HIELERA !!!
#define HIELERA_ID 1  // Cambiar a 2, 3, 4... para cada nueva hielera

// MAC Address del Gateway (DEBES OBTENERLA DEL GATEWAY)
// Para obtenerla, sube este código al Gateway primero y mira el Serial Monitor
// Formato: {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF}
uint8_t gatewayAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF}; // REEMPLAZAR

// Pines de sensores
#define DHTPIN 4          // DHT22 en GPIO4
#define DHTTYPE DHT22     // Tipo de sensor DHT
#define MQ135_PIN 34      // MQ-135 en GPIO34 (ADC1_CH6)

// Configuración de envío
#define SEND_INTERVAL 10000  // Enviar datos cada 10 segundos
unsigned long lastSendTime = 0;

// Sensores
DHT dht(DHTPIN, DHTTYPE);

// Estructura de mensaje (DEBE SER IDÉNTICA AL GATEWAY)
typedef struct struct_message {
    int id;
    float temp;
    float hum;
    float ethylene;
    unsigned long timestamp;
} struct_message;

struct_message myData;

// Variables de control
bool sendSuccess = false;
int sendCount = 0;
int errorCount = 0;

// LED de estado (LED integrado)
#define LED_PIN 2

// ==================== FUNCIONES DE SENSORES ====================

// Leer temperatura y humedad del DHT22
void readDHT22() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  // Verificar si las lecturas fallaron
  if (isnan(temp) || isnan(hum)) {
    Serial.println("❌ Error leyendo DHT22");
    Serial.println("   Verificar:");
    Serial.println("   - Cable DATA conectado a GPIO 4");
    Serial.println("   - VCC conectado a 3.3V (NO 5V)");
    Serial.println("   - GND conectado");
    Serial.println("   - Resistencia pull-up 10kΩ entre DATA y VCC");
    Serial.println("   - Esperar 2-3 segundos después del encendido");
    myData.temp = -99.0;  // Valor de error
    myData.hum = -99.0;
  } else {
    myData.temp = temp;
    myData.hum = hum;
    Serial.printf("🌡️  DHT22: Temp=%.1f°C, Hum=%.1f%%\n", temp, hum);
  }
}

// Leer nivel de gas (etileno) del MQ-135
void readMQ135() {
  // Leer valor analógico (0-4095 en ESP32)
  int rawValue = analogRead(MQ135_PIN);
  
  // Diagnóstico mejorado
  if (rawValue == 0) {
    Serial.println("⚠️  MQ-135: Raw=0 - Sensor posiblemente desconectado");
    Serial.println("   Verificar:");
    Serial.println("   - Cable A0 del sensor conectado a GPIO 34");
    Serial.println("   - VCC conectado (3.3V o 5V)");
    Serial.println("   - GND conectado");
    Serial.println("   - Sensor necesita 24-48h de calentamiento para precisión");
  } else if (rawValue < 100) {
    Serial.printf("⚠️  MQ-135: Raw=%d (muy bajo) - Revisar alimentación\n", rawValue);
  } else {
    Serial.printf("💨 MQ-135: Raw=%d", rawValue);
  }
  
  // Convertir a ppm (valores de ejemplo, calibrar según tu sensor)
  // Fórmula simplificada: ppm = (rawValue / 4095) * 1000
  float ethylenePPM = (rawValue / 4095.0) * 500.0; // Escala 0-500 ppm
  
  myData.ethylene = ethylenePPM;
  
  if (rawValue > 0) {
    Serial.printf(", Etileno=%.1fppm\n", ethylenePPM);
  }
}

// ==================== CALLBACK ESP-NOW ====================

// Callback cuando se envían datos
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  sendSuccess = (status == ESP_NOW_SEND_SUCCESS);
  
  if (sendSuccess) {
    Serial.println("✅ Datos enviados correctamente al Gateway");
    sendCount++;
    // Parpadear LED rápido (éxito)
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
  } else {
    Serial.println("❌ Error enviando datos al Gateway");
    errorCount++;
    // Parpadear LED lento (error)
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(100);
      digitalWrite(LED_PIN, LOW);
      delay(100);
    }
  }
}

// ==================== FUNCIONES DE CONEXIÓN ====================

// Obtener y mostrar MAC Address de este ESP32
void printMAC() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  Serial.printf("📍 MAC Address de esta Hielera: %02X:%02X:%02X:%02X:%02X:%02X\n",
                mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  Serial.println("   (Anota esta dirección si es el Gateway)");
}

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("═══════════════════════════════════════════");
  Serial.printf("  ESP32 NODO HIELERA #%d - Sistema IoT\n", HIELERA_ID);
  Serial.println("═══════════════════════════════════════════");
  
  // Configurar LED de estado
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Mostrar MAC Address
  printMAC();
  
  // 1. Configurar WiFi en modo Station
  Serial.println("\n📶 Configurando WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  Serial.println("✅ WiFi en modo Station");
  
  // 2. Inicializar ESP-NOW
  Serial.println("\n📡 Inicializando ESP-NOW...");
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Error inicializando ESP-NOW");
    ESP.restart();
  }
  Serial.println("✅ ESP-NOW inicializado");
  
  // Registrar callback de envío
  esp_now_register_send_cb(OnDataSent);
  
  // 3. Agregar Gateway como peer
  Serial.println("\n🔗 Registrando Gateway como peer...");
  esp_now_peer_info_t peerInfo;
  memcpy(peerInfo.peer_addr, gatewayAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Error agregando peer (Gateway)");
    Serial.println("⚠️  Verifica que la MAC Address del Gateway sea correcta");
    ESP.restart();
  }
  Serial.println("✅ Gateway registrado como peer");
  
  // 4. Inicializar sensores
  Serial.println("\n🔬 Inicializando sensores...");
  dht.begin();
  pinMode(MQ135_PIN, INPUT);
  Serial.println("⏱️  Esperando 3 segundos para estabilización del DHT22...");
  delay(3000); // Dar más tiempo al DHT22 para estabilizarse
  Serial.println("✅ Sensores inicializados");
  
  // Prueba inicial de sensores
  Serial.println("\n🔍 Prueba inicial de sensores:");
  float testTemp = dht.readTemperature();
  float testHum = dht.readHumidity();
  int testMQ = analogRead(MQ135_PIN);
  
  Serial.println("─────────────────────────────────────────");
  if (isnan(testTemp) || isnan(testHum)) {
    Serial.println("❌ DHT22: NO RESPONDE");
    Serial.println("   → Revisa conexiones del DHT22");
  } else {
    Serial.printf("✅ DHT22: Temp=%.1f°C, Hum=%.1f%%\n", testTemp, testHum);
  }
  
  if (testMQ == 0) {
    Serial.println("❌ MQ-135: Raw=0 (desconectado o sin alimentación)");
    Serial.println("   → Revisa conexiones del MQ-135");
  } else {
    Serial.printf("✅ MQ-135: Raw=%d (funcionando)\n", testMQ);
  }
  Serial.println("─────────────────────────────────────────");
  
  // 5. Configurar datos iniciales
  myData.id = HIELERA_ID;
  myData.temp = 0.0;
  myData.hum = 0.0;
  myData.ethylene = 0.0;
  myData.timestamp = 0;
  
  Serial.println("\n═══════════════════════════════════════════");
  Serial.printf("✅ HIELERA #%d LISTA PARA ENVIAR DATOS\n", HIELERA_ID);
  Serial.println("═══════════════════════════════════════════");
  Serial.printf("\n📊 Intervalo de envío: %d segundos\n", SEND_INTERVAL/1000);
  Serial.println("\n🚀 Iniciando lectura y envío de datos...\n");
  
  // Parpadeo de inicio
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

// ==================== LOOP ====================

void loop() {
  unsigned long currentTime = millis();
  
  // Enviar datos cada SEND_INTERVAL milisegundos
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    Serial.println("\n─────────────────────────────────────────");
    Serial.printf("📤 Ciclo de lectura #%d (Hielera #%d)\n", sendCount + errorCount + 1, HIELERA_ID);
    Serial.println("─────────────────────────────────────────");
    
    // Encender LED mientras se lee
    digitalWrite(LED_PIN, HIGH);
    
    // 1. Leer sensores
    readDHT22();
    readMQ135();
    myData.timestamp = currentTime;
    
    // 2. Mostrar resumen
    Serial.println("\n📊 Resumen de datos:");
    Serial.printf("   ID: %d\n", myData.id);
    Serial.printf("   Temperatura: %.1f°C\n", myData.temp);
    Serial.printf("   Humedad: %.1f%%\n", myData.hum);
    Serial.printf("   Etileno: %.1fppm\n", myData.ethylene);
    Serial.printf("   Timestamp: %lu ms\n", myData.timestamp);
    
    // 3. Enviar datos por ESP-NOW
    Serial.println("\n📡 Enviando datos al Gateway...");
    esp_err_t result = esp_now_send(gatewayAddress, (uint8_t *) &myData, sizeof(myData));
    
    if (result == ESP_OK) {
      Serial.println("📤 Datos enviados (esperando confirmación...)");
    } else {
      Serial.printf("❌ Error en envío: %d\n", result);
      errorCount++;
    }
    
    // 4. Estadísticas
    Serial.println("\n📈 Estadísticas:");
    Serial.printf("   Envíos exitosos: %d\n", sendCount);
    Serial.printf("   Errores: %d\n", errorCount);
    if (sendCount + errorCount > 0) {
      float successRate = (sendCount * 100.0) / (sendCount + errorCount);
      Serial.printf("   Tasa de éxito: %.1f%%\n", successRate);
    }
    
    lastSendTime = currentTime;
    
    // Apagar LED
    digitalWrite(LED_PIN, LOW);
  }
  
  delay(100); // Pequeño delay para estabilidad
}

// ==================== NOTAS DE CALIBRACIÓN ====================

/*
 * CALIBRACIÓN DEL MQ-135:
 * 
 * El MQ-135 necesita calentarse durante 24-48 horas para lecturas precisas.
 * Para calibrar:
 * 
 * 1. Aire limpio (referencia): ~400 ppm CO2, sensor debe leer ~300-400
 * 2. Cerca de frutas maduras: ~100-200 ppm etileno
 * 3. Ajustar la fórmula según tu sensor específico
 * 
 * Fórmula alternativa más precisa (requiere calibración):
 * float Rs = (4095.0 / rawValue - 1.0) * RL;
 * float ratio = Rs / R0;
 * float ppm = pow(10, ((log10(ratio) - b) / m));
 * 
 * Donde:
 * - RL = resistencia de carga del sensor (típicamente 10kΩ)
 * - R0 = resistencia en aire limpio (obtener durante calibración)
 * - m, b = constantes de la curva característica del sensor
 */
