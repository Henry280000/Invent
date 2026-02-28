# 📡 Configuración del ESP32 Gateway (Servidor)

## 🎯 ¿Qué hace este ESP32?

Este ESP32 actúa como **servidor central** y tiene 3 funciones principales:

```
┌─────────────────────────────────────────────────────┐
│           ESP32 GATEWAY (Servidor)                  │
│                                                     │
│  1. 📡 RECIBE datos del ESP32 de la hielera        │
│     (vía ESP-NOW - comunicación directa)           │
│                                                     │
│  2. 📶 CREA red WiFi para tu laptop                │
│     SSID: "ESP32-Gateway-Hieleras"                 │
│     Password: "hieleras2026"                       │
│                                                     │
│  3. 🌐 TRANSMITE datos por WebSocket               │
│     Puerto 81 - Formato JSON                       │
└─────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

```
[ESP32 Hielera] ──ESP-NOW──> [ESP32 Gateway] ──WiFi──> [Tu Laptop]
   (sensores)      <2ms latencia     (servidor)           (backend)
```

---

## 🛠️ PASO 1: Instalar Arduino IDE

### En tu Mac:

1. **Descargar Arduino IDE 2.x**:
   ```
   https://www.arduino.cc/en/software
   ```

2. **Instalar soporte para ESP32**:
   - Abrir Arduino IDE
   - Ir a: `Arduino IDE` → `Settings` (⌘,)
   - En "Additional boards manager URLs", pegar:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Ir a: `Tools` → `Board` → `Boards Manager`
   - Buscar "esp32"
   - Instalar **"esp32 by Espressif Systems"** (versión 2.0.x o superior)

3. **Instalar librerías necesarias**:
   - Ir a: `Sketch` → `Include Library` → `Manage Libraries`
   - Buscar e instalar una por una:
     ```
     ✓ WebSockets by Markus Sattler
     ✓ ArduinoJson by Benoit Blanchon
     ```
   - **Nota**: ESP-NOW y WiFi ya vienen incluidos con ESP32

---

## 🔌 PASO 2: Conectar el ESP32

1. **Conectar ESP32 a tu Mac** con cable USB

2. **Seleccionar la placa**:
   - `Tools` → `Board` → `ESP32 Arduino` → `ESP32 Dev Module`

3. **Seleccionar el puerto**:
   - `Tools` → `Port` → Selecciona algo como:
     ```
     /dev/cu.usbserial-XXXX
     /dev/cu.SLAB_USBtoUART
     /dev/cu.wchusbserial XXXX
     ```
   - Si no aparece ningún puerto:
     - Verifica el cable USB (algunos solo sirven para cargar)
     - Instala driver CH340/CP2102 si es necesario

4. **Configurar parámetros de subida** (en Tools):
   ```
   Upload Speed: 115200
   CPU Frequency: 240MHz (WiFi/BT)
   Flash Frequency: 80MHz
   Flash Mode: QIO
   Flash Size: 4MB (32Mb)
   Partition Scheme: Default 4MB with spiffs
   Core Debug Level: None
   ```

---

## 📝 PASO 3: Abrir y Subir el Código

1. **Abrir el archivo**:
   ```
   File → Open → Selecciona:
   /Users/enrique/Documents/Programacion/invent/hardware/esp32-gateway/esp32-gateway.ino
   ```

2. **Revisar la configuración** (NO necesitas cambiar nada por ahora):
   ```cpp
   // Líneas 19-20 del código
   const char* ssid = "ESP32-Gateway-Hieleras";
   const char* password = "hieleras2026";
   ```

3. **Compilar** (verificar que no hay errores):
   - Click en el botón ✓ (Verify)
   - Espera a que compile (30-60 segundos)
   - Debe decir: `"Done compiling"`

4. **Subir al ESP32**:
   - Click en el botón → (Upload)
   - Verás mensajes como:
     ```
     Connecting........_____.....
     Writing at 0x00001000... (100%)
     Hard resetting via RTS pin...
     ```
   - Debe terminar con: `"Hard resetting via RTS pin..."`

---

## 🖥️ PASO 4: Verificar que Funciona

### 4.1 Abrir Serial Monitor

1. **Abrir el monitor serial**:
   - `Tools` → `Serial Monitor`
   - O presiona: `⌘ + Shift + M`

2. **Configurar velocidad**:
   - En la parte inferior derecha, selecciona: `115200 baud`

3. **Presionar el botón RESET** del ESP32

### 4.2 Debes Ver Este Mensaje

```
═══════════════════════════════════════════
  ESP32 GATEWAY - Sistema de Hieleras IoT
═══════════════════════════════════════════

📶 Configurando Access Point WiFi...
✅ Access Point activo:
   SSID: ESP32-Gateway-Hieleras
   Password: hieleras2026
   IP del Gateway: 192.168.4.1
   Puerto WebSocket: 81

📡 Inicializando ESP-NOW...
✅ ESP-NOW inicializado correctamente

🌐 Iniciando servidor WebSocket...
✅ Servidor WebSocket activo en puerto 81

═══════════════════════════════════════════
✅ GATEWAY LISTO Y ESPERANDO DATOS
═══════════════════════════════════════════

📝 Instrucciones de conexión:
   1. Conecta tu laptop a la red WiFi: ESP32-Gateway-Hieleras
   2. Conecta WebSocket a: ws://192.168.4.1:81
   3. Los datos llegarán en formato JSON
```

### ✅ Si ves esto, ¡el Gateway está funcionando correctamente!

---

## 📶 PASO 5: Conectar tu Laptop al Gateway

### En tu Mac:

1. **Buscar redes WiFi**:
   - Click en el ícono WiFi (barra superior)
   - Busca: `ESP32-Gateway-Hieleras`

2. **Conectarte**:
   - Password: `hieleras2026`
   - Espera a que conecte (5-10 segundos)

3. **Verificar conexión**:
   - Abre Terminal en tu Mac
   - Ejecuta:
     ```bash
     ping 192.168.4.1
     ```
   - Debes ver respuestas como:
     ```
     64 bytes from 192.168.4.1: icmp_seq=0 ttl=255 time=2.456 ms
     ```
   - Presiona Ctrl+C para detener

### ✅ Si recibes respuestas del ping, la conexión WiFi funciona!

---

## 🔍 PASO 6: Ver los Mensajes en Tiempo Real

Una vez que configures el **ESP32 de la hielera** (siguiente paso), verás mensajes como estos en el Serial Monitor:

```
📦 Hielera 1: Temp=2.3°C, Hum=85.0%, Eth=45.2ppm
📦 Hielera 1: Temp=2.4°C, Hum=85.2%, Eth=46.1ppm
📦 Hielera 1: Temp=2.3°C, Hum=84.8%, Eth=45.8ppm
```

Cada línea significa:
- **Temp**: Temperatura del sensor DHT22
- **Hum**: Humedad del sensor DHT22
- **Eth**: Nivel de etileno del sensor MQ-135

---

## 🌐 Formato de Datos JSON (para tu backend)

Cuando tu backend se conecte al WebSocket `ws://192.168.4.1:81`, recibirá datos en este formato:

### Mensaje de datos de sensor:
```json
{
  "type": "sensor_data",
  "id": 1,
  "temp": 2.3,
  "hum": 85.0,
  "ethylene": 45.2,
  "timestamp": 12345678,
  "gateway_time": 12345680
}
```

### Mensaje inicial (al conectarse):
```json
{
  "type": "initial_data",
  "gateway": "ESP32-Gateway-Hieleras",
  "total_hieleras": 10,
  "hieleras": [
    {
      "id": 1,
      "temp": 2.3,
      "hum": 85.0,
      "ethylene": 45.2,
      "timestamp": 12345678,
      "age_ms": 1000
    }
  ]
}
```

---

## 🔧 Solución de Problemas

### ❌ No compila

**Error común**: `WebSocketsServer.h: No such file or directory`

**Solución**:
1. Ir a `Sketch` → `Include Library` → `Manage Libraries`
2. Buscar "WebSockets"
3. Instalar **"WebSockets by Markus Sattler"**
4. Reintentar

---

### ❌ No sube el código

**Error común**: `A fatal error occurred: Failed to connect to ESP32`

**Soluciones**:
1. **Mantener presionado el botón BOOT** mientras subes
2. Cambiar velocidad: `Tools` → `Upload Speed` → `115200`
3. Verificar cable USB (debe ser de datos, no solo carga)
4. Instalar driver:
   - **CH340**: https://github.com/adrianmihalko/ch340g-ch34g-ch34x-mac-os-x-driver
   - **CP2102**: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers

---

### ❌ El Gateway se reinicia constantemente

**Posibles causas**:
1. **Problema de alimentación**: 
   - Usa un cable USB de buena calidad
   - O alimenta con fuente externa de 5V 1A mínimo

2. **Verifica en Serial Monitor**:
   - Si ves mensajes de "brownout detector", es problema de alimentación

---

### ❌ No aparece la red WiFi

**Solución**:
1. Presiona el botón **RESET** del ESP32
2. Espera 10 segundos
3. Busca de nuevo la red WiFi
4. Si no aparece, revisa Serial Monitor para errores

---

## 📋 Checklist Final

Antes de pasar al ESP32 de la hielera, verifica:

- ✅ El código se subió sin errores
- ✅ Serial Monitor muestra "GATEWAY LISTO Y ESPERANDO DATOS"
- ✅ La red WiFi "ESP32-Gateway-Hieleras" es visible
- ✅ Puedes conectarte a la red con password "hieleras2026"
- ✅ El comando `ping 192.168.4.1` funciona

---

## 🎯 Próximo Paso

Una vez que el Gateway esté funcionando:

1. **Obtener la MAC Address del Gateway** (importante para el nodo):
   - Añade estas líneas al código después de la línea 203 (justo después de `WiFi.softAP(ssid, password);`):
     ```cpp
     Serial.print("📍 MAC Address del Gateway: ");
     Serial.println(WiFi.macAddress());
     ```
   - Vuelve a subir el código
   - Abre Serial Monitor
   - **Anota la MAC Address** (algo como: `AA:BB:CC:DD:EE:FF`)

2. **Configurar el ESP32 de la hielera** con esta MAC Address

3. **Iniciar el backend** para procesar los datos

---

## 💡 Tips Útiles

### Cambiar el nombre de la red WiFi:
```cpp
// Línea 19 - Cambia el nombre aquí
const char* ssid = "MiHielera-Gateway";  // Personaliza el nombre
```

### Cambiar la contraseña:
```cpp
// Línea 20 - Cambia la contraseña aquí
const char* password = "mipassword123";  // Mínimo 8 caracteres
```

### Soportar más hieleras:
```cpp
// Línea 38 - Aumenta el número si tienes más ESP32
#define MAX_HIELERAS 10  // Cambia a 20 si tienes 20 hieleras
```

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:

1. **Copia todo el mensaje de error** del Serial Monitor
2. **Toma captura de pantalla** de la configuración en Tools
3. **Anota el modelo exacto** de tu ESP32 (está impreso en la placa)

---

**¡Gateway configurado! Ahora continúa con el ESP32 de la hielera** 🚀
