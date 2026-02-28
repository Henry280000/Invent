# Sistema IoT - Clasificación Automática de Datos

## ✅ Sistema Implementado

El backend ahora recibe datos MQTT automáticamente, los clasifica y almacena en la base de datos.

### Componentes instalados:

1. **MQTT Broker (Mosquitto)** - Puerto 1883
2. **Backend con Cliente MQTT** - Recibe y clasifica datos
3. **Base de datos IoT separada** - Tablas específicas para datos de sensores
4. **Clasificación automática** - Por tipo de sensor y severidad

---

## 🚀 Cómo usar

### 1. Iniciar contenedores:
```bash
./start.sh
```

Esto inicia:
- Mosquitto (MQTT Broker)
- MySQL (Base de datos)
- Backend (API + Cliente MQTT)

### 2. Inicializar DB:
```bash
cd backend && npm run init-db
```

### 3. Iniciar frontend:
```bash
npm run dev
```

---

## 📡 Cómo funciona

1. **Sensores publican datos** → `iot/sensors/{tipo}/{dispositivo}`
2. **Backend recibe mensaje** → Servicio MQTT escucha todos los tópicos
3. **Guarda en `iot_sensor_readings`** → Datos brutos
4. **Clasifica automáticamente** → Guarda en `sensor_classifications`
5. **Crea alertas si es crítico** → Tabla `alerts`

### Ejemplo de flujo:

```
Sensor → MQTT Broker → Backend → Clasificación → Base de Datos
                                    ↓
                               Alerta (si crítico)
```

---

## 🗄️ Estructura de la Base de Datos

### Tablas IoT (nuevas):

**`iot_sensor_readings`**: Almacena todos los datos brutos que llegan vía MQTT
- `id`, `device_id`, `truck_id`, `sensor_type`
- `sensor_value`, `unit`, `location_lat`, `location_lng`
- `raw_payload` (JSON completo), `mqtt_topic`, `recorded_at`

**`sensor_classifications`**: Clasificación automática de cada lectura
- `id`, `reading_id` (FK a iot_sensor_readings)
- `classification`, `category`, `severity`
- `threshold_min`, `threshold_max`, `notes`

### Categorías automáticas:
- `temperature` - Temperatura
- `humidity` - Humedad
- `pressure` - Presión atmosférica
- `gas` - Gases (NH3, TMA, Ethylene)
- `motion` - Movimiento
- `light` - Luz
- `location` - Ubicación GPS
- `other` - Otros sensores

### Severidades:
- `normal` - Valor dentro del rango
- `warning` - Valor fuera del rango, pero no crítico
- `critical` - Valor peligroso, se crea alerta automática

---

## 📊 API Endpoints IoT

### 1. Obtener lecturas:
```bash
GET /api/iot/readings?limit=100&sensorType=temperature&truckId=TRUCK-001
```

### 2. Obtener clasificaciones:
```bash
GET /api/iot/classifications?category=temperature&severity=critical
```

### 3. Estadísticas:
```bash
GET /api/iot/stats
```
Retorna:
- Clasificaciones de última hora por categoría y severidad
- Total de dispositivos, lecturas y camiones

### 4. Datos por categoría:
```bash
GET /api/iot/by-category/temperature?limit=50
```
Categorías disponibles: `temperature`, `humidity`, `pressure`, `gas`, `motion`, `light`, `location`

### 5. Publicar mensaje (para testing):
```bash
POST /api/iot/publish
{
  "topic": "iot/sensors/temperature/sensor_001",
  "message": {
    "deviceId": "sensor_001",
    "truckId": "TRUCK-001",
    "sensorType": "temperature",
    "value": 8.5,
    "unit": "°C"
  }
}
```

---

## 🧪 Probar el sistema

### Usando mosquitto_pub:

```bash
# Temperatura alta (crítico)
mosquitto_pub -h localhost -t "iot/sensors/temperature/sensor_001" -m '{
  "deviceId": "sensor_001",
  "truckId": "TRUCK-001",
  "sensorType": "temperature",
  "value": 12.0,
  "unit": "°C"
}'

# Humedad baja (warning)
mosquitto_pub -h localhost -t "iot/sensors/humidity/sensor_002" -m '{
  "deviceId": "sensor_002",
  "truckId": "TRUCK-002",
  "sensorType": "humidity",
  "value": 25,
  "unit": "%"
}'

# NH3 alto (crítico)
mosquitto_pub -h localhost -t "iot/sensors/gas/sensor_003" -m '{
  "deviceId": "sensor_003",
  "sensorType": "nh3",
  "value": 60,
  "unit": "ppm"
}'
```

### Ver los resultados:

```bash
# Entrar a MySQL
docker exec -it food_transport_mysql mysql -ufoodapp -pfoodapp123 food_transport

# Ver lecturas
SELECT * FROM iot_sensor_readings ORDER BY recorded_at DESC LIMIT 10;

# Ver clasificaciones
SELECT * FROM sensor_classifications ORDER BY created_at DESC LIMIT 10;

# Ver alertas generadas
SELECT * FROM alerts WHERE category IN ('temperature', 'humidity', 'gas') 
ORDER BY created_at DESC LIMIT 10;
```

---

## 🎯 Umbrales de Clasificación

El sistema usa estos umbrales para clasificar automáticamente:

### Temperatura (°C):
- **Normal**: 0 a 4°C
- **Warning**: < 0 o > 4°C
- **Critical**: < -5 o > 8°C

### Humedad (%):
- **Normal**: 30 a 70%
- **Warning**: < 30 o > 70%
- **Critical**: < 20 o > 80%

### Presión (hPa):
- **Normal**: 1000 a 1020 hPa
- **Warning**: < 1000 o > 1020 hPa
- **Critical**: < 980 o > 1040 hPa

### NH3 (ppm):
- **Normal**: < 25 ppm
- **Warning**: 25-50 ppm
- **Critical**: > 50 ppm

### TMA (ppm):
- **Normal**: < 10 ppm
- **Warning**: 10-20 ppm
- **Critical**: > 20 ppm

### Ethylene (ppm):
- **Normal**: < 100 ppm
- **Warning**: 100-200 ppm
- **Critical**: > 200 ppm

---

## 🔍 Monitoreo en tiempo real

### Ver logs del backend:
```bash
docker-compose logs -f backend
```

Verás logs como:
```
📨 Mensaje recibido en iot/sensors/temperature/sensor_001: {...}
💾 Dato guardado con ID: 123
🏷️  Clasificado: temperature_critical (critical)
🚨 Alerta creada: ⚠️ Valor crítico detectado: temperature = 12.0 °C
```

---

## 🛑 Comandos útiles

```bash
# Detener todo
docker-compose down

# Reiniciar backend
docker-compose restart backend

# Ver estado
docker-compose ps

# Ver logs específicos
docker-compose logs -f mosquitto
docker-compose logs -f backend
docker-compose logs -f mysql
```

---

## ✨ Ventajas del sistema

1. **Automático**: No necesitas programar nada, solo enviar datos MQTT
2. **Clasificación inteligente**: Se clasifica por tipo y severidad automáticamente
3. **Alertas automáticas**: Se crean alertas para valores críticos
4. **Base de datos separada**: Los datos IoT no interfieren con la operativa normal
5. **Fácil acceso**: API REST para consultar datos clasificados
6. **Persistente**: Los contenedores mantienen los datos aunque se reinicien

---

**El sistema está listo para recibir y clasificar datos IoT en tiempo real** 🚀
