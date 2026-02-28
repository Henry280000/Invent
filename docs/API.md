# 📊 API Documentation - Food Transport Dashboard

## Base URL
```
http://localhost:3001/api
```

## Authentication

Todos los endpoints (excepto `/auth/register` y `/auth/login`) requieren autenticación mediante JWT en el header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
Registrar un nuevo usuario.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "role": "client",  // "client" o "admin"
  "company": "Mi Empresa S.A."
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Juan Pérez",
    "role": "client",
    "company": "Mi Empresa S.A.",
    "createdAt": "2026-02-28T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login
Iniciar sesión.

**Request Body:**
```json
{
  "email": "admin@foodtransport.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "admin@foodtransport.com",
    "name": "Administrador Principal",
    "role": "admin",
    "company": "Food Transport Inc.",
    "createdAt": "2026-02-28T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/me
Obtener usuario actual.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "admin@foodtransport.com",
    "name": "Administrador Principal",
    "role": "admin",
    "company": "Food Transport Inc.",
    "created_at": "2026-02-28T10:00:00.000Z"
  }
}
```

---

## 📦 Shipments Endpoints

### GET /shipments
Obtener lista de envíos.
- Si es **admin**: devuelve todos los envíos
- Si es **client**: devuelve solo los envíos del cliente

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**
```json
{
  "shipments": [
    {
      "id": 1,
      "client_id": 2,
      "client_email": "cliente@empresa.com",
      "client_name": "Cliente Demo",
      "client_company": "Empresa Demo S.A.",
      "truck_id": "TRUCK-001",
      "origin": "Ciudad de México",
      "destination": "Monterrey",
      "product": "Carne refrigerada",
      "estimated_arrival": "2026-02-28T18:00:00.000Z",
      "status": "en_ruta",
      "current_lat": 19.4326,
      "current_lng": -99.1332,
      "created_by": 1,
      "created_at": "2026-02-28T10:00:00.000Z",
      "updated_at": "2026-02-28T10:00:00.000Z",
      "last_temperature": -1.5,
      "last_humidity": 87.3,
      "last_sensor_update": "2026-02-28T12:00:00.000Z"
    }
  ]
}
```

### GET /shipments/:id
Obtener un envío específico.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**
```json
{
  "shipment": {
    "id": 1,
    "client_id": 2,
    "client_email": "cliente@empresa.com",
    "client_name": "Cliente Demo",
    "client_company": "Empresa Demo S.A.",
    "truck_id": "TRUCK-001",
    "origin": "Ciudad de México",
    "destination": "Monterrey",
    "product": "Carne refrigerada",
    "estimated_arrival": "2026-02-28T18:00:00.000Z",
    "status": "en_ruta",
    "current_lat": 19.4326,
    "current_lng": -99.1332,
    "created_by": 1,
    "created_at": "2026-02-28T10:00:00.000Z",
    "updated_at": "2026-02-28T10:00:00.000Z"
  }
}
```

### POST /shipments
Crear un nuevo envío (solo admin).

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "clientEmail": "cliente@empresa.com",
  "truckId": "TRUCK-001",
  "origin": "Ciudad de México",
  "destination": "Monterrey",
  "product": "Carne refrigerada",
  "estimatedArrival": "2026-02-28T18:00:00"
}
```

**Response (201 Created):**
```json
{
  "shipment": {
    "id": 3,
    "client_id": 2,
    "client_email": "cliente@empresa.com",
    "client_name": "Cliente Demo",
    "truck_id": "TRUCK-001",
    "origin": "Ciudad de México",
    "destination": "Monterrey",
    "product": "Carne refrigerada",
    "estimated_arrival": "2026-02-28T18:00:00.000Z",
    "status": "en_ruta",
    "current_lat": 19.4326,
    "current_lng": -99.1332,
    "created_by": 1,
    "created_at": "2026-02-28T12:30:00.000Z",
    "updated_at": "2026-02-28T12:30:00.000Z"
  }
}
```

### PATCH /shipments/:id
Actualizar un envío (solo admin).

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "status": "entregado",
  "currentLat": 25.6866,
  "currentLng": -100.3161
}
```

**Response (200 OK):**
```json
{
  "shipment": {
    "id": 1,
    "status": "entregado",
    "current_lat": 25.6866,
    "current_lng": -100.3161,
    ...
  }
}
```

### DELETE /shipments/:id
Eliminar un envío (solo admin).

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Envío eliminado correctamente"
}
```

---

## 📊 Sensor Data Endpoints

### POST /sensor-data/:shipmentId
Agregar datos de sensores a un envío.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "temperature": -1.5,
  "humidity": 87.3,
  "pressure": 1013.25,
  "nh3_level": 0.5,
  "tma_level": 0.3,
  "ethylene_level": 0.2,
  "light_detected": false,
  "movement_detected": false,
  "coupling_status": true
}
```

**Response (201 Created):**
```json
{
  "id": 123,
  "message": "Datos guardados"
}
```

### GET /sensor-data/:shipmentId
Obtener histórico de datos de sensores.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters:**
- `limit` (opcional): Número máximo de registros (default: 100)

**Example:**
```
GET /api/sensor-data/1?limit=50
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 123,
      "shipment_id": 1,
      "temperature": -1.5,
      "humidity": 87.3,
      "pressure": 1013.25,
      "nh3_level": 0.5,
      "tma_level": 0.3,
      "ethylene_level": 0.2,
      "light_detected": false,
      "movement_detected": false,
      "coupling_status": true,
      "recorded_at": "2026-02-28T12:00:00.000Z"
    }
  ]
}
```

---

## 👥 Users Endpoints

### GET /users
Listar todos los usuarios (solo admin).

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@foodtransport.com",
      "name": "Administrador Principal",
      "role": "admin",
      "company": "Food Transport Inc.",
      "created_at": "2026-02-28T10:00:00.000Z"
    },
    {
      "id": 2,
      "email": "cliente@empresa.com",
      "name": "Cliente Demo",
      "role": "client",
      "company": "Empresa Demo S.A.",
      "created_at": "2026-02-28T10:05:00.000Z"
    }
  ]
}
```

### GET /users/clients
Listar solo clientes (solo admin, útil para crear envíos).

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response (200 OK):**
```json
{
  "clients": [
    {
      "id": 2,
      "email": "cliente@empresa.com",
      "name": "Cliente Demo",
      "company": "Empresa Demo S.A."
    }
  ]
}
```

---

## 🏥 Health Check

### GET /health
Verificar estado del servidor y base de datos.

**No requiere autenticación**

**Response (200 OK):**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "error": "Todos los campos son requeridos"
}
```

### 401 Unauthorized
```json
{
  "error": "Token no proporcionado"
}
```

### 403 Forbidden
```json
{
  "error": "Token inválido"
}
```

### 404 Not Found
```json
{
  "error": "Envío no encontrado"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error al procesar la solicitud"
}
```

---

## 📝 Examples with curl

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foodtransport.com","password":"admin123"}'
```

### Get Shipments
```bash
curl http://localhost:3001/api/shipments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Shipment
```bash
curl -X POST http://localhost:3001/api/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "clientEmail":"cliente@empresa.com",
    "truckId":"TRUCK-003",
    "origin":"Guadalajara",
    "destination":"Cancún",
    "product":"Mariscos frescos",
    "estimatedArrival":"2026-02-29T14:00:00"
  }'
```

### Update Shipment Status
```bash
curl -X PATCH http://localhost:3001/api/shipments/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"status":"entregado"}'
```

---

## 🔒 Security Notes

- Todos los passwords están hasheados con bcrypt (10 rounds)
- Los tokens JWT expiran en 7 días
- Las rutas de admin están protegidas con middleware `requireAdmin`
- Los clientes solo pueden ver sus propios envíos
- Validación de entrada en todos los endpoints
