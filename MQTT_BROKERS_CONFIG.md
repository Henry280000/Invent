# ⚙️ Configuraciones de Brokers MQTT

Ejemplos de configuración para diferentes brokers MQTT populares.

---

## 🌐 Brokers Públicos (Testing)

### 1. EMQX Public Broker (Recomendado para desarrollo)

```javascript
{
  url: 'ws://broker.emqx.io:8083/mqtt',
  username: '',  // No requiere autenticación
  password: '',
  clientId: 'food_dashboard_' + Math.random().toString(16).slice(2, 10)
}
```

**Características:**
- ✅ Gratis
- ✅ Sin registro
- ✅ Estable y rápido
- ⚠️ Público (no para producción)

**Topics sugeridos:**
- `food/transport/sensors/+` (recibir datos)
- `food/transport/commands/DEVICE_001` (enviar comandos)

---

### 2. HiveMQ Public Broker

```javascript
{
  url: 'ws://broker.hivemq.com:8000/mqtt',
  username: '',
  password: '',
  clientId: 'dashboard_' + Date.now()
}
```

**Características:**
- ✅ Gratis
- ✅ WebSocket support
- ⚠️ Máximo 10 clientes por IP

---

### 3. Eclipse Mosquitto Test Server

```javascript
{
  url: 'ws://test.mosquitto.org:8080',
  username: '',
  password: '',
  clientId: 'mqtt_test_' + Date.now()
}
```

**Características:**
- ✅ Mantenido por Eclipse Foundation
- ⚠️ Ocasionalmente sobrecargado

---

## 🔐 Brokers en la Nube (Producción)

### 1. EMQX Cloud (Recomendado)

**Registro:** https://www.emqx.com/en/cloud

```javascript
{
  url: 'wss://your-instance.emqxsl.com:8084/mqtt',
  username: 'your_username',
  password: 'your_password',
  clientId: 'food_dashboard_prod'
}
```

**Planes:**
- Free Tier: 1M mensajes/mes
- Pro: $0.50 por 1M mensajes
- Enterprise: Dedicado

**Características:**
- ✅ SSL/TLS incluido
- ✅ Dashboard de métricas
- ✅ Reglas y webhooks
- ✅ 99.99% uptime SLA

**Configuración:**
1. Crear cuenta en EMQX Cloud
2. Crear deployment
3. Crear credenciales de autenticación
4. Copiar URL de WebSocket
5. Configurar ACL para topics

---

### 2. HiveMQ Cloud

**Registro:** https://console.hivemq.cloud/

```javascript
{
  url: 'wss://your-cluster.s2.eu.hivemq.cloud:8884/mqtt',
  username: 'dashboard_user',
  password: 'secure_password_123',
  clientId: 'food_transport_dashboard'
}
```

**Planes:**
- Free: 100 conexiones, 10GB/mes
- Starter: $49/mes
- Enterprise: Custom

**Características:**
- ✅ Fácil configuración
- ✅ Integración con AWS/Azure
- ✅ Monitoring incluido

---

### 3. AWS IoT Core

**Consola:** https://console.aws.amazon.com/iot/

```javascript
{
  url: 'wss://your-ats-endpoint.iot.us-east-1.amazonaws.com/mqtt',
  username: '', // Usa AWS Cognito o certificados
  password: '',
  clientId: 'food_dashboard',
  // Requiere certificados adicionales:
  protocolId: 'MQIsdp',
  protocolVersion: 3,
  cert: 'certificate.pem.crt',
  key: 'private.pem.key',
  ca: 'root-CA.crt'
}
```

**Nota:** AWS IoT requiere autenticación con certificados X.509 o AWS Cognito. Más complejo pero muy escalable.

**Características:**
- ✅ Escalabilidad ilimitada
- ✅ Integración con AWS Lambda, DynamoDB, etc.
- ✅ Device Shadow (estado persistente)
- ⚠️ Precios por mensaje (puede ser costoso)

---

### 4. Azure IoT Hub

**Portal:** https://portal.azure.com/

```javascript
{
  url: 'wss://your-hub.azure-devices.net:443',
  username: 'your-hub.azure-devices.net/DEVICE_001/?api-version=2021-04-12',
  password: 'SharedAccessSignature sig=...',
  clientId: 'DEVICE_001'
}
```

**Características:**
- ✅ Integración con Azure services
- ✅ Device twins
- ✅ Bi-directional messaging
- ⚠️ Configuración compleja

---

## 🏠 Broker Local (Desarrollo)

### Mosquitto (Docker)

**Instalación rápida:**

```bash
# Descargar configuración
cat > mosquitto.conf << EOF
listener 1883
listener 9001
protocol websockets
allow_anonymous true
EOF

# Iniciar con Docker
docker run -it -p 1883:1883 -p 9001:9001 \
  -v $(pwd)/mosquitto.conf:/mosquitto/config/mosquitto.conf \
  eclipse-mosquitto
```

**Configuración del Dashboard:**

```javascript
{
  url: 'ws://localhost:9001',
  username: '',
  password: '',
  clientId: 'local_dashboard'
}
```

**Ventajas:**
- ✅ Control total
- ✅ Sin límites
- ✅ Sin costo
- ✅ Desarrollo offline

---

## 🔗 The Things Network (LoRaWAN)

**Para integración con LoRaWAN real**

**Registro:** https://www.thethingsnetwork.org/

**1. Configurar aplicación en TTN:**
- Crear aplicación
- Registrar dispositivos
- Agregar decoder para Protobuf

**2. Configurar integración MQTT:**

```javascript
{
  url: 'wss://eu1.cloud.thethings.network:8883',
  username: 'your-app-id@ttn',
  password: 'NNSXS.YOUR.API.KEY',
  clientId: 'food_dashboard_ttn'
}
```

**3. Topics TTN:**
- Uplink: `v3/{app-id}@ttn/devices/{device-id}/up`
- Downlink: `v3/{app-id}@ttn/devices/{device-id}/down/push`

**4. Payload Decoder (JavaScript en TTN Console):**

```javascript
function decodeUplink(input) {
  // input.bytes contiene el payload Protobuf
  // Retornar estructura JSON
  return {
    data: {
      temperature: ...,
      // etc
    }
  };
}
```

---

## ⚙️ Configuración Avanzada

### Con TLS/SSL (Producción)

```javascript
{
  url: 'wss://broker.example.com:8884/mqtt',
  username: 'user',
  password: 'pass',
  clientId: 'dashboard_prod',
  rejectUnauthorized: true,  // Validar certificado
  ca: certificateAuthority,   // CA cert si es custom
}
```

### Con Keep Alive

```javascript
{
  url: 'ws://broker.example.com:8083/mqtt',
  username: 'user',
  password: 'pass',
  clientId: 'dashboard',
  keepalive: 60,              // Segundos
  reconnectPeriod: 5000,      // 5 segundos
  connectTimeout: 30000       // 30 segundos
}
```

### QoS (Quality of Service)

Al suscribirse o publicar:

```javascript
// En mqttService.js
this.client.subscribe('food/transport/sensors/+', { qos: 1 });
//  qos: 0 = At most once (sin confirmación)
//  qos: 1 = At least once (con confirmación)
//  qos: 2 = Exactly once (confirmación doble)
```

---

## 🧪 Testing de Conexión

### Con MQTT.fx (GUI Client)

1. Descargar: https://mqttfx.jensd.de/
2. Configurar broker
3. Conectar
4. Publicar mensaje de prueba en topic

### Con Mosquitto CLI

```bash
# Instalar
brew install mosquitto  # macOS
apt install mosquitto-clients  # Linux

# Suscribirse
mosquitto_sub -h broker.emqx.io -p 1883 -t "food/transport/sensors/+"

# Publicar (JSON)
mosquitto_pub -h broker.emqx.io -p 1883 -t "food/transport/sensors/TEST" \
  -m '{"device_id":"TEST","temperature":5.2}'
```

---

## 🔒 Seguridad - Best Practices

### ✅ Para Producción:
1. **Usar TLS/SSL** (wss://)
2. **Autenticación obligatoria** (usuario/password)
3. **ACL por topic** (restricciones de publicación)
4. **Credenciales únicas** por dispositivo
5. **Rotar passwords** periódicamente
6. **Monitorear conexiones** sospechosas

### ❌ Evitar en Producción:
- Brokers públicos sin autenticación
- ws:// (sin cifrado)
- `allow_anonymous true`
- Passwords en código (usar variables de entorno)

---

## 📊 Comparativa de Brokers

| Broker | Precio | Facilidad | Escalabilidad | TLS | Dashboard |
|--------|--------|-----------|---------------|-----|-----------|
| EMQX Public | Gratis | ⭐⭐⭐⭐⭐ | ⭐⭐ | ✅ | ❌ |
| EMQX Cloud | $0-200/mes | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| HiveMQ Cloud | $49+/mes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ✅ |
| AWS IoT Core | Pay per use | ⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| Mosquitto Local | Gratis | ⭐⭐⭐ | ⭐⭐⭐ | ⚙️ | ❌ |
| The Things Network | Gratis | ⭐⭐⭐ | ⭐⭐⭐ | ✅ | ✅ |

---

## 🎯 Recomendación por Caso de Uso

### 🧪 Testing/Desarrollo
→ **EMQX Public** o **Mosquitto Local**

### 🚀 MVP/Startup
→ **HiveMQ Cloud (Free Tier)** o **EMQX Cloud**

### 🏢 Producción Pequeña/Media
→ **EMQX Cloud (Pro)** o **HiveMQ Cloud (Starter)**

### 🏭 Producción Enterprise
→ **AWS IoT Core** con arquitectura completa

### 📡 Específico LoRaWAN
→ **The Things Network** + gateway dedicado

---

## 📞 Soporte

- **EMQX**: https://www.emqx.io/contact
- **HiveMQ**: https://www.hivemq.com/contact/
- **AWS**: https://aws.amazon.com/contact-us/
- **TTN**: https://www.thethingsnetwork.org/forum/

---

**Última actualización:** Febrero 2026
