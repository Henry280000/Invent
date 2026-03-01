/*
 * ESP32 GATEWAY - Sistema de Monitoreo de Hieleras
 * 
 * Funciones:
 * 1. Recibe datos de múltiples hieleras vía ESP-NOW
 * 2. Crea Access Point WiFi para conexión con computadora
 * 3. Transmite datos en tiempo real vía WebSocket
 * 
 * Hardware: ESP32 DevKit v1 o compatible
 * Compatible con: ESP32 Arduino Core 3.3.7
 */

#include <WiFi.h>
#include <esp_now.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// Version check
#if !defined(ESP_ARDUINO_VERSION_MAJOR) || ESP_ARDUINO_VERSION_MAJOR < 3
#warning "Este código está optimizado para ESP32 Arduino Core 3.x"
#endif

// ==================== CONFIGURACIÓN ====================

// Access Point WiFi (Punto de acceso para la laptop)
const char* ssid = "ESP32-Gateway-Hieleras";
const char* password = "hieleras2026";

// WebSocket Server (Puerto 81 para no conflictuar con HTTP)
WebSocketsServer webSocket = WebSocketsServer(81);

// Estructura de mensaje compartida con los nodos
typedef struct struct_message {
    int id;          // ID de la hielera (1, 2, 3...)
    float temp;      // Temperatura en °C
    float hum;       // Humedad en %
    float ethylene;  // Nivel de gas etileno (maduración) en ppm
    unsigned long timestamp; // Timestamp del envío
} struct_message;

struct_message incomingData;

// Array para almacenar últimos datos de cada hielera
#define MAX_HIELERAS 10
struct_message lastData[MAX_HIELERAS];
bool dataReceived[MAX_HIELERAS] = {false};

// Variables de control
unsigned long lastBroadcast = 0;
const unsigned long broadcastInterval = 1000; // Enviar datos cada 1 segundo
int connectedClients = 0;

// ==================== CALLBACK ESP-NOW ====================

// Callback cuando se reciben datos por ESP-NOW
// ESP32 Arduino Core 3.x usa esp_now_recv_info_t en lugar de mac address directo
void OnDataRecv(const esp_now_recv_info_t *recv_info, const uint8_t *incomingDataBytes, int len) {
  memcpy(&incomingData, incomingDataBytes, sizeof(incomingData));
  
  // Validar ID de hielera
  if (incomingData.id > 0 && incomingData.id <= MAX_HIELERAS) {
    int index = incomingData.id - 1;
    
    // Guardar datos con timestamp actualizado
    lastData[index] = incomingData;
    lastData[index].timestamp = millis();
    dataReceived[index] = true;
    
    // Log en Serial Monitor con MAC del remitente
    Serial.printf("📦 Recibido de HIELERA_%d: Temp=%.1f°C, Hum=%.1f%%, Eth=%.1fppm", 
                  incomingData.id, 
                  incomingData.temp, 
                  incomingData.hum, 
                  incomingData.ethylene);
    
    // Mostrar MAC del remitente (recv_info contiene src_addr y des_addr)
    Serial.printf(" [MAC: %02X:%02X:%02X:%02X:%02X:%02X]\n",
                  recv_info->src_addr[0], recv_info->src_addr[1], 
                  recv_info->src_addr[2], recv_info->src_addr[3], 
                  recv_info->src_addr[4], recv_info->src_addr[5]);
    
    // ✅ SIEMPRE enviar inmediatamente por WebSocket
    Serial.printf("📤 Enviando a backend vía WebSocket...\n");
    sendDataToClients(index);
    
    if (connectedClients > 0) {
      Serial.printf("✅ Enviado a %d cliente(s) conectado(s)\n", connectedClients);
    } else {
      Serial.println("⚠️  Sin clientes WebSocket (backend no conectado)");
    }
  } else {
    Serial.printf("❌ ID de hielera inválido: %d\n", incomingData.id);
  }
}

// ==================== WEBSOCKET ====================

// Callback de eventos WebSocket
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("🔌 Cliente #%u desconectado\n", num);
      connectedClients--;
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("✅ Cliente #%u conectado desde %d.%d.%d.%d\n", 
                    num, ip[0], ip[1], ip[2], ip[3]);
      connectedClients++;
      
      // Enviar mensaje de bienvenida con todas las hieleras disponibles
      sendAllDataToClient(num);
      break;
    }
      
    case WStype_TEXT:
      Serial.printf("📨 Mensaje recibido de #%u: %s\n", num, payload);
      
      // Responder a comandos especiales
      if (strcmp((char*)payload, "status") == 0) {
        sendStatusToClient(num);
      }
      break;
      
    default:
      break;
  }
}

// Enviar datos de una hielera específica a todos los clientes
void sendDataToClients(int hielera_index) {
  if (!dataReceived[hielera_index]) return;
  
  // Crear JSON
  StaticJsonDocument<256> doc;
  doc["type"] = "sensor_data";
  doc["id"] = lastData[hielera_index].id;
  doc["temp"] = lastData[hielera_index].temp;
  doc["hum"] = lastData[hielera_index].hum;
  doc["ethylene"] = lastData[hielera_index].ethylene;
  doc["timestamp"] = lastData[hielera_index].timestamp;
  doc["gateway_time"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Enviar a todos los clientes conectados
  webSocket.broadcastTXT(jsonString);
}

// Enviar todos los datos a un cliente específico (al conectarse)
void sendAllDataToClient(uint8_t num) {
  StaticJsonDocument<1024> doc;
  doc["type"] = "initial_data";
  doc["gateway"] = "ESP32-Gateway-Hieleras";
  doc["total_hieleras"] = MAX_HIELERAS;
  
  JsonArray hieleras = doc.createNestedArray("hieleras");
  
  for (int i = 0; i < MAX_HIELERAS; i++) {
    if (dataReceived[i]) {
      JsonObject hielera = hieleras.createNestedObject();
      hielera["id"] = lastData[i].id;
      hielera["temp"] = lastData[i].temp;
      hielera["hum"] = lastData[i].hum;
      hielera["ethylene"] = lastData[i].ethylene;
      hielera["timestamp"] = lastData[i].timestamp;
      hielera["age_ms"] = millis() - lastData[i].timestamp;
    }
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(num, jsonString);
}

// Enviar estado del gateway a un cliente
void sendStatusToClient(uint8_t num) {
  StaticJsonDocument<512> doc;
  doc["type"] = "status";
  doc["gateway"] = "ESP32-Gateway-Hieleras";
  doc["uptime_ms"] = millis();
  doc["clients"] = connectedClients;
  doc["free_heap"] = ESP.getFreeHeap();
  doc["wifi_mode"] = "AP";
  doc["ip"] = WiFi.softAPIP().toString();
  
  int activeHieleras = 0;
  for (int i = 0; i < MAX_HIELERAS; i++) {
    if (dataReceived[i]) activeHieleras++;
  }
  doc["active_hieleras"] = activeHieleras;
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(num, jsonString);
}

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("═══════════════════════════════════════════");
  Serial.println("  ESP32 GATEWAY - Sistema de Hieleras IoT");
  Serial.println("═══════════════════════════════════════════");
  
  // 1. Configurar WiFi en modo Access Point
  Serial.println("\n📶 Configurando Access Point WiFi...");
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password);
  
  // Mostrar MAC Address del Gateway (útil para configurar nodos)
  Serial.print("📍 MAC Address del Gateway: ");
  Serial.println(WiFi.macAddress());
  
  IPAddress IP = WiFi.softAPIP();
  Serial.println("✅ Access Point activo:");
  Serial.printf("   SSID: %s\n", ssid);
  Serial.printf("   Password: %s\n", password);
  Serial.printf("   IP del Gateway: %s\n", IP.toString().c_str());
  Serial.println("   Puerto WebSocket: 81");
  
  // 2. Inicializar ESP-NOW
  Serial.println("\n📡 Inicializando ESP-NOW...");
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Error inicializando ESP-NOW");
    ESP.restart();
  }
  Serial.println("✅ ESP-NOW inicializado correctamente");
  
  // Registrar callback para recepción de datos
  esp_now_register_recv_cb(OnDataRecv);
  
  // 3. Iniciar servidor WebSocket
  Serial.println("\n🌐 Iniciando servidor WebSocket...");
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("✅ Servidor WebSocket activo en puerto 81");
  
  Serial.println("\n═══════════════════════════════════════════");
  Serial.println("✅ GATEWAY LISTO Y ESPERANDO DATOS");
  Serial.println("═══════════════════════════════════════════");
  Serial.println("\n📝 Instrucciones de conexión:");
  Serial.println("   1. Conecta tu laptop a la red WiFi: ESP32-Gateway-Hieleras");
  Serial.println("   2. Conecta WebSocket a: ws://192.168.4.1:81");
  Serial.println("   3. Los datos llegarán en formato JSON\n");
}

// ==================== LOOP ====================

void loop() {
  // Procesar eventos WebSocket
  webSocket.loop();
  
  // Broadcast periódico de todas las hieleras activas
  if (connectedClients > 0 && millis() - lastBroadcast > broadcastInterval) {
    for (int i = 0; i < MAX_HIELERAS; i++) {
      if (dataReceived[i]) {
        // Verificar que los datos no sean muy antiguos (> 30 segundos)
        if (millis() - lastData[i].timestamp < 30000) {
          sendDataToClients(i);
        }
      }
    }
    lastBroadcast = millis();
  }
  
  delay(10); // Pequeño delay para estabilidad
}
