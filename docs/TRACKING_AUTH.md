# 📦 Sistema de Tracking y Autenticación

## 🔐 Arquitectura de Autenticación

### AuthContext
El sistema utiliza React Context API para gestionar el estado de autenticación globalmente.

**Ubicación**: `src/contexts/AuthContext.jsx`

**Características**:
- Gestión de sesión con localStorage
- Persistencia de usuario entre recargas de página
- Funciones de login, logout y registro
- Helpers de verificación de rol (isAdmin, isClient)

**API del Hook useAuth()**:
```javascript
const {
  user,           // Objeto del usuario actual (null si no autenticado)
  login,          // (email, password) => Promise<User>
  logout,         // () => void
  register,       // (userData) => Promise<User>
  isAdmin,        // () => boolean
  isClient,       // () => boolean
  loading         // boolean
} = useAuth();
```

### Estructura de Usuario
```javascript
{
  id: string,           // Timestamp único
  email: string,        // Email único
  name: string,         // Nombre completo
  role: 'admin'|'client', // Rol del usuario
  company: string,      // Empresa (opcional)
  createdAt: string     // ISO timestamp
}
```

## 👥 Componentes de Autenticación

### Login (`src/components/auth/Login.jsx`)
- Formulario de inicio de sesión
- Validación de credenciales
- Mensajes de error
- Switch a registro
- Muestra credenciales de prueba

### Register (`src/components/auth/Register.jsx`)
- Formulario de registro completo
- Validación de contraseña
- Verificación de duplicados
- Selección de rol
- Auto-login después de registro

## 📦 Sistema de Tracking

### Estructura de Datos de Envío
```javascript
{
  id: string,                    // Timestamp único
  clientEmail: string,           // Email del cliente propietario
  origin: string,                // Ciudad de origen
  destination: string,           // Ciudad de destino
  product: string,               // Tipo de producto
  estimatedArrival: string,      // ISO datetime
  truckId: string,               // TRUCK-001, TRUCK-002, etc.
  status: string,                // 'en_ruta' | 'detenido' | 'entregado' | 'cancelado'
  createdAt: string,             // ISO timestamp
  createdBy: string,             // Email del admin creador
  currentLocation: {
    lat: number,                 // Latitud GPS
    lng: number                  // Longitud GPS
  },
  sensorData: {
    temperature: number,         // °C (DHT22)
    humidity: number,            // % (DHT22)
    lastUpdate: string           // ISO timestamp
  }
}
```

### AdminPanel (`src/components/admin/AdminPanel.jsx`)

**Características**:
- ✅ Crear nuevos envíos
- ✅ Listar todos los envíos activos
- ✅ Actualizar estado de envíos
- ✅ Eliminar envíos
- ✅ Ver datos de sensores en tiempo real
- ✅ Filtrado por cliente

**Estados de Envío**:
- `en_ruta`: Envío activo en tránsito
- `detenido`: Camión detenido temporalmente
- `entregado`: Entrega completada
- `cancelado`: Envío cancelado

### ClientTracking (`src/components/client/ClientTracking.jsx`)

**Características**:
- ✅ Ver solo envíos propios (filtrado por email)
- ✅ Tracking en tiempo real con actualización automática (cada 5s)
- ✅ Visualización de ruta (origen → destino)
- ✅ Estadísticas de sensores:
  - Temperatura (DHT22)
  - Humedad (DHT22)
  - Tiempo restante (ETA countdown)
  - Estado de monitoreo
- ✅ Ubicación GPS aproximada
- ✅ Última actualización de datos

**Actualización Automática**:
Los datos de sensores se actualizan automáticamente cada 5 segundos para envíos en estado "en_ruta", simulando lecturas en tiempo real.

## 🗺️ Navegación y Rutas

### App.jsx - Router Principal
El componente `App.jsx` maneja la navegación completa:

**Estado no autenticado**:
- Muestra Login o Register

**Estado autenticado** - Pestañas disponibles:

1. **Monitoreo IoT** (todos los usuarios)
   - Dashboard completo de sensores
   - Sistema de alertas
   - Hash-chain viewer
   - Simulador de datos

2. **Panel de Admin** (solo administradores)
   - Gestión de envíos
   - Creación y edición
   - Vista consolidada

3. **Mis Envíos** (solo clientes)
   - Tracking personal
   - Solo envíos propios
   - Vista simplificada

## 🔄 Flujo de Trabajo Completo

### Flujo de Administrador:
```
1. Login con credenciales de admin
2. Navegar a "Panel de Admin"
3. Click "+ Nuevo Envío"
4. Llenar formulario:
   - cliente@empresa.com
   - TRUCK-001
   - CDMX → Monterrey
   - Carne refrigerada
   - Fecha estimada: 2024-XX-XX 14:00
5. Click "Crear Envío"
6. Envío aparece en lista con status "En Ruta"
7. Monitorear datos de sensores
8. Cambiar estado según progreso
9. Marcar como "Entregado" al completar
```

### Flujo de Cliente:
```
1. Login con credenciales de cliente
2. Navegar a "Mis Envíos"
3. Ver listado de envíos propios
4. Monitorear en tiempo real:
   - Temperatura actual
   - Humedad actual
   - Tiempo restante
   - Ubicación GPS
5. Los datos se actualizan automáticamente cada 5s
6. Ver historial cuando estado = "Entregado"
```

## 💾 Persistencia de Datos

### localStorage Keys:
- `users`: Array de usuarios registrados
- `currentUser`: Usuario actualmente autenticado
- `shipments`: Array de todos los envíos

**Nota**: En producción, esto debe reemplazarse con una API backend y base de datos real.

## 🔒 Seguridad

### Consideraciones Actuales:
- ⚠️ Contraseñas almacenadas en texto plano (DEMO)
- ⚠️ Sin tokens JWT (DEMO)
- ⚠️ Sin validación de backend (DEMO)
- ⚠️ localStorage puede ser manipulado (DEMO)

### Recomendaciones para Producción:
- ✅ Implementar backend con API REST
- ✅ Hash de contraseñas (bcrypt)
- ✅ JWT con refresh tokens
- ✅ HTTPS obligatorio
- ✅ Rate limiting
- ✅ Validación server-side
- ✅ Base de datos (PostgreSQL/MongoDB)
- ✅ Sanitización de inputs

## 🧪 Testing

### Cuentas de Prueba Pre-configuradas:

**Admin**:
- Email: admin@foodtransport.com
- Password: admin123

**Cliente**:
- Email: cliente@empresa.com
- Password: cliente123

### Crear Envío de Prueba:
```javascript
// En AdminPanel, crear:
{
  clientEmail: "cliente@empresa.com",
  truckId: "TRUCK-001",
  origin: "CDMX",
  destination: "Monterrey",
  product: "Carne refrigerada",
  estimatedArrival: "2024-12-31T14:00"
}
```

### Verificar como Cliente:
1. Logout del admin
2. Login con cliente@empresa.com / cliente123
3. Ir a "Mis Envíos"
4. Debe aparecer el envío creado por el admin
5. Ver actualización automática de sensores

## 📊 Integración con Sistema IoT

### Conexión con Sensores Reales:
El sistema de tracking se integra con el dashboard IoT:

1. **Sensores DHT22** → Temperatura/Humedad del envío
2. **GPS Module** → Ubicación del camión
3. **MQTT Topics** → `tracking/{truckId}/sensors`

### Ejemplo de Mensaje MQTT para Tracking:
```json
{
  "truckId": "TRUCK-001",
  "timestamp": "2024-01-15T10:30:00Z",
  "location": {
    "lat": 19.4326,
    "lng": -99.1332
  },
  "sensors": {
    "temperature": -1.5,
    "humidity": 87.2
  }
}
```

## 🎨 Estilos y UI

### Badges de Estado:
- **En Ruta**: Azul (badge-blue)
- **Entregado**: Verde (badge-green)
- **Detenido**: Ámbar (badge-amber)
- **Cancelado**: Rojo (badge-red)

### Cards de Información:
- Temperatura: Fondo azul claro
- Humedad: Fondo verde claro
- ETA: Fondo ámbar claro
- Estado: Fondo púrpura claro

## 🚀 Próximas Mejoras

### Features Planeados:
- [ ] Mapa interactivo con Google Maps/Mapbox
- [ ] Gráficas históricas de temperatura por envío
- [ ] Notificaciones push para clientes
- [ ] Exportar reportes PDF
- [ ] API REST completa
- [ ] WebSockets para updates en tiempo real
- [ ] Multi-idioma (i18n)
- [ ] Modo oscuro
- [ ] Aplicación móvil (React Native)

### Mejoras de Backend:
- [ ] Node.js + Express API
- [ ] PostgreSQL con Prisma ORM
- [ ] Redis para caché
- [ ] WebSockets con Socket.io
- [ ] AWS S3 para documentos
- [ ] CI/CD con GitHub Actions
