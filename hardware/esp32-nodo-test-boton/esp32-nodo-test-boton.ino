/*
 * ESP32 NODO TEST - Botón de Prueba
 * 
 * PROPÓSITO: Testing y verificación de conexión ESP-NOW
 * 
 * Funciones:
 * 1. Envía datos simulados al presionar UN BOTÓN
 * 2. Verifica comunicación ESP-NOW con Gateway
 * 3. Confirma que datos llegan al backend/web
 * 
 * Hardware MÍNIMO:
 * - ESP32 DevKit v1 o compatible
 * - 1 Botón Push Button en GPIO 13 (con pull-up interno)
 * - LED integrado en GPIO 2 (feedback visual)
 * 
 * VENTAJAS:
 * ✅ No necesitas sensores DHT22 ni MQ-135
 * ✅ Testing rápido de ESP-NOW
 * ✅ Verificas que Gateway recibe datos
 * ✅ Pruebas de backend/frontend sin hardware extra
 * 
 * Compatible con: ESP32 Arduino Core 3.3.7
 */

#include <esp_now.h>
#include <WiFi.h>

// Version check
#if !defined(ESP_ARDUINO_VERSION_MAJOR) || ESP_ARDUINO_VERSION_MAJOR < 3
#warning "Este código está optimizado para ESP32 Arduino Core 3.x"
#endif

// ==================== CONFIGURACIÓN ====================

// ¡¡¡ CAMBIAR ESTE NÚMERO PARA CADA HIELERA DE PRUEBA !!!
#define HIELERA_ID 99  // ID especial para testing (99 = modo prueba)

// MAC Address del Gateway (DEBES OBTENERLA DEL GATEWAY)
// Formato: {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF}
// Gateway MAC: E0:8C:FE:32:9E:CD
uint8_t gatewayAddress[] = {0xE0, 0x8C, 0xFE, 0x32, 0x9E, 0xCD};

// Pines
#define BUTTON_PIN 13     // Botón en GPIO 13 (tiene pull-up interno)
#define LED_PIN 2         // LED integrado

// Variables de control
unsigned long lastSendTime = 0;
const unsigned long debounceDelay = 300; // Anti-rebote 300ms
bool sendSuccess = false;
int sendCount = 0;
int errorCount = 0;
int buttonPressCount = 0;

// Estructura de mensaje (DEBE SER IDÉNTICA AL GATEWAY)
typedef struct struct_message {
    int id;
    float temp;
    float hum;
    float ethylene;
    unsigned long timestamp;
} struct_message;

struct_message testData;

// ==================== GENERADOR DE DATOS SIMULADOS ====================

// Genera datos realistas para testing
void generateTestData() {
  // Datos simulados pero realistas
  testData.id = HIELERA_ID;
  
  // Temperatura: simular refrigerador (0-5°C) con variación
  testData.temp = 2.0 + (random(0, 30) / 10.0); // 2.0 - 5.0°C
  
  // Humedad: rango óptimo (80-95%)
  testData.hum = 80.0 + (random(0, 150) / 10.0); // 80.0 - 95.0%
  
  // Etileno: nivel bajo-medio (0-100 ppm)
  testData.ethylene = random(0, 1000) / 10.0; // 0 - 100.0 ppm
  
  testData.timestamp = millis();
  
  Serial.println("\n🎲 Datos simulados generados:");
  Serial.printf("   Temperatura: %.1f°C\n", testData.temp);
  Serial.printf("   Humedad: %.1f%%\n", testData.hum);
  Serial.printf("   Etileno: %.1fppm\n", testData.ethylene);
  Serial.printf("   Presión de botón #%d\n", buttonPressCount);
}

// ==================== CALLBACK ESP-NOW ====================

// Callback cuando se envían datos
// ESP32 Arduino Core 3.x usa wifi_tx_info_t en lugar de mac_addr
void OnDataSent(const wifi_tx_info_t *tx_info, esp_now_send_status_t status) {
  sendSuccess = (status == ESP_NOW_SEND_SUCCESS);
  
  if (sendSuccess) {
    Serial.println("\n✅ ÉXITO: Datos enviados al Gateway");
    Serial.println("   Gateway los recibió correctamente");
    sendCount++;
    
    // LED parpadeo rápido (éxito)
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(50);
      digitalWrite(LED_PIN, LOW);
      delay(50);
    }
  } else {
    Serial.println("\n❌ ERROR: No se pudieron enviar datos");
    Serial.println("   Verifica:");
    Serial.println("   - MAC Address del Gateway correcta");
    Serial.println("   - Gateway encendido");
    Serial.println("   - Distancia <50m");
    errorCount++;
    
    // LED parpadeo lento (error)
    for (int i = 0; i < 5; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(100);
      digitalWrite(LED_PIN, LOW);
      delay(100);
    }
  }
  
  // Estadísticas
  Serial.println("\n📊 Estadísticas:");
  Serial.printf("   Total presiones: %d\n", buttonPressCount);
  Serial.printf("   Envíos exitosos: %d\n", sendCount);
  Serial.printf("   Errores: %d\n", errorCount);
  if (sendCount + errorCount > 0) {
    float successRate = (sendCount * 100.0) / (sendCount + errorCount);
    Serial.printf("   Tasa de éxito: %.1f%%\n", successRate);
  }
}

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("═══════════════════════════════════════════");
  Serial.println("  ESP32 NODO TEST - Botón de Prueba");
  Serial.printf("  Hielera ID: %d (Modo TEST)\n", HIELERA_ID);
  Serial.println("═══════════════════════════════════════════");
  
  // Configurar pines
  pinMode(BUTTON_PIN, INPUT_PULLUP); // Pull-up interno (botón a GND)
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Mostrar MAC Address de este ESP32
  Serial.print("\n📍 MAC Address de este ESP32: ");
  Serial.println(WiFi.macAddress());
  Serial.println("   (Anota esta dirección si vas a configurar el Gateway)");
  
  // Configurar WiFi en modo Station
  Serial.println("\n📶 Configurando WiFi en modo Station...");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  Serial.println("✅ WiFi configurado");
  
  // Inicializar ESP-NOW
  Serial.println("\n📡 Inicializando ESP-NOW...");
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Error inicializando ESP-NOW");
    Serial.println("⚠️  Reiniciando en 3 segundos...");
    delay(3000);
    ESP.restart();
  }
  Serial.println("✅ ESP-NOW inicializado");
  
  // Registrar callback de envío
  esp_now_register_send_cb(OnDataSent);
  
  // Agregar Gateway como peer
  Serial.println("\n🔗 Registrando Gateway como peer...");
  Serial.print("   MAC del Gateway: ");
  Serial.printf("%02X:%02X:%02X:%02X:%02X:%02X\n",
                gatewayAddress[0], gatewayAddress[1], gatewayAddress[2],
                gatewayAddress[3], gatewayAddress[4], gatewayAddress[5]);
  
  esp_now_peer_info_t peerInfo;
  memset(&peerInfo, 0, sizeof(peerInfo));
  memcpy(peerInfo.peer_addr, gatewayAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  peerInfo.ifidx = WIFI_IF_STA;  // Interfaz WiFi Station (requerido en Core 3.x)
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Error agregando peer (Gateway)");
    Serial.println("⚠️  IMPORTANTE: Verifica la MAC Address del Gateway");
    Serial.println("⚠️  Formato: {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF}");
    delay(5000);
    ESP.restart();
  }
  Serial.println("✅ Gateway registrado correctamente");
  
  // Inicializar generador de números aleatorios
  randomSeed(analogRead(0));
  
  Serial.println("\n═══════════════════════════════════════════");
  Serial.println("✅ NODO TEST LISTO");
  Serial.println("═══════════════════════════════════════════");
  Serial.println("\n📝 Instrucciones:");
  Serial.println("   1. Asegúrate de que el Gateway esté encendido");
  Serial.println("   2. Presiona el BOTÓN para enviar datos simulados");
  Serial.println("   3. El LED parpadeará:");
  Serial.println("      - Rápido 3x = Envío exitoso ✅");
  Serial.println("      - Lento 5x = Error en envío ❌");
  Serial.println("   4. Verifica en el Serial Monitor del Gateway");
  Serial.println("   5. Verifica en tu backend/web que lleguen los datos\n");
  
  // Parpadeo de inicio (3 veces lento)
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
  
  Serial.println("💡 Esperando presión del botón...\n");
}

// ==================== LOOP ====================

void loop() {
  // Leer estado del botón (LOW = presionado porque usamos pull-up)
  int buttonState = digitalRead(BUTTON_PIN);
  
  // Si el botón está presionado Y ha pasado el tiempo de anti-rebote
  if (buttonState == LOW && (millis() - lastSendTime > debounceDelay)) {
    
    buttonPressCount++;
    
    // Feedback visual inmediato
    digitalWrite(LED_PIN, HIGH);
    
    Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.printf("🔘 BOTÓN PRESIONADO #%d\n", buttonPressCount);
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Generar datos simulados
    generateTestData();
    
    // Enviar datos por ESP-NOW
    Serial.println("\n📡 Enviando datos al Gateway...");
    esp_err_t result = esp_now_send(gatewayAddress, (uint8_t *) &testData, sizeof(testData));
    
    if (result == ESP_OK) {
      Serial.println("📤 Paquete enviado (esperando confirmación del Gateway...)");
    } else {
      Serial.printf("❌ Error al enviar paquete: %d\n", result);
      errorCount++;
    }
    
    lastSendTime = millis();
    digitalWrite(LED_PIN, LOW);
    
    // Pequeño delay para evitar rebotes
    delay(100);
  }
  
  // Pequeño delay para no saturar el loop
  delay(10);
}

// ==================== NOTAS DE USO ====================

/*
 * GUÍA DE USO RÁPIDO:
 * 
 * 1. HARDWARE:
 *    - ESP32 conectado por USB
 *    - Botón: un terminal a GPIO 13, otro a GND
 *    - No necesitas resistencias (pull-up interno)
 *    - LED integrado en GPIO 2 (ya está en la placa)
 * 
 * 2. CONFIGURACIÓN:
 *    - Obtén MAC del Gateway (Serial Monitor del Gateway)
 *    - Reemplaza gatewayAddress[] en línea 42
 *    - Sube el código
 * 
 * 3. TESTING:
 *    - Abre Serial Monitor (115200 baud)
 *    - Presiona el botón físico
 *    - Verás: 🔘 BOTÓN PRESIONADO
 *    - LED parpadea (3x rápido = éxito, 5x lento = error)
 *    - Verifica Gateway Serial Monitor: 📦 Hielera 99: ...
 *    - Verifica web: Deberías ver los datos simulados
 * 
 * 4. DATOS SIMULADOS:
 *    - ID: 99 (identificador especial de test)
 *    - Temperatura: 2.0 - 5.0°C (rango refrigerador)
 *    - Humedad: 80 - 95% (rango óptimo)
 *    - Etileno: 0 - 100 ppm (nivel bajo-medio)
 *    - Cambian en cada presión del botón
 * 
 * 5. TROUBLESHOOTING:
 *    - Si LED parpadea lento: Verifica MAC del Gateway
 *    - Si no pasa nada: Verifica conexión del botón
 *    - Si Gateway no recibe: Acerca los ESP32 (<5m)
 * 
 * 6. CUANDO TODO FUNCIONE:
 *    - Cambia a esp32-nodo-hielera.ino (con sensores reales)
 *    - Mantén este código para testing futuro
 */
