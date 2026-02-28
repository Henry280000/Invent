# 🚚 Food Transport Dashboard - IoT Monitoring System

Dashboard de monitoreo en tiempo real para carcasas inteligentes de transporte de alimentos con certificación IP65.

## 🎯 Características Principales

### � Sistema de Autenticación y Roles
- **Login/Registro**: Sistema completo de autenticación por email/password
- **Roles de Usuario**:
  - **Administrador**: Gestión de envíos, creación/edición/eliminación de tracking, asignación de camiones
  - **Cliente**: Visualización de sus propios envíos, tracking en tiempo real, estadísticas de sensores
- **Gestión de Sesiones**: Persistencia con localStorage, logout seguro
- **Protección de Rutas**: Acceso controlado según rol de usuario

### 📦 Sistema de Tracking
- **Panel de Administrador**:
  - Crear nuevos envíos con origen/destino/producto/ETA
  - Asignar camiones a envíos (TRUCK-001, TRUCK-002, etc.)
  - Actualizar estado de envíos (En Ruta, Detenido, Entregado, Cancelado)
  - Monitoreo en tiempo real de todos los envíos activos
  - Vista consolidada de sensores por envío
- **Vista de Cliente**:
  - Listado de envíos personales
  - Tracking en tiempo real con ubicación GPS simulada
  - Estadísticas de temperatura y humedad por envío
  - ETA (tiempo estimado de llegada) con cuenta regresiva
  - Última actualización de sensores

### 📡 Conectividad
- **MQTT/WebSockets**: Conexión en tiempo real con broker MQTT
- **LoRaWAN**: Soporte para datos transmitidos vía LoRaWAN
- **Protocol Buffers**: Decodificación eficiente de mensajes binarios
- **Hash-Chaining**: Validación de integridad de la cadena de datos

### 🔒 Sensores de Seguridad (LDR, IMU MPU-6050, Hall A3144)
- **LDR (Light Dependent Resistor)**: Detección de apertura no autorizada
- **IMU (Inertial Measurement Unit)**: Alertas de movimiento brusco o impacto
- **Efecto Hall**: Verificación de acoplamiento magnético a la pared del camión
- **Acelerómetro 3 ejes**: Monitoreo de vibraciones y posición

### 🧪 Sensores Químicos (MQ-137, MQ-135, MQ-3)
- **Amoniaco (NH₃)**: Indicador de descomposición proteica
- **Trimetilamina (TMA)**: Degradación de pescado y productos marinos
- **Etileno**: Maduración de frutas y vegetales
- **Duty Cycles**: Gestión de ciclos de lectura (30-45s cada 15 min) para maximizar vida útil de membrana hidrofóbica

### 🌡️ Sensores Ambientales (DHT22, BMP280)
- **Temperatura (DHT22)**: Rango óptimo -2°C a 5°C
- **Humedad (DHT22)**: Rango óptimo 80% a 95%
- **Presión (BMP280)**: Monitoreo de condiciones de transporte

### 🧬 Inconsistencia Biológica
Algoritmo avanzado que compara la curva de Amoniaco con la temperatura esperada:
- Detecta situaciones donde el NH₃ es anormalmente alto para la temperatura actual
- Alerta sobre posible falla de refrigeración o contaminación previa
- Modelo exponencial basado en cinética de descomposición

### 🚨 Sistema de Alertas
- Clasificación por severidad: CRÍTICA, ALTA, MEDIA, BAJA
- Categorías: Seguridad, Ambiental, Química, Calidad Alimentaria, Biológica
- Filtrado y reconocimiento de alertas
- Estadísticas en tiempo real

### 🔐 Hash-Chaining (SHA-256)
- Validación SHA-256 de integridad de datos
- Detector de pérdida de paquetes
- Visualización de cadena de bloques
- Estadísticas de validación

## 🚀 Instalación Rápida

### Opción 1: Con Docker (Recomendado) 🐳

```bash
# Instalación automática
./install.sh

# Iniciar frontend
npm run dev
```

**¡Listo!** Abre http://localhost:3002

### Opción 2: MySQL Local en Mac 🍎

```bash
# 1. Crear base de datos MySQL
mysql -u root -p
CREATE DATABASE food_transport;
CREATE USER 'foodapp'@'localhost' IDENTIFIED BY 'foodapp123';
GRANT ALL PRIVILEGES ON food_transport.* TO 'foodapp'@'localhost';
EXIT;

# 2. Importar schema
mysql -u foodapp -pfoodapp123 food_transport < database/schema.sql

# 3. Backend
cd backend && npm install && npm run init-db && npm start

# 4. Frontend (nueva terminal)
npm run dev
```

### Prerequisitos
- **Docker** (Opción 1): Docker Desktop instalado
- **MySQL** (Opción 2): MySQL 8.0+ en macOS
- **Node.js** >= 18.x y npm

📖 **[Guía detallada de instalación](docs/INSTALLATION.md)**

## 👤 Credenciales de Prueba

El sistema incluye cuentas de prueba pre-configuradas:

### Cuenta de Administrador:
- **Email**: admin@foodtransport.com
- **Password**: admin123

### Cuenta de Cliente:
- **Email**: cliente@empresa.com
- **Password**: cliente123

También puedes crear nuevas cuentas usando el formulario de registro.

## 📱 Guía de Uso del Sistema de Tracking

### Como Administrador:

1. **Iniciar sesión** con credenciales de administrador
2. **Navegar a "Panel de Admin"** en la barra de navegación
3. **Crear un nuevo envío**:
   - Click en "+ Nuevo Envío"
   - Llenar formulario:
     - Email del cliente
     - ID del camión (ej: TRUCK-001)
     - Origen y Destino
     - Tipo de producto
     - Fecha/hora estimada de llegada
4. **Gestionar envíos**:
   - Cambiar estado (En Ruta → Detenido → Entregado)
   - Ver datos de sensores en tiempo real
   - Eliminar envíos completados

### Como Cliente:

1. **Iniciar sesión** con credenciales de cliente
2. **Navegar a "Mis Envíos"** en la barra de navegación
3. **Ver tracking en tiempo real**:
   - Estado del envío
   - Ruta (origen → destino)
   - Temperatura y humedad actuales (sensores DHT22)
   - Tiempo restante hasta entrega (ETA)
   - Ubicación GPS aproximada
4. **Monitoreo automático**: Los datos se actualizan cada 5 segundos

### Monitoreo IoT (ambos roles):

- **Pestaña "Monitoreo IoT"**: Dashboard completo de sensores
- Visualización de todos los sensores en tiempo real
- Sistema de alertas
- Hash-chain de integridad
- Controles del simulador

## 🎮 Uso del Simulador

El proyecto incluye un simulador de datos integrado para testing sin hardware:

### En la consola del navegador:

```javascript
// Iniciar simulación (envía datos cada 5 segundos)
simulator.start()

// Cambiar intervalo (ej: cada 2 segundos)
simulator.start(2000)

// Cambiar escenario
simulator.setScenario('normal')           // Funcionamiento normal
simulator.setScenario('degradation')      // Degradación acelerada
simulator.setScenario('security_breach')  // Violación de seguridad
simulator.setScenario('temperature_failure') // Falla de refrigeración + inconsistencia biológica

// Detener simulación
simulator.stop()

// Reiniciar
simulator.reset()
```

### Importar en código React:

```javascript
import dataSimulator from './utils/dataSimulator';

// En un componente o useEffect
dataSimulator.start(3000); // Iniciar con intervalo de 3s
```

## ⚙️ Configuración de Broker MQTT

### Configuración por defecto:
- **Broker**: `ws://broker.emqx.io:8083/mqtt` (broker público de prueba)
- **Topic**: `food/transport/sensors/+`

### Configuración personalizada:

1. Click en botón "⚙️ Configuración" en el header
2. Ingresar datos del broker:
   - URL del broker (ej: `ws://localhost:8083/mqtt`)
   - Client ID (opcional)
   - Usuario (opcional)
   - Contraseña (opcional)
3. Click en "Aplicar y reconectar"

### Brokers recomendados para testing:
- **EMQX Cloud**: https://www.emqx.com/en/cloud
- **HiveMQ Cloud**: https://www.hivemq.com/mqtt-cloud-broker/
- **Mosquitto Local**: `ws://localhost:9001` (requiere configuración WebSocket)

## 📦 Formato de Datos (Protocol Buffers)

### Schema Protobuf:

```protobuf
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
```

Ver `src/proto/sensordata.proto` para el schema completo.

### Ejemplo de mensaje JSON (antes de codificar):

```json
{
  "device_id": "DEVICE_001",
  "timestamp": 1709155200000,
  "security": {
    "ldr_light_detected": false,
    "imu_movement_alert": false,
    "hall_magnet_attached": true,
    "imu_acceleration_x": 0.05,
    "imu_acceleration_y": -0.02,
    "imu_acceleration_z": 1.01
  },
  "chemical": {
    "ammonia_nh3": 3.5,
    "trimethylamine_tma": 1.2,
    "ethylene": 45.0,
    "duty_cycle_counter": 12,
    "next_reading_time": 1709156100000
  },
  "environmental": {
    "temperature": 2.5,
    "humidity": 87.0,
    "pressure": 1013.25
  },
  "hash_previous": "abc123...",
  "hash_current": "def456...",
  "sequence_number": 42,
  "battery_voltage": 3.85,
  "signal_strength": -78
}
```

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/
│   ├── alerts/
│   │   └── AlertSystem.jsx          # Sistema de alertas
│   ├── monitoring/
│   │   ├── DeviceInfo.jsx           # Info del dispositivo
│   │   └── HashChainViewer.jsx      # Visualización de hash-chain
│   ├── sensors/
│   │   ├── ChemicalCard.jsx         # Sensores químicos
│   │   ├── EnvironmentalCard.jsx    # Sensores ambientales
│   │   └── SecurityCard.jsx         # Sensores de seguridad
│   └── ui/
│       └── Indicators.jsx           # Componentes UI reutilizables
├── services/
│   ├── alertService.js              # Lógica de alertas
│   ├── hashChainService.js          # Validación de hash-chain
│   ├── mqttService.js               # Cliente MQTT
│   └── protobufService.js           # Decodificador Protobuf
├── utils/
│   └── dataSimulator.js             # Simulador de datos
├── proto/
│   └── sensordata.proto             # Schema Protocol Buffers
├── App.jsx                          # Componente principal
├── main.jsx                         # Punto de entrada
└── index.css                        # Estilos globales
```

## 🎨 Tecnologías Utilizadas

- **React 18.3**: Biblioteca UI
- **Vite 5.1**: Build tool y dev server
- **Tailwind CSS 3.4**: Framework de estilos
- **MQTT.js 5.3**: Cliente MQTT para WebSockets
- **Protobuf.js 7.2**: Codificación/decodificación de Protocol Buffers
- **Recharts 2.12**: Gráficas y visualizaciones
- **Lucide React 0.344**: Iconos

## 📊 Características de Visualización

### Gráficas en Tiempo Real
- Temperatura y humedad (últimas 20 lecturas)
- Tendencia de gases (NH₃, TMA, Etileno)
- Validación biológica: NH₃ vs Temperatura
- Líneas de referencia para umbrales críticos

### Indicadores
- Estados binarios (LED-style): LDR, IMU, Hall Effect
- Métricas numéricas con estados de color
- Barras de progreso para rangos
- Badges de severidad
- Indicador de conexión en tiempo real

### Dark Mode Industrial
- Paleta de colores oscuros optimizada
- Acentos industriales (azul/cyan)
- Colores semánticos: success (verde), warning (amarillo), danger (rojo)
- Animaciones sutiles (pulse, transitions)

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo (puerto 3000)

# Producción
npm run build        # Genera build optimizado en /dist
npm run preview      # Vista previa del build de producción

# Linting
npm run lint         # Ejecuta ESLint
```

## 📱 Compatibilidad

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Responsive: Desktop, Tablet, Mobile
- ✅ WebSocket support requerido

## 🤝 Integración con Arduino/ESP32

### Código Arduino (ejemplo básico):

```cpp
#include <LoRaWan.h>
#include <pb_encode.h>
#include "sensordata.pb.h"

void setup() {
  // Inicializar LoRaWAN
  // Inicializar sensores
}

void loop() {
  // Leer sensores
  SensorData data = readAllSensors();
  
  // Codificar con Protobuf
  uint8_t buffer[256];
  pb_ostream_t stream = pb_ostream_from_buffer(buffer, sizeof(buffer));
  pb_encode(&stream, SensorData_fields, &data);
  
  // Enviar vía LoRaWAN
  LoRaWAN.send(buffer, stream.bytes_written);
  
  delay(300000); // 5 minutos
}
```

### Gateway LoRaWAN → MQTT:

El gateway debe:
1. Recibir paquetes LoRaWAN
2. Reenviarlos al broker MQTT en el topic: `food/transport/sensors/{device_id}`
3. Mantener el formato Protocol Buffers (sin decodificar)

## 🐛 Troubleshooting

### No se conecta al broker MQTT:
- Verificar URL del broker (debe empezar con `ws://` o `wss://`)
- Verificar que el broker soporte WebSockets
- Revisar firewall/CORS si es broker local

### No llegan datos:
- Verificar que el device esté publicando en el topic correcto
- Usar el simulador para descartar problemas de red
- Revisar consola del navegador para errores de decodificación

### Errores de Protobuf:
- Verificar que el schema del dispositivo coincida con `sensordata.proto`
- Verificar que los datos estén correctamente codificados

### Performance:
- Limitar historial a últimas 100 lecturas (ya implementado)
- Ajustar intervalo de actualización en el dispositivo
- Considerar agregación de datos en el gateway

## 📄 Licencia

Este proyecto es de código abierto para fines educativos y de desarrollo.

## 👨‍💻 Autor

Desarrollado como sistema de monitoreo IoT para transporte de alimentos.

---

**Nota**: Este es un sistema de monitoreo. Para aplicaciones críticas de seguridad alimentaria, se recomienda implementar redundancia y sistemas de respaldo adicionales.
# Invent
