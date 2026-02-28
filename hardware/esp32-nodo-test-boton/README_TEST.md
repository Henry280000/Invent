# 🔘 ESP32 Nodo TEST - Botón de Prueba

## 🎯 ¿Para qué sirve este código?

Este es un **nodo de prueba simplificado** para verificar que todo funciona **ANTES** de conectar sensores.

```
┌────────────────────────────────────────────────┐
│   ¿POR QUÉ USAR ESTE NODO DE PRUEBA?          │
├────────────────────────────────────────────────┤
│ ✅ No necesitas sensores DHT22 ni MQ-135      │
│ ✅ Solo necesitas 1 botón simple              │
│ ✅ Pruebas ESP-NOW rápidamente                │
│ ✅ Verificas Gateway sin hardware complejo    │
│ ✅ Debugging más fácil                         │
│ ✅ Confirmas que backend/web funcionan        │
└────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Testing

```
[Presionas BOTÓN] 
    ↓
[ESP32 genera datos simulados]
    ↓
[Envía por ESP-NOW al Gateway]
    ↓
[Gateway recibe y muestra en Serial Monitor]
    ↓
[Gateway envía por WebSocket al Backend]
    ↓
[Ves datos en tu página web]
```

---

## 🛠️ Hardware Necesario

### Mínimo (solo para testing):
- ✅ 1 ESP32 DevKit v1 (o compatible)
- ✅ 1 Botón Push Button (normalmente abierto)
- ✅ 2 cables jumper macho-macho
- ✅ Cable USB

### NO necesitas (todavía):
- ❌ Sensor DHT22
- ❌ Sensor MQ-135
- ❌ Resistencias
- ❌ Breadboard (opcional)

---

## 🔌 Conexiones del Botón

**SUPER SIMPLE - Solo 2 cables:**

```
┌─────────────────────────────────────┐
│              ESP32                  │
│                                     │
│   GPIO 13 ●────────┐               │
│                    │               │
│                [BOTÓN]             │
│                    │               │
│   GND     ●────────┘               │
│                                     │
│   LED Built-in (GPIO 2) - ya viene  │
└─────────────────────────────────────┘
```

### Detalle de conexión:

1. **Cable 1**: Un terminal del botón → GPIO 13 del ESP32
2. **Cable 2**: Otro terminal del botón → GND del ESP32
3. **LED**: ¡Ya está incluido en la placa! (GPIO 2)

### ¿Por qué tan simple?

- GPIO 13 tiene **pull-up interno** (no necesitas resistencia)
- LED está **integrado** en la placa ESP32
- Cuando **NO presionas**: GPIO 13 = HIGH (por pull-up)
- Cuando **SÍ presionas**: GPIO 13 = LOW (conectado a GND)

---

## ⚙️ PASO 1: Obtener MAC del Gateway

**MUY IMPORTANTE:** Necesitas la MAC Address del Gateway primero.

### En el Gateway (si no la tienes):

1. Abre el Serial Monitor del Gateway
2. Busca esta línea al inicio:
   ```
   📍 MAC Address del Gateway: AA:BB:CC:DD:EE:FF
   ```
3. **Anota esa dirección** (ejemplo: `24:0A:C4:61:95:8C`)

---

## 📝 PASO 2: Configurar el Código

### Abrir el archivo:
```
/Users/enrique/Documents/Programacion/invent/hardware/esp32-nodo-test-boton/esp32-nodo-test-boton.ino
```

### Cambiar SOLO 2 cosas:

#### 1. ID de la hielera (línea 31):
```cpp
// Cambia el número si quieres otro ID de prueba
#define HIELERA_ID 99  // 99 = modo test
```

#### 2. MAC Address del Gateway (línea 35):
```cpp
// REEMPLAZAR con la MAC del Gateway que anotaste
uint8_t gatewayAddress[] = {0x24, 0x0A, 0xC4, 0x61, 0x95, 0x8C};
```

**Formato de conversión:**
- Gateway muestra: `24:0A:C4:61:95:8C`
- En el código escribes: `{0x24, 0x0A, 0xC4, 0x61, 0x95, 0x8C}`
- Solo agrega `0x` antes de cada par

---

## 🚀 PASO 3: Subir el Código

1. **Conectar ESP32** por USB
2. **Seleccionar placa**: `ESP32 Dev Module`
3. **Seleccionar puerto**: `/dev/cu.usbserial-XXXX`
4. **Compilar** (botón ✓)
5. **Subir** (botón →)

### Configuración en Arduino IDE:
```
Board: ESP32 Dev Module
Upload Speed: 115200
CPU Frequency: 240MHz
Flash Size: 4MB
```

---

## 🖥️ PASO 4: Testing

### 4.1 Abrir Serial Monitor

1. `Tools` → `Serial Monitor`
2. Velocidad: `115200 baud`
3. Deberías ver:

```
═══════════════════════════════════════════
  ESP32 NODO TEST - Botón de Prueba
  Hielera ID: 99 (Modo TEST)
═══════════════════════════════════════════

📍 MAC Address de este ESP32: 30:AE:A4:07:57:38

📶 Configurando WiFi en modo Station...
✅ WiFi configurado

📡 Inicializando ESP-NOW...
✅ ESP-NOW inicializado

🔗 Registrando Gateway como peer...
   MAC del Gateway: 24:0A:C4:61:95:8C
✅ Gateway registrado correctamente

═══════════════════════════════════════════
✅ NODO TEST LISTO
═══════════════════════════════════════════

📝 Instrucciones:
   1. Asegúrate de que el Gateway esté encendido
   2. Presiona el BOTÓN para enviar datos simulados
   3. El LED parpadeará:
      - Rápido 3x = Envío exitoso ✅
      - Lento 5x = Error en envío ❌

💡 Esperando presión del botón...
```

### 4.2 Presionar el Botón Físico

**AL PRESIONAR** verás:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔘 BOTÓN PRESIONADO #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎲 Datos simulados generados:
   Temperatura: 3.2°C
   Humedad: 87.4%
   Etileno: 52.3ppm
   Presión de botón #1

📡 Enviando datos al Gateway...
📤 Paquete enviado (esperando confirmación del Gateway...)

✅ ÉXITO: Datos enviados al Gateway
   Gateway los recibió correctamente

📊 Estadísticas:
   Total presiones: 1
   Envíos exitosos: 1
   Errores: 0
   Tasa de éxito: 100.0%
```

### 4.3 LED de Feedback

**LED parpadea 3 veces rápido** = ✅ Éxito
```
encendido 50ms → apagado 50ms → (3 veces)
```

**LED parpadea 5 veces lento** = ❌ Error
```
encendido 100ms → apagado 100ms → (5 veces)
```

---

## ✅ PASO 5: Verificar en Gateway

**Abre el Serial Monitor del Gateway**, deberías ver:

```
📦 Hielera 99: Temp=3.2°C, Hum=87.4%, Eth=52.3ppm [MAC: 30:AE:A4:07:57:38]
```

**¡Perfecto!** El Gateway está recibiendo los datos del botón.

---

## 🌐 PASO 6: Verificar en Web

1. **Abre tu navegador** en: `http://localhost:3002`
2. **En el dashboard** deberías ver:
   - Hielera ID: 99
   - Temperatura: 3.2°C
   - Humedad: 87.4%
   - Etileno: 52.3ppm

3. **Presiona el botón varias veces**:
   - Los valores cambiarán cada vez (datos simulados aleatorios)
   - Verás actualizaciones en tiempo real

---

## 📊 Datos Simulados

Cada vez que presionas el botón, genera datos **aleatorios pero realistas**:

| Parámetro    | Rango           | Propósito                 |
|--------------|-----------------|---------------------------|
| ID           | 99 (fijo)       | Identificar como "test"   |
| Temperatura  | 2.0 - 5.0°C     | Rango típico refrigerador |
| Humedad      | 80 - 95%        | Rango óptimo para frutas  |
| Etileno      | 0 - 100 ppm     | Nivel bajo-medio          |

---

## 🔍 Troubleshooting

### ❌ LED parpadea lento (error)

**Problema**: No se pudo enviar al Gateway

**Soluciones**:
1. Verifica MAC Address del Gateway en el código (línea 35)
2. Asegúrate de que el Gateway esté encendido
3. Acerca los ESP32 (< 5 metros para testing)
4. Verifica formato de MAC: `{0x24, 0x0A, ...}` (con "0x")

---

### ❌ Al presionar botón no pasa nada

**Problema**: Botón mal conectado

**Soluciones**:
1. Verifica conexiones:
   - Terminal 1 del botón → GPIO 13
   - Terminal 2 del botón → GND
2. Prueba con otro botón (puede estar dañado)
3. En Serial Monitor verifica que GPIO 13 lee LOW al presionar

---

### ❌ Gateway no muestra datos

**Problema**: Gateway no está registrando el peer

**Soluciones**:
1. En Nodo: Verifica MAC del Gateway en código
2. En Gateway: Debe estar esperando datos ("GATEWAY LISTO")
3. Reinicia ambos ESP32 (botón RESET)
4. Acerca los dispositivos

---

### ❌ Web no muestra datos

**Problema**: Backend no conectado o WebSocket caído

**Soluciones**:
1. Verifica backend en ejecución: `http://localhost:3001/health`
2. Reinicia backend: `cd backend && npm run dev`
3. Verifica MySQL activo: `docker ps`
4. Revisa logs del backend

---

## 🎛️ Personalización

### Cambiar ID de hielera:
```cpp
// Línea 31
#define HIELERA_ID 1  // Cambia a 1, 2, 3, etc.
```

### Cambiar pin del botón:
```cpp
// Línea 37 - Usa otro GPIO disponible
#define BUTTON_PIN 15  // Cambia a 15, 12, 14, etc.
```

### Cambiar velocidad de envío (anti-rebote):
```cpp
// Línea 40 - Milisegundos mínimos entre presiones
const unsigned long debounceDelay = 500; // 500ms = medio segundo
```

### Cambiar rango de datos simulados:
```cpp
// Línea 74-76
testData.temp = 0.0 + (random(0, 100) / 10.0);        // 0-10°C
testData.hum = 50.0 + (random(0, 500) / 10.0);        // 50-100%
testData.ethylene = random(0, 2000) / 10.0;           // 0-200 ppm
```

---

## 📋 Checklist de Testing

Verifica cada paso:

- ✅ Gateway encendido y mostrando "GATEWAY LISTO"
- ✅ MAC del Gateway anotada y configurada en Nodo
- ✅ Botón conectado (GPIO 13 y GND)
- ✅ Código subido al ESP32 sin errores
- ✅ Serial Monitor del Nodo abierto (115200 baud)
- ✅ Al presionar botón: LED parpadea 3x rápido
- ✅ Serial Monitor del Nodo: "✅ ÉXITO"
- ✅ Serial Monitor del Gateway: "📦 Hielera 99: ..."
- ✅ Backend en funcionamiento (localhost:3001)
- ✅ Web muestra datos (localhost:3002)
- ✅ Datos cambian al presionar botón múltiples veces

---

## 🎯 Próximos Pasos

Una vez que **TODO funcione** con el botón:

### ✅ Confirmado:
- ESP-NOW funciona correctamente
- Gateway recibe y procesa datos
- Backend almacena en base de datos
- Frontend muestra en tiempo real

### 🚀 Ahora puedes:
1. **Cambiar al código con sensores reales**:
   ```
   hardware/esp32-nodo-hielera/esp32-nodo-hielera.ino
   ```

2. **Conectar sensores físicos**:
   - DHT22 en GPIO 4
   - MQ-135 en GPIO 34

3. **Mantener este código como respaldo**:
   - Útil para debugging futuro
   - Testing rápido sin sensores
   - Verificación de conexiones

---

## 💡 Ventajas de este Enfoque

1. **Testing Incremental**:
   - ✅ Primero: Comunicación básica (botón)
   - ✅ Después: Sensores reales

2. **Debugging Fácil**:
   - Si falla con sensores, vuelve al botón
   - Identifica si el problema es hardware o comunicación

3. **Sin Dependencias de Hardware**:
   - No esperas a que lleguen sensores
   - Pruebas todo el sistema ya

4. **Datos Controlados**:
   - Generas datos cuando quieras (presionando botón)
   - No esperas a que cambien condiciones ambientales

---

## 📞 Resumen Rápido

```
1. Conecta botón → GPIO 13 y GND
2. Obtén MAC del Gateway
3. Configura MAC en código (línea 35)
4. Sube código al ESP32
5. Abre Serial Monitor (115200)
6. Presiona botón físico
7. Verifica LED parpadea 3x rápido
8. Verifica Gateway recibe datos
9. Verifica web muestra datos
10. ¡Listo para sensores reales!
```

---

**🎉 ¡Testing simplificado y efectivo!** 🔘
