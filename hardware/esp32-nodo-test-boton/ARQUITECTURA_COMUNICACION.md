# 🔄 Arquitectura de Comunicación ESP32 - Testing

## ❌ Lo que NO es (Confusión Común)

**NO es un sistema Maestro-Esclavo tradicional donde:**
- ❌ El Gateway (maestro) "pregunta" al Nodo cada cierto tiempo
- ❌ El Nodo espera que le pregunten para responder
- ❌ Hay polling o consultas periódicas
- ❌ Comunicación bidireccional sincrónica

## ✅ Lo que SÍ es (Arquitectura Real)

Es un **sistema de comunicación asíncrona basada en eventos** con arquitectura **PUSH (no PULL)**:

```
┌─────────────────────────────────────────────────────────┐
│           ARQUITECTURA DE COMUNICACIÓN                  │
│                                                         │
│  NODO TEST ──(PUSH)──> GATEWAY ──(PUSH)──> BACKEND     │
│  (Emisor)              (Receptor/Relay)    (Receptor)   │
│                                                         │
│  ✅ Comunicación unidireccional                         │
│  ✅ Iniciada por eventos (presión de botón)            │
│  ✅ Sin polling ni preguntas                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Flujo Completo Paso a Paso

### **FASE 1: Usuario Presiona Botón Físico**

```cpp
// En el Nodo Test (esp32-nodo-test-boton.ino)
void loop() {
  // Leer estado del botón
  int buttonState = digitalRead(BUTTON_PIN);
  
  // ¿Botón presionado? (LOW porque usamos pull-up)
  if (buttonState == LOW) {
    // ↓ EVENTO DETECTADO ↓
    
    // 1. Generar datos simulados
    generateTestData();
    
    // 2. ENVIAR al Gateway (PUSH, no espera pregunta)
    esp_now_send(gatewayAddress, (uint8_t *) &testData, sizeof(testData));
  }
}
```

**Clave**: El Nodo **NO espera** que le pregunten. Él **DECIDE** enviar cuando detecta el evento (botón presionado).

---

### **FASE 2: Gateway Recibe Datos (Callback)**

```cpp
// En el Gateway (esp32-gateway.ino)
// Este callback se ejecuta AUTOMÁTICAMENTE cuando llegan datos

void OnDataRecv(const esp_now_recv_info_t *recv_info, 
                const uint8_t *incomingDataBytes, 
                int len) {
  
  // ↓ CALLBACK EJECUTADO AUTOMÁTICAMENTE ↓
  
  // 1. Parsear datos recibidos
  memcpy(&incomingData, incomingDataBytes, sizeof(incomingData));
  
  // 2. Procesar datos
  Serial.printf("📦 Hielera %d: Temp=%.1f°C, Hum=%.1f%%, Eth=%.1fppm\n",
                incomingData.id, incomingData.temp, 
                incomingData.hum, incomingData.ethylene);
  
  // 3. Enviar por WebSocket al Backend
  sendDataToClients(incomingData);
}
```

**Clave**: El Gateway **NO pregunta** al Nodo. Solo **ESCUCHA** y responde cuando llegan datos.

---

### **FASE 3: Backend Recibe por WebSocket**

```javascript
// En el Backend (esp32WebSocketService.js)
ws.on('message', (message) => {
  const data = JSON.parse(message.toString());
  
  if (data.type === 'sensor_data') {
    // ↓ EVENTO RECIBIDO DEL GATEWAY ↓
    
    // 1. Guardar en base de datos
    await this.processHieleraData(data);
    
    // 2. Broadcast a todos los clientes web conectados
    this.broadcastToWebClients(data);
  }
});
```

**Clave**: El Backend **NO pregunta** al Gateway. Solo **ESCUCHA** el WebSocket.

---

### **FASE 4: Frontend Actualiza UI**

```javascript
// En el Frontend (TestingView.jsx)
useEffect(() => {
  loadAllData();
  
  // Auto-actualización cada 5 segundos
  const interval = setInterval(() => {
    loadAllData();  // ← Aquí SÍ hay polling, pero al Backend, no al ESP32
  }, 5000);
  
  return () => clearInterval(interval);
}, []);
```

**Clave**: El Frontend **SÍ pregunta** (polling), pero solo al **Backend** vía API REST, **NO** al ESP32.

---

## 📡 Comparación de Arquitecturas

### **Arquitectura PULL (Polling) - LO QUE NO TENEMOS:**

```
Maestro                    Esclavo
  │                          │
  │─────"¿Tienes datos?"────>│  ← Pregunta cada X segundos
  │<────"Sí, aquí están"─────│  ← Responde solo cuando preguntan
  │                          │
  │─────"¿Tienes datos?"────>│  ← Pregunta de nuevo
  │<────"No, nada nuevo"─────│
  │                          │
  ⏰ Desperdicia ancho de banda
  ⏰ Latencia fija (intervalo de polling)
  ⏰ Consume más energía
```

### **Arquitectura PUSH (Event-Driven) - LO QUE TENEMOS:**

```
Gateway                    Nodo Test
  │                          │
  │                          │  ← Esperando evento (botón)
  │                          │
  │                          🔘 ← Usuario presiona botón
  │<──────"Datos nuevos"─────│  ← Envía SOLO cuando hay evento
  │                          │
  │                          │  ← Vuelve a esperar
  │                          │
  │                          🔘 ← Usuario presiona de nuevo
  │<──────"Datos nuevos"─────│
  
  ✅ Eficiente en ancho de banda
  ✅ Latencia mínima (< 2ms)
  ✅ Ahorra energía (solo transmite cuando necesario)
```

---

## 🔍 Detalles Técnicos Importantes

### **1. ESP-NOW es Protocolo Peer-to-Peer**

```cpp
// ESP-NOW NO es maestro-esclavo
// Es comunicación directa entre pares

// Nodo puede enviar al Gateway SIN pedir permiso
esp_now_send(gatewayAddress, data, size);

// Gateway escucha con callback (no pregunta activamente)
esp_now_register_recv_cb(OnDataRecv);
```

### **2. Callbacks Asíncronos (No Bloqueantes)**

```cpp
// Gateway NO ejecuta loop esperando datos
void loop() {
  // Loop está LIBRE para otras tareas
  // Los datos llegan por INTERRUPCIÓN (callback)
}

// Callback se ejecuta automáticamente cuando llegan datos
void OnDataRecv(...) {
  // Esta función se llama SOLO cuando llegan datos
  // No se ejecuta en polling
}
```

### **3. WebSocket es También Push-Based**

```javascript
// Gateway EMPUJA datos al Backend cuando los recibe
webSocket.sendJSON(data);  // ← Push al Backend

// Backend NO pregunta "oye Gateway, ¿tienes datos?"
// Backend ESCUCHA el WebSocket esperando que le lleguen
```

### **4. Frontend es la ÚNICA Parte con Polling**

```javascript
// Frontend SÍ hace polling, pero solo al Backend API REST
setInterval(() => {
  apiService.getTestingData();  // ← GET HTTP al Backend cada 5s
}, 5000);

// Esto es NORMAL en web porque HTTP es stateless
// Alternativa: WebSocket Frontend ↔ Backend (más complejo)
```

---

## ⚡ Ventajas de Esta Arquitectura

### **1. Latencia Mínima**
- **ESP-NOW**: < 2ms desde Nodo a Gateway
- **Sin polling**: No hay esperas innecesarias
- **Evento inmediato**: Presionas botón → datos llegan en 2ms

### **2. Eficiencia Energética**
- **Nodo Test**: Solo transmite cuando presionas botón
- **Gateway**: Solo procesa cuando recibe datos
- **Sin transmisiones vacías**: No hay "no tengo nada" repetido

### **3. Escalabilidad**
- **Múltiples Nodos**: Pueden enviar al mismo Gateway
- **Sin congestión**: Cada nodo envía solo cuando tiene evento
- **No hay cola de peticiones**: No todos preguntan al mismo tiempo

### **4. Simplicidad de Código**
- **Nodo**: Solo `esp_now_send()` cuando hay evento
- **Gateway**: Solo `OnDataRecv()` callback pasivo
- **Sin timers complejos**: No hay que sincronizar preguntas/respuestas

---

## 🎬 Ejemplo Real: Vida de un Dato

```
T=0.000s  │ Usuario presiona botón físico en Nodo Test
          │
T=0.001s  │ loop() detecta GPIO 13 = LOW
          │ ↓
          │ generateTestData() crea:
          │   - Temperatura: 3.2°C
          │   - Humedad: 87.4%
          │   - Etileno: 52.3ppm
          │
T=0.002s  │ esp_now_send() envía paquete por 2.4GHz
          │ ════════════════════════════════════>
          │                                    Gateway recibe
          │                                    OnDataRecv() ejecutado
          │
T=0.003s  │                                    Serial.printf("📦 Hielera 99...")
          │                                    webSocket.sendJSON(data)
          │                                    ════════════════════════>
          │                                                          Backend recibe
          │                                                          MySQL INSERT
          │
T=0.050s  │                                                          INSERT completado
          │
T=5.000s  │                                                          Frontend polling
          │                                                          GET /api/testing/data
          │                                                          Respuesta con dato nuevo
          │
T=5.050s  │                                                          UI actualizada
          │                                                          Usuario ve dato en pantalla
```

**Total desde presión de botón a pantalla**: ~5 segundos (limitado por polling del frontend)

**Si el usuario está mirando la pantalla antes de presionar**: ~50ms (sin esperar polling)

---

## 🔧 Configuración del Sistema de Eventos

### **En Nodo Test: Configurar a Quién Enviar**

```cpp
// Línea 35 del esp32-nodo-test-boton.ino
uint8_t gatewayAddress[] = {0x24, 0x0A, 0xC4, 0x61, 0x95, 0x8C};

// Agregar Gateway como "peer" (a quién le puedo enviar)
esp_now_peer_info_t peerInfo;
memcpy(peerInfo.peer_addr, gatewayAddress, 6);
esp_now_add_peer(&peerInfo);

// Ahora el Nodo puede enviar al Gateway
esp_now_send(gatewayAddress, data, size);
```

### **En Gateway: Configurar Callback de Recepción**

```cpp
// Línea 197 del esp32-gateway.ino
// Registrar función que se ejecutará al recibir datos
esp_now_register_recv_cb(OnDataRecv);

// Esta función se llamará automáticamente (NO la llamas tú)
void OnDataRecv(const esp_now_recv_info_t *recv_info, 
                const uint8_t *data, int len) {
  // Procesar datos aquí
}
```

### **En Backend: Escuchar WebSocket**

```javascript
// esp32WebSocketService.js línea 32
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Procesar mensaje cuando llegue
  });
});
```

---

## 🚨 Errores Comunes

### **Error 1: Pensar que Gateway "Pregunta" al Nodo**

```cpp
// ❌ INCORRECTO - No existe esto
void loop() {
  esp_now_request_data(nodeAddress);  // ← Esta función NO EXISTE
}
```

```cpp
// ✅ CORRECTO - Gateway solo escucha
void setup() {
  esp_now_register_recv_cb(OnDataRecv);  // ← Registrar callback
}

void loop() {
  // Vacío o haciendo otras cosas
  // Los datos llegan por callback automáticamente
}
```

### **Error 2: Pensar que Nodo Espera Ser Preguntado**

```cpp
// ❌ INCORRECTO - Nodo no espera preguntas
void loop() {
  if (gatewayAskedForData()) {  // ← Esto no existe
    sendData();
  }
}
```

```cpp
// ✅ CORRECTO - Nodo envía cuando HAY EVENTO
void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {  // ← Evento: botón presionado
    generateTestData();
    esp_now_send(gatewayAddress, &testData, sizeof(testData));
  }
}
```

### **Error 3: Polling en ESP-NOW**

```cpp
// ❌ INCORRECTO - No hacer polling con ESP-NOW
void loop() {
  requestDataFromNode();
  delay(1000);  // ← Esperando 1 segundo antes de preguntar de nuevo
}
```

```cpp
// ✅ CORRECTO - Event-driven
void loop() {
  // Nodo envía cuando hay evento (botón)
  // Gateway recibe por callback (no pregunta)
}
```

---

## 📊 Comparativa de Consumo Energético

### **Polling (lo que NO tenemos)**

```
Tiempo       Gateway         Nodo
0s           "¿Datos?"   →   Recibe pregunta
                        ←   "No hay nada"
1s           "¿Datos?"   →   Recibe pregunta
                        ←   "No hay nada"
2s           "¿Datos?"   →   Recibe pregunta
                        ←   "No hay nada"
3s           "¿Datos?"   →   Recibe pregunta
                        ←   "Sí: 3.2°C"

Transmisiones: 8 (4 preguntas + 4 respuestas)
Energía Nodo: ALTA (siempre escuchando y respondiendo)
```

### **Event-Driven (lo que SÍ tenemos)**

```
Tiempo       Gateway         Nodo
0s           [Escuchando]    [Dormido/Esperando botón]
1s           [Escuchando]    [Dormido/Esperando botón]
2s           [Escuchando]    [Dormido/Esperando botón]
3s           [Escuchando]    🔘 Botón presionado
                        ←   "Sí: 3.2°C"

Transmisiones: 1 (solo el dato)
Energía Nodo: BAJA (solo transmite cuando necesario)
```

**Ahorro**: ~87% de transmisiones (7 de 8 eliminadas)

---

## 🎓 Resumen Conceptual

### **¿Quién Inicia la Comunicación?**
**El Nodo Test** (cuando presionas el botón)

### **¿El Gateway Pregunta al Nodo?**
**No.** El Gateway solo escucha pasivamente.

### **¿Cuándo se Envían Datos?**
**Solo cuando hay un evento** (presión de botón)

### **¿Qué Protocolo Usa ESP-NOW?**
**Protocolo peer-to-peer basado en eventos** (similar a interrupciones)

### **¿Hay Polling en Algún Lado?**
**Sí, solo en Frontend → Backend** (HTTP cada 5s), pero **no en ESP32 ↔ ESP32**

### **¿Es Bidireccional?**
**No en este caso.** Nodo → Gateway es unidireccional. Pero ESP-NOW **puede** ser bidireccional si lo configuras.

---

## 🔄 Alternativa: Comunicación Bidireccional (Opcional)

Si quisieras que el Gateway "pregunte" al Nodo (no lo necesitas ahora, pero es posible):

```cpp
// En Gateway: Enviar comando al Nodo
esp_now_send(nodeAddress, "SEND_DATA", 9);

// En Nodo: Callback para recibir comandos
void OnDataRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (strcmp((char*)data, "SEND_DATA") == 0) {
    // Gateway me está pidiendo datos
    sendDataToGateway();
  }
}
```

**Pero esto NO es necesario** para tu caso de testing con botón.

---

## 🎯 Conclusión

Tu sistema de testing funciona así:

1. **Nodo Test**: Detecta evento (botón) → Genera datos → **PUSH al Gateway**
2. **Gateway**: Recibe por **callback** → Procesa → **PUSH al Backend**
3. **Backend**: Recibe por **WebSocket** → Guarda MySQL → Espera API calls
4. **Frontend**: **PULL del Backend** cada 5s → Actualiza UI

**Clave**: ESP32 NO usa polling. Solo el Frontend hace polling (al Backend, no al ESP32).

---

## 📚 Referencias

- **ESP-NOW Protocol**: Comunicación directa 2.4GHz peer-to-peer
- **Callbacks Asíncronos**: Ejecutados por interrupciones de hardware
- **WebSocket**: Protocolo full-duplex, pero usado aquí como push
- **Event-Driven Architecture**: Patrón de diseño reactivo basado en eventos

---

**¿Dudas?** 
- ✅ El Nodo **NO espera** que le pregunten
- ✅ El Gateway **NO pregunta** al Nodo
- ✅ Todo es **basado en eventos** (push, no pull)
- ✅ Solo el Frontend hace polling (al Backend, no al ESP32)
