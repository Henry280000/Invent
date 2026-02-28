# 🔧 Hardware ESP32 - Sistema de Monitoreo de Hieleras

## 📡 Arquitectura del Sistema

Este sistema utiliza **2 tipos de ESP32** que se comunican entre sí usando **ESP-NOW** (protocolo de Espressif de baja latencia):

```
┌──────────────────────────────────────────────────────────────────┐
│                    SISTEMA COMPLETO                              │
└──────────────────────────────────────────────────────────────────┘

    [ESP32 Nodo 1]      [ESP32 Nodo 2]      [ESP32 Nodo N]
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Hielera #1 │     │  Hielera #2 │     │  Hielera #N │
    │             │     │             │     │             │
    │  DHT22      │     │  DHT22      │     │  DHT22      │
    │  MQ-135     │     │  MQ-135     │     │  MQ-135     │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                    │
           └───────ESP-NOW─────┴───────ESP-NOW─────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  ESP32 Gateway   │
                    │   (Servidor)     │
                    │                  │
                    │  • Recibe datos  │
                    │  • Crea WiFi AP  │
                    │  • WebSocket:81  │
                    └────────┬─────────┘
                             │
                         WiFi AP
                   "ESP32-Gateway-Hieleras"
                             │
                             ▼
                    ┌─────────────────┐
                    │  Tu Laptop/PC   │
                    │  192.168.4.1    │
                    │                 │
                    │  Backend Node.js│
                    │  puerto: 8080   │
                    └────────┬────────┘
                             │
                             ▼
                    [Dashboard Web React]
```

---

## 🎯 Componentes del Sistema

### 1️⃣ ESP32 Gateway (Servidor) - 1 unidad

**Función**: Recibir datos de todas las hieleras y retransmitir a la laptop

**Carpeta**: [`esp32-gateway/`](esp32-gateway/)

**Firmware**: [`esp32-gateway.ino`](esp32-gateway/esp32-gateway.ino)

**Guía de configuración**: [`CONFIGURACION_GATEWAY.md`](esp32-gateway/CONFIGURACION_GATEWAY.md)

**Características**:
- ✅ Recibe datos por ESP-NOW
- ✅ Crea Access Point WiFi
- ✅ Servidor WebSocket en puerto 81
- ✅ Soporta hasta 10-20 hieleras
- ✅ JSON en tiempo real

**Librerías necesarias**:
```
- WiFi.h (incluida con ESP32)
- esp_now.h (incluida con ESP32)
- WebSocketsServer (by Markus Sattler)
- ArduinoJson (by Benoit Blanchon)
```

---

### 2️⃣ ESP32 Nodo Hielera (Cliente) - N unidades

**Función**: Leer sensores y enviar datos al Gateway

**Carpeta**: [`esp32-nodo-hielera/`](esp32-nodo-hielera/)

**Firmware**: [`esp32-nodo-hielera.ino`](esp32-nodo-hielera/esp32-nodo-hielera.ino)

**Guía de configuración**: [`CONFIGURACION_NODO.md`](esp32-nodo-hielera/CONFIGURACION_NODO.md)

**Características**:
- ✅ Lee DHT22 (Temp + Humedad)
- ✅ Lee MQ-135 (Etileno/gases)
- ✅ Envía datos cada 10s por ESP-NOW
- ✅ LED de estado integrado
- ✅ ID configurable por hielera

**Sensores**:
```
- DHT22: GPIO 4 (temperatura y humedad)
- MQ-135: GPIO 34 (etileno/maduración)
- LED: GPIO 2 (status)
```

**Librerías necesarias**:
```
- WiFi.h (incluida con ESP32)
- esp_now.h (incluida con ESP32)
- DHT.h (by Adafruit)
- Adafruit Unified Sensor (dependencia)
```

---

## 🚀 Orden de Configuración

### Paso 1: Configurar Gateway (primero)

1. Abrir guía: [`esp32-gateway/CONFIGURACION_GATEWAY.md`](esp32-gateway/CONFIGURACION_GATEWAY.md)
2. Instalar Arduino IDE + librerías
3. Subir firmware al ESP32 Gateway
4. **Obtener MAC Address del Gateway** (importante para paso 2)
5. Verificar que aparece red WiFi "ESP32-Gateway-Hieleras"

**Resultado esperado**:
```
✅ Access Point activo: ESP32-Gateway-Hieleras
📍 MAC Address del Gateway: AA:BB:CC:DD:EE:FF
✅ GATEWAY LISTO Y ESPERANDO DATOS
```

---

### Paso 2: Configurar Nodos (después del Gateway)

1. Abrir guía: [`esp32-nodo-hielera/CONFIGURACION_NODO.md`](esp32-nodo-hielera/CONFIGURACION_NODO.md)
2. Conectar sensores DHT22 y MQ-135 al ESP32
3. **Modificar código**:
   - Cambiar `HIELERA_ID` (1, 2, 3...)
   - Insertar MAC Address del Gateway
4. Subir firmware al ESP32 Nodo
5. Verificar que envía datos correctamente

**Resultado esperado** (en Serial Monitor del Nodo):
```
✅ Datos enviados correctamente al Gateway
Envíos exitosos: 15
Tasa de éxito: 100.0%
```

**Resultado esperado** (en Serial Monitor del Gateway):
```
📦 Hielera 1: Temp=2.3°C, Hum=85.0%, Eth=45.2ppm
```

---

## 🔄 Flujo de Datos

### 1. Lectura de Sensores (cada 10 segundos)
```
Nodo ESP32:
├─ DHT22 → Temperatura (°C)
├─ DHT22 → Humedad (%)
└─ MQ-135 → Etileno (ppm)
```

### 2. Transmisión ESP-NOW (< 2ms latency)
```
Nodo → Gateway
Protocolo: ESP-NOW
Alcance: 50m interiores, 200m exteriores
Consumo: <1% vs WiFi directo
```

### 3. Retransmisión WebSocket (tiempo real)
```
Gateway → Laptop
Protocolo: WebSocket
Puerto: 81
Formato: JSON
```

### 4. Procesamiento Backend
```
Laptop (Node.js Backend):
├─ Recibe JSON del Gateway
├─ Guarda en MySQL
├─ Clasifica por severidad
├─ Genera alertas
└─ Broadcast a Dashboard Web
```

---

## 📊 Formato de Datos

### Mensaje ESP-NOW (binario, 28 bytes)
```cpp
struct_message {
    int id;              // 4 bytes - ID de hielera
    float temp;          // 4 bytes - Temperatura °C
    float hum;           // 4 bytes - Humedad %
    float ethylene;      // 4 bytes - Etileno ppm
    unsigned long timestamp; // 4 bytes - Timestamp
}
```

### Mensaje WebSocket (JSON)
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

---

## 💰 Costo del Sistema

### Costo por Nodo (Hielera):
| Componente | Precio |
|------------|--------|
| ESP32 DevKit v1 | $7 |
| DHT22 | $3 |
| MQ-135 | $2 |
| Cables | $2 |
| Protoboard (opcional) | $2 |
| **Total por hielera** | **$16** |

### Costo del Gateway:
| Componente | Precio |
|------------|--------|
| ESP32 DevKit v1 | $7 |
| **Total Gateway** | **$7** |

### Ejemplo sistema completo (5 hieleras):
```
Gateway:        $7
5 Nodos:   5 × $16 = $80
─────────────────────
Total:             $87
```

**Comparativa**:
- Sistema comercial similar: $800-1500
- Ahorro: ~90% 🎉

---

## ⚡ Ventajas de ESP-NOW vs WiFi

| Característica | ESP-NOW | WiFi Directo |
|----------------|---------|--------------|
| **Latencia** | <2 ms | 50-100 ms |
| **Consumo energía** | 1% | 100% |
| **Alcance** | 200m | 50m |
| **Requiere router** | ❌ No | ✅ Sí |
| **Funciona sin Internet** | ✅ Sí | ❌ No |
| **Nodos soportados** | 20 | 5-10 |
| **Configuración** | Simple | Compleja |

ESP-NOW es **ideal para**:
- ✅ Hieleras móviles
- ✅ Zonas rurales sin WiFi
- ✅ Uso con batería
- ✅ Tiempo real crítico

---

## 🔋 Autonomía con Batería

### Con batería 18650 (3500mAh):

| Intervalo de envío | Autonomía |
|-------------------|-----------|
| **10 segundos** (por defecto) | ~20 horas |
| **30 segundos** | ~2-3 días |
| **1 minuto** | ~5-7 días |
| **5 minutos** | ~2-3 semanas |

### Mejoras para mayor autonomía:
1. ✅ Deep Sleep entre lecturas
2. ✅ Panel solar 5W
3. ✅ Aumentar intervalo a 1-5 minutos
4. ✅ Usar batería LiPo más grande (5000mAh+)

---

## 🛠️ Herramientas Necesarias

### Software:
- ✅ Arduino IDE 2.x
- ✅ Driver USB (CH340 o CP2102)
- ✅ Librerías mencionadas arriba

### Hardware de desarrollo:
- ✅ Cable USB Micro (datos, no solo carga)
- ✅ 2+ ESP32 DevKit v1
- ✅ Protoboard 400 puntos
- ✅ Cables Dupont M-M
- ✅ Multímetro (opcional pero útil)

### Para producción:
- ✅ Soldador + estaño
- ✅ PCB personalizada (opcional)
- ✅ Cajas herméticas
- ✅ Baterías + módulos de carga

---

## 📚 Documentación Completa

### Guías paso a paso:
1. **Gateway**: [`esp32-gateway/CONFIGURACION_GATEWAY.md`](esp32-gateway/CONFIGURACION_GATEWAY.md)
2. **Nodo**: [`esp32-nodo-hielera/CONFIGURACION_NODO.md`](esp32-nodo-hielera/CONFIGURACION_NODO.md)

### Firmware:
1. **Gateway**: [`esp32-gateway/esp32-gateway.ino`](esp32-gateway/esp32-gateway.ino)
2. **Nodo**: [`esp32-nodo-hielera/esp32-nodo-hielera.ino`](esp32-nodo-hielera/esp32-nodo-hielera.ino)

### Sistema completo:
- **README principal**: [`../README.md`](../README.md)
- **Guía ESP32 completa**: [`../ESP32_SYSTEM_GUIDE.md`](../ESP32_SYSTEM_GUIDE.md)

---

## 🐛 Solución de Problemas

### Gateway no se conecta:
1. ✅ Verificar librerías instaladas (WebSockets, ArduinoJson)
2. ✅ Verificar red WiFi "ESP32-Gateway-Hieleras" visible
3. ✅ Revisar Serial Monitor para errores
4. ✅ Presionar RESET y esperar 10 segundos

### Nodo no envía datos:
1. ✅ Verificar MAC Address del Gateway correcta
2. ✅ Verificar Gateway encendido y funcionando
3. ✅ Acercar ESP32s a <5 metros (prueba)
4. ✅ Verificar mensajes en Serial Monitor

### Sensores no funcionan:
1. ✅ DHT22: Verificar pin GPIO 4, resistencia pull-up si es necesario
2. ✅ MQ-135: Dejar calentar 24-48h, verificar GPIO 34
3. ✅ Verificar alimentación 3.3V estable
4. ✅ Revisar conexiones con multímetro

---

## 🎯 Checklist de Implementación

### Fase 1: Gateway
- [ ] Arduino IDE instalado
- [ ] Librerías WebSockets y ArduinoJson instaladas
- [ ] Firmware subido al ESP32 Gateway
- [ ] Red WiFi "ESP32-Gateway-Hieleras" visible
- [ ] MAC Address del Gateway anotada
- [ ] Serial Monitor muestra "GATEWAY LISTO"

### Fase 2: Primer Nodo
- [ ] Librería DHT instalada
- [ ] Sensores DHT22 y MQ-135 conectados
- [ ] HIELERA_ID configurada (1)
- [ ] MAC del Gateway insertada en código
- [ ] Firmware subido al ESP32 Nodo
- [ ] Serial Monitor muestra "Datos enviados correctamente"
- [ ] Gateway recibe datos (visible en su Serial Monitor)

### Fase 3: Backend
- [ ] Laptop conectada a "ESP32-Gateway-Hieleras"
- [ ] Backend Node.js corriendo (puerto 8080)
- [ ] Backend recibe datos del Gateway
- [ ] Datos guardados en MySQL
- [ ] Dashboard web muestra datos en tiempo real

### Fase 4: Expansión
- [ ] Más nodos configurados con IDs únicos
- [ ] Todos los nodos comunicándose exitosamente
- [ ] Sistema probado durante 24h
- [ ] Alertas funcionando correctamente

---

## 📞 Soporte

### Si algo no funciona:

1. **Revisar Serial Monitor** de ambos ESP32
2. **Verificar conexiones** con multímetro
3. **Copiar mensajes de error** completos
4. **Revisar documentación** de las guías específicas

### Recursos útiles:

- **Documentación ESP32**: https://docs.espressif.com/
- **ESP-NOW Protocol**: https://www.espressif.com/en/products/software/esp-now/
- **Arduino ESP32**: https://github.com/espressif/arduino-esp32
- **DHT Library**: https://github.com/adafruit/DHT-sensor-library

---

## 🚀 Próximos Pasos

1. **Configurar Gateway** siguiendo la guía
2. **Obtener MAC Address** del Gateway
3. **Configurar primer Nodo** con sensores
4. **Verificar comunicación** entre ambos
5. **Conectar Backend** para procesar datos
6. **Agregar más Nodos** según sea necesario

---

**¡Sistema de monitoreo profesional por menos de $100!** 🎉
