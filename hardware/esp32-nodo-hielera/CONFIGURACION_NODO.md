# 📦 Configuración del ESP32 Nodo Hielera (Cliente con Sensores)

## 🎯 ¿Qué hace este ESP32?

Este ESP32 es el **nodo de la hielera** que tiene los sensores y envía datos al Gateway:

```
┌─────────────────────────────────────────────────────┐
│         ESP32 NODO HIELERA (Cliente)                │
│                                                     │
│  1. 🌡️ LEE sensores cada 10 segundos               │
│     • DHT22: Temperatura y Humedad                 │
│     • MQ-135: Nivel de etileno (maduración)        │
│                                                     │
│  2. 📡 ENVÍA datos por ESP-NOW al Gateway          │
│     (comunicación directa sin WiFi)                │
│                                                     │
│  3. 💡 LED indica estado del envío                 │
│     • Parpadeo rápido: Éxito ✅                    │
│     • Parpadeo lento 3x: Error ❌                  │
└─────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

```
[Sensores] → [ESP32 Hielera] ──ESP-NOW──> [ESP32 Gateway] → [Laptop]
  DHT22         Lee y procesa      <2ms       Recibe y       Backend
  MQ-135        cada 10s           latencia    retransmite
```

---

## 🛒 Componentes Necesarios (por cada hielera)

### Hardware Requerido:

| Componente | Cantidad | Precio aprox. | Dónde comprar |
|------------|----------|---------------|---------------|
| **ESP32 DevKit v1** | 1 | $7 USD | Amazon, AliExpress |
| **DHT22** (AM2302) | 1 | $3 USD | Amazon, Mercado Libre |
| **MQ-135** | 1 | $2 USD | Amazon, AliExpress |
| **Cables Dupont M-M** | 10 | $2 USD | Amazon, Mercado Libre |
| **Protoboard 400 puntos** | 1 | $2 USD | Opcional para testing |
| **Cable USB Micro** | 1 | $2 USD | Para programación |
| **Batería 18650 + holder** | 1 (opcional) | $5 USD | Para uso portátil |

**Total por hielera: ~$18 USD** (sin batería)

### Especificaciones de Sensores:

#### DHT22 (Temperatura y Humedad)
- **Rango temperatura**: -40°C a 80°C
- **Precisión**: ±0.5°C
- **Rango humedad**: 0-100% RH
- **Precisión**: ±2-5% RH
- **Voltaje**: 3.3V - 5V
- **Pins**: VCC, DATA, NC, GND

#### MQ-135 (Gases/Etileno)
- **Detecta**: NH₃, CO₂, Alcohol, Benceno, Etileno
- **Rango**: 10-1000 ppm
- **Voltaje**: 5V (funciona con 3.3V pero menos sensible)
- **Salida**: Analógica (0-4095 en ESP32)
- **Calentamiento**: Requiere 24-48h para precisión óptima

---

## 🔌 PASO 1: Conexiones de Hardware

### Diagrama de Conexión:

```
ESP32 DevKit v1                DHT22           MQ-135
┌─────────────────┐          ┌────────┐      ┌────────┐
│                 │          │        │      │        │
│    3.3V ────────┼──────────┤ VCC    │      │        │
│                 │          │        │      │        │
│    GND ─────────┼──────────┤ GND    │──────┤ GND    │
│                 │          │        │      │        │
│    GPIO 4 ──────┼──────────┤ DATA   │      │        │
│                 │          └────────┘      │        │
│    GPIO 34 ─────┼─────────────────────────┤ A0     │
│                 │                          │        │
│    5V* ─────────┼──────────────────────────┤ VCC    │
│                 │                          └────────┘
│    GPIO 2 (LED) │
└─────────────────┘

* Si no tienes pin 5V disponible, usa 3.3V (el MQ-135 funcionará
  pero será menos sensible)
```

### Tabla de Conexiones Detallada:

| Component | Pin Component | → | ESP32 Pin | Cable Color (sugerido) |
|-----------|---------------|---|-----------|------------------------|
| **DHT22** | VCC | → | 3.3V | Rojo |
| **DHT22** | GND | → | GND | Negro |
| **DHT22** | DATA | → | GPIO 4 | Amarillo |
| **MQ-135** | VCC | → | 5V o 3.3V | Rojo |
| **MQ-135** | GND | → | GND | Negro |
| **MQ-135** | A0 | → | GPIO 34 | Azul |

### ⚠️ Notas Importantes de Conexión:

1. **GPIO 34** es solo **INPUT** (no se puede usar como OUTPUT)
2. **NO uses GPIO 0, 2, 12, 15** para sensores (problemas de boot)
3. **DHT22**: Algunos modelos incluyen resistencia pull-up integrada
   - Si no tiene: Añade resistencia 10kΩ entre DATA y VCC
4. **MQ-135**: 
   - Conecta solo **A0** (salida analógica)
   - **NO conectes** D0 (salida digital)
   - Si alimentas con 5V, el ESP32 puede leer 5V en GPIO 34 sin problemas

---

## 🛠️ PASO 2: Instalar Arduino IDE (si no lo hiciste)

### Si ya configuraste el Gateway, omite este paso.

1. **Descargar Arduino IDE 2.x**:
   ```
   https://www.arduino.cc/en/software
   ```

2. **Instalar soporte ESP32**:
   - `Arduino IDE` → `Settings` (⌘,)
   - En "Additional boards manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - `Tools` → `Board` → `Boards Manager`
   - Buscar "esp32" → Instalar **"esp32 by Espressif Systems"**

3. **Instalar librería DHT**:
   - `Sketch` → `Include Library` → `Manage Libraries`
   - Buscar "DHT sensor library"
   - Instalar **"DHT sensor library by Adafruit"**
   - También instalar **"Adafruit Unified Sensor"** (dependencia)

---

## 📝 PASO 3: Obtener MAC Address del Gateway

### ⚠️ IMPORTANTE: Debes hacer esto PRIMERO antes de programar el nodo

### 3.1 Modificar el código del Gateway:

1. **Abre el código del Gateway** que ya programaste:
   ```
   hardware/esp32-gateway/esp32-gateway.ino
   ```

2. **Añade estas 2 líneas** después de la línea 203 (después de `WiFi.softAP(ssid, password);`):

   ```cpp
   WiFi.softAP(ssid, password);
   
   // AÑADIR ESTAS 2 LÍNEAS:
   Serial.print("📍 MAC Address del Gateway: ");
   Serial.println(WiFi.macAddress());
   
   IPAddress IP = WiFi.softAPIP();
   ```

3. **Vuelve a subir el código al Gateway**

4. **Abre Serial Monitor** (115200 baud)

5. **Presiona RESET** en el Gateway

### 3.2 Copiar la MAC Address:

Verás algo como:

```
📍 MAC Address del Gateway: AA:BB:CC:DD:EE:FF
```

**Anota esta dirección** (ejemplo: `AA:BB:CC:DD:EE:FF`)

---

## 🔧 PASO 4: Configurar el Código del Nodo

1. **Abre el archivo del nodo**:
   ```
   File → Open → Selecciona:
   hardware/esp32-nodo-hielera/esp32-nodo-hielera.ino
   ```

2. **IMPORTANTE: Cambiar 2 valores**:

### ⚙️ Configuración 1: ID de la Hielera

Busca la línea 24:

```cpp
// Línea 24 - Cambiar este número para cada hielera
#define HIELERA_ID 1  // 🔴 CAMBIAR: 1, 2, 3, 4...
```

**Si es tu primera hielera**: Déjalo en `1`  
**Si es la segunda hielera**: Cambia a `2`  
**Si es la tercera hielera**: Cambia a `3`  
Y así sucesivamente...

### ⚙️ Configuración 2: MAC Address del Gateway

Busca la línea 30:

```cpp
// Línea 30 - REEMPLAZAR con la MAC del Gateway
uint8_t gatewayAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
```

**Reemplaza** con la MAC que copiaste en el Paso 3:

**Ejemplo**: Si la MAC del Gateway es `AA:BB:CC:DD:EE:FF`, escribe:

```cpp
uint8_t gatewayAddress[] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF};
```

**Otro ejemplo**: Si la MAC es `24:0A:C4:12:34:56`:

```cpp
uint8_t gatewayAddress[] = {0x24, 0x0A, 0xC4, 0x12, 0x34, 0x56};
```

### 🔄 Conversión MAC a código:

```
Formato humano:     AA : BB : CC : DD : EE : FF
                    ↓    ↓    ↓    ↓    ↓    ↓
Formato código:   0xAA,0xBB,0xCC,0xDD,0xEE,0xFF
```

---

## 🚀 PASO 5: Subir el Código al ESP32 Nodo

### 5.1 Configurar Arduino IDE:

1. **Conectar ESP32** con cable USB

2. **Seleccionar placa**:
   - `Tools` → `Board` → `ESP32 Arduino` → `ESP32 Dev Module`

3. **Seleccionar puerto**:
   - `Tools` → `Port` → `/dev/cu.usbserial-XXXX`

4. **Configurar parámetros**:
   ```
   Upload Speed: 115200
   CPU Frequency: 240MHz (WiFi/BT)
   Flash Size: 4MB (32Mb)
   Partition Scheme: Default 4MB with spiffs
   ```

### 5.2 Compilar y Subir:

1. **Click en ✓** (Verify) para compilar
   - Espera 30-60 segundos
   - Debe decir "Done compiling"

2. **Click en →** (Upload) para subir
   - Si falla, mantén presionado **BOOT** mientras subes
   - Debe terminar con "Hard resetting via RTS pin..."

---

## 🖥️ PASO 6: Verificar que Funciona

### 6.1 Abrir Serial Monitor:

1. `Tools` → `Serial Monitor` (o ⌘ + Shift + M)
2. Configurar: **115200 baud**
3. Presionar **RESET** en el ESP32

### 6.2 Debes Ver Este Mensaje:

```
═══════════════════════════════════════════
  ESP32 NODO HIELERA #1 - Sistema IoT
═══════════════════════════════════════════

📍 MAC Address de esta Hielera: 24:0A:C4:XX:XX:XX
   (Anota esta dirección si es el Gateway)

📶 Configurando WiFi...
✅ WiFi en modo Station

📡 Inicializando ESP-NOW...
✅ ESP-NOW inicializado

🔗 Registrando Gateway como peer...
✅ Gateway registrado como peer

🔬 Inicializando sensores...
✅ Sensores inicializados

═══════════════════════════════════════════
✅ HIELERA #1 LISTA PARA ENVIAR DATOS
═══════════════════════════════════════════

📊 Intervalo de envío: 10 segundos

🚀 Iniciando lectura y envío de datos...
```

### 6.3 Cada 10 segundos verás:

```
─────────────────────────────────────────
📤 Ciclo de lectura #1 (Hielera #1)
─────────────────────────────────────────
🌡️  DHT22: Temp=22.5°C, Hum=58.0%
💨 MQ-135: Raw=1250, Etileno=152.4ppm

📊 Resumen de datos:
   ID: 1
   Temperatura: 22.5°C
   Humedad: 58.0%
   Etileno: 152.4ppm
   Timestamp: 12345 ms

📡 Enviando datos al Gateway...
📤 Datos enviados (esperando confirmación...)
✅ Datos enviados correctamente al Gateway

📈 Estadísticas:
   Envíos exitosos: 1
   Errores: 0
   Tasa de éxito: 100.0%
```

### 6.4 En el Serial Monitor del Gateway verás:

```
📦 Hielera 1: Temp=22.5°C, Hum=58.0%, Eth=152.4ppm
📦 Hielera 1: Temp=22.6°C, Hum=57.8%, Eth=153.1ppm
```

### ✅ Si ves ambos mensajes, ¡el sistema funciona perfectamente!

---

## 🔍 PASO 7: Probar el Sistema Completo

### 7.1 Tener ambos ESP32 encendidos:

1. **Gateway**: Conectado a corriente USB
2. **Nodo Hielera**: Conectado a corriente USB
3. Ambos con Serial Monitor abierto (2 ventanas)

### 7.2 Verificar comunicación:

**En el Nodo** verás:
```
✅ Datos enviados correctamente al Gateway
```

**En el Gateway** verás:
```
📦 Hielera 1: Temp=22.5°C, Hum=58.0%, Eth=152.4ppm
```

### 7.3 Conectar tu laptop al Gateway:

1. **Conectar WiFi**: "ESP32-Gateway-Hieleras" (password: hieleras2026)
2. **Verificar Backend** está corriendo:
   ```bash
   cd /Users/enrique/Documents/Programacion/invent/backend
   npm start
   ```
3. **El backend debería recibir los datos** del Gateway automáticamente

---

## 💡 LED de Estado (GPIO 2)

El LED integrado del ESP32 indica el estado:

| Comportamiento | Significado |
|----------------|-------------|
| **Parpadeo rápido 1x** (50ms) | ✅ Datos enviados exitosamente |
| **Parpadeo lento 3x** (100ms c/u) | ❌ Error al enviar, reintentando |
| **Parpadeo rápido 3x al inicio** | 🚀 Sistema inicializado |
| **Encendido constante** | 📊 Leyendo sensores |

---

## 🔧 Configuraciones Avanzadas

### Cambiar intervalo de envío:

```cpp
// Línea 36 - Cambiar intervalo de envío
#define SEND_INTERVAL 10000  // 🔴 Cambiar a 5000 (5s), 30000 (30s), etc.
```

**Recomendaciones**:
- **5000 ms (5s)**: Para monitoreo crítico
- **10000 ms (10s)**: Balance óptimo (por defecto)
- **30000 ms (30s)**: Para ahorrar batería
- **60000 ms (1 min)**: Máximo ahorro energético

### Calibrar MQ-135 (Opcional):

El sensor MQ-135 viene pre-configurado con valores aproximados. Para mayor precisión:

1. **Dejar calentar 24-48 horas** conectado
2. **En aire limpio**, el valor crudo debería ser ~300-400
3. **Cerca de frutas maduras** (plátanos muy maduros), debería aumentar

**Ajustar la fórmula** en línea 87:

```cpp
// Línea 87 - Calibración personalizada
float ethylenePPM = (rawValue / 4095.0) * 500.0; // 🔴 Ajustar multiplicador
```

Si los valores parecen muy altos o muy bajos, cambia el `500.0`:
- **Valores muy altos**: Reduce a `300.0` o `200.0`
- **Valores muy bajos**: Aumenta a `800.0` o `1000.0`

---

## 🔋 Alimentación Portátil (Opcional)

### Opción 1: Batería 18650

**Componentes**:
- Batería 18650 (3.7V)
- Holder para 18650
- Módulo TP4056 (carga con USB)
- Boost converter (3.7V → 5V) opcional

**Autonomía estimada**:
- Con batería 2600mAh: **~15 horas** continuas
- Con batería 3500mAh: **~20 horas** continuas
- Con intervalo de 30s: **2-3 días**

**Conexión**:
```
[Batería 18650] → [TP4056] → [ESP32: VIN y GND]
```

### Opción 2: Power Bank USB

**Más simple**:
- Conectar ESP32 con cable USB a power bank cualquiera
- Power bank de 10000mAh: **~3-4 días** de autonomía

---

## 🛠️ Solución de Problemas Comunes

### ❌ Error: "❌ Error agregando peer (Gateway)"

**Causa**: MAC Address del Gateway incorrecta

**Solución**:
1. Verifica que copiaste bien la MAC del Gateway
2. Formato correcto: `{0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF}`
3. Cada byte debe llevar `0x` adelante
4. Separados por comas

---

### ❌ Error: "❌ Error leyendo DHT22"

**Causas posibles**:

1. **Conexión suelta**:
   - Verificar que los cables estén bien conectados
   - VCC → 3.3V (no 5V para DHT22)
   - GND → GND
   - DATA → GPIO 4

2. **Resistencia pull-up faltante**:
   - Algunos DHT22 necesitan resistencia 10kΩ entre DATA y VCC
   - Verifica si tu modelo la incluye

3. **Sensor defectuoso**:
   - Prueba con otro DHT22
   - Verifica con multímetro que llegue voltaje

---

### ❌ MQ-135 siempre lee 0 o valores extraños

**Soluciones**:

1. **Calentamiento insuficiente**:
   - El MQ-135 necesita 24-48h encendido para estabilizarse
   - Déjalo conectado un día completo

2. **Pin incorrecto**:
   - Debe estar en **GPIO 34** (ADC1_CH6)
   - Conectar **A0** del sensor, no D0

3. **Alimentación insuficiente**:
   - Si usas 3.3V, será menos sensible
   - Prueba con 5V (el pin ESP32 aguanta 5V en entrada)

---

### ❌ No se envían datos al Gateway

**Checklist**:

1. ✅ **MAC Address correcta** en el código del nodo
2. ✅ **Gateway encendido** y funcionando
3. ✅ **Distancia**: <50m en interiores, <200m exteriores
4. ✅ **Mensaje "Gateway registrado como peer"** en Serial Monitor
5. ✅ **WiFi.mode(WIFI_STA)** configurado (línea 163)

**Si sigue fallando**:
- Prueba acercar ambos ESP32 a 1-2 metros
- Verifica orientación de antenas
- Reinicia ambos ESP32

---

### ❌ Tasa de éxito <90%

**Causas**:

1. **Distancia excesiva**: Acerca los ESP32
2. **Interferencias**: Aleja de routers WiFi, Bluetooth, microondas
3. **Obstáculos**: Paredes de concreto bloquean señal
4. **Mala alimentación**: Usa cable USB de calidad y fuente estable

---

## 📊 Valores de Referencia

### Temperatura y Humedad (DHT22):

| Condición | Temperatura | Humedad |
|-----------|-------------|---------|
| **Refrigerador** | 2-4°C | 80-95% |
| **Ambiente** | 20-25°C | 40-60% |
| **Alarma fría** | <0°C | - |
| **Alarma caliente** | >10°C | - |

### Etileno (MQ-135):

| Nivel | ppm | Significado |
|-------|-----|-------------|
| **Aire limpio** | 0-50 | Sin maduración detectada |
| **Bajo** | 50-100 | Maduración normal |
| **Medio** | 100-200 | Maduración acelerada |
| **Alto** | 200-500 | Sobremaduración |
| **Crítico** | >500 | Descomposición |

---

## 🚀 Múltiples Hieleras

### Para añadir más hieleras:

1. **Programar cada ESP32** con el mismo código
2. **Cambiar solo HIELERA_ID** en cada uno:
   ```cpp
   #define HIELERA_ID 1  // Primera hielera
   #define HIELERA_ID 2  // Segunda hielera
   #define HIELERA_ID 3  // Tercera hielera
   // etc...
   ```
3. **Misma MAC del Gateway** en todos
4. **No cambiar nada más**

### El Gateway automáticamente:
- ✅ Diferencia cada hielera por su ID
- ✅ Muestra datos separados
- ✅ Soporta hasta 10 hieleras (configurable a 20)

---

## 📦 Instalación en Hielera Real

### Recomendaciones de montaje:

1. **Protección del circuito**:
   - Usar caja plástica hermética
   - Sellado con silicona en aberturas de cables
   - Evitar condensación en el ESP32

2. **Ubicación de sensores**:
   - **DHT22**: Dentro de la hielera, alejado de paredes
   - **MQ-135**: Cerca de los alimentos (máxima sensibilidad)
   - Cables de extensión si es necesario (máx 3m)

3. **Alimentación**:
   - Batería 18650 + panel solar pequeño (5W)
   - O cable USB que salga de la hielera (sellado)

4. **Alcance ESP-NOW**:
   - Prueba de conexión antes de cerrar
   - Si hay problemas, usa antena externa

---

## ✅ Checklist Final

Antes de cerrar la hielera, verifica:

- ✅ El código se subió sin errores
- ✅ HIELERA_ID correcta (1, 2, 3...)
- ✅ MAC Address del Gateway configurada
- ✅ Serial Monitor muestra "Datos enviados correctamente"
- ✅ Gateway recibe los datos (visible en su Serial Monitor)
- ✅ Sensores DHT22 y MQ-135 conectados y funcionando
- ✅ LED parpadea correctamente
- ✅ Tasa de éxito >95%

---

## 🎉 ¡Sistema Completo Funcionando!

Cuando tengas:
```
[Nodo 1] ──┐
[Nodo 2] ──┤
[Nodo 3] ──┼──> [Gateway] ──WiFi──> [Backend] ──> [Dashboard Web]
[Nodo N] ──┘
```

Podrás ver en tiempo real:
- 🌡️ Temperatura de todas las hieleras
- 💧 Humedad de cada una
- 🍌 Nivel de maduración (etileno)
- 📊 Gráficas históricas
- 🚨 Alertas automáticas
- 📈 Predicción de vida útil

---

**¡Listo para producción!** 🚀
