# 🚚 Sistema IoT de Monitoreo para Transporte de Alimentos

Sistema completo de monitoreo en tiempo real para transporte refrigerado de mariscos con sensores IoT, base de datos MySQL y panel web.

---

## 🚀 Inicio Rápido

### macOS / Linux
```bash
./EJECUTAR_TODO.sh
```

Abre tu navegador en: **http://localhost:3002**  
Usuario: `admin@foodtransport.com`  
Password: `admin123`

### Windows
```cmd
EJECUTAR_TODO.bat
```

Abre tu navegador en: **http://localhost:3002**  
Usuario: `admin@foodtransport.com`  
Password: `admin123`

---

## 🛑 Detener el Sistema

### macOS / Linux
```bash
./DETENER_TODO.sh
```

### Windows
```cmd
DETENER_TODO.bat
```

---

## ⚙️ Requisitos Previos

### Todos los Sistemas Operativos
- **Node.js** v20 o superior → [Descargar](https://nodejs.org/)
- **MySQL** v8.0 o superior → [Descargar](https://dev.mysql.com/downloads/mysql/)

### Instalación de Dependencias
```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

### Configuración de MySQL

**1. Crear base de datos y usuario:**
```bash
mysql -u root -p
```

**2. Ejecutar estos comandos SQL:**
```sql
CREATE DATABASE food_transport;
CREATE USER 'foodapp'@'localhost' IDENTIFIED BY 'foodapp123';
GRANT ALL PRIVILEGES ON food_transport.* TO 'foodapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**3. Inicializar tablas:**
```bash
cd backend/scripts
node init-db.js
```

---

## 📖 Documentación por Sistema Operativo

- **Windows**: Ver [README_WINDOWS.md](README_WINDOWS.md) para instrucciones detalladas
- **macOS/Linux**: Usa los scripts `.sh` incluidos

---

## 🎯 Características del Sistema

### Para Administradores
- ✅ **Panel de Control**: Gestión completa de envíos
- ✅ **Enviar Actualizaciones**: Comunicación directa con clientes sobre ubicación/estado
- ✅ **Monitoreo IoT**: Visualización en tiempo real de sensores
- ✅ **Datos Históricos**: Tabla detallada con todas las lecturas

### Para Clientes
- ✅ **Tracking de Envíos**: Seguimiento de sus pedidos
- ✅ **Actualizaciones en Tiempo Real**: Mensajes del administrador
- ✅ **Estado de Sensores**: Temperatura, humedad, etileno

### Sensores Monitoreados
| Sensor | Rango Óptimo | Frecuencia |
|--------|--------------|------------|
| **Temperatura** | 0-2°C | 30 segundos |
| **Humedad** | 85-95% | 30 segundos |
| **Etileno** | 0-5 ppm | 30 segundos |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐
│  ESP32 Gateway  │  ← WiFi AP: "ESP32-Gateway-Hieleras"
│  (192.168.4.1)  │     Password: hieleras2026
└────────┬────────┘
         │ WebSocket/WiFi
┌────────▼────────┐
│  Backend API    │  ← Node.js + Express (puerto 3001)
│  + Simulator    │     MySQL 9.4
└────────┬────────┘
         │ REST API
┌────────▼────────┐
│  Frontend Web   │  ← React + Vite (puerto 3002)
│  (Dashboard)    │     TailwindCSS
└─────────────────┘
```

**Modo Offline**: El sistema funciona 100% sin internet, solo requiere la red local del Gateway ESP32.

---

## 📊 Puertos del Sistema

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 3002 | http://localhost:3002 |
| Backend API | 3001 | http://localhost:3001 |
| MySQL | 3306 | localhost:3306 |

---

## 🔧 Comandos Útiles

### Ver Logs en Tiempo Real
```bash
# macOS/Linux
tail -f backend/server.log
tail -f backend/simulator.log

# Windows (PowerShell)
Get-Content backend\server.log -Wait -Tail 20
```

### Verificar Procesos
```bash
# macOS/Linux
ps aux | grep node

# Windows
tasklist | findstr node.exe
```

### Verificar Datos en MySQL
```bash
mysql -u foodapp -pfoodapp123 food_transport -e "SELECT * FROM iot_sensor_readings ORDER BY recorded_at DESC LIMIT 5;"
```

---

## 🐛 Solución de Problemas

### Backend no inicia
```bash
# Verificar que MySQL esté corriendo
# macOS: brew services list
# Windows: sc query MySQL80

# Verificar credenciales en backend/.env
DB_USER=foodapp
DB_PASSWORD=foodapp123
DB_NAME=food_transport
```

### Frontend no carga
```bash
# Liberar puerto 3002
# macOS/Linux
lsof -ti:3002 | xargs kill -9

# Windows
for /f "tokens=5" %a in ('netstat -aon ^| findstr :3002') do taskkill /F /PID %a
```

### No se ven datos
- El simulador genera datos cada 30 segundos automáticamente
- Ya hay datos de prueba en la base de datos
- Verifica `backend/simulator.log` para ver el estado

---

## 📁 Estructura del Proyecto

```
invent/
├── EJECUTAR_TODO.sh           # Script inicio macOS/Linux
├── DETENER_TODO.sh            # Script detener macOS/Linux
├── EJECUTAR_TODO.bat          # Script inicio Windows
├── DETENER_TODO.bat           # Script detener Windows
├── README.md                  # Este archivo
├── README_WINDOWS.md          # Guía detallada Windows
├── backend/
│   ├── server.js              # API REST + endpoints
│   ├── simulator.js           # Generador de datos IoT
│   └── scripts/
│       └── init-db.js         # Inicialización de BD
├── src/
│   ├── components/
│   │   ├── admin/             # Panel administrador
│   │   ├── client/            # Tracking clientes
│   │   ├── dashboard/         # Monitoreo IoT
│   │   └── iot/               # Visualización datos
│   └── services/
│       └── apiService.js      # Cliente API
└── hardware/
    └── esp32-gateway/         # Código Arduino Gateway
```

---

## 🌐 Tecnologías

- **Backend**: Node.js 20, Express, WebSocket
- **Frontend**: React 18, Vite, TailwindCSS
- **Base de Datos**: MySQL 9.4
- **Hardware**: ESP32 DevKit v1 (Arduino Core 3.3.7)
- **Comunicación**: REST API, WebSocket, ESP-NOW

---

## 📝 Licencia

MIT License - Uso libre para proyectos educativos y comerciales

---

## 🤝 Soporte

¿Problemas o preguntas? Revisa:
1. [README_WINDOWS.md](README_WINDOWS.md) para Windows
2. Los logs en `backend/server.log` y `backend/simulator.log`
3. Verifica que MySQL esté corriendo
4. Confirma que los puertos 3001 y 3002 estén libres

---

## 📁 Estructura del Proyecto

```
├── backend/
│   ├── server.js                    # Backend Express
│   ├── services/
│   │   ├── esp32GatewayClient.js   # Cliente WebSocket para Gateway
│   │   ├── esp32WebSocketService.js # Servidor WebSocket para web
│   │   └── mqttService.js          # Servicio MQTT (opcional)
│   └── scripts/
│       └── setup-mysql-local.sh    # Setup MySQL local
├── hardware/
│   ├── esp32-gateway/
│   │   └── esp32-gateway.ino       # Gateway ESP-NOW → WebSocket
│   ├── esp32-nodo-test-boton/
│   │   └── esp32-nodo-test-boton.ino # Nodo de prueba con botón
│   └── esp32-nodo-hielera/
│       └── esp32-nodo-hielera.ino  # Nodo con sensores reales
├── src/                             # Frontend React
│   ├── components/
│   ├── services/
│   └── App.jsx
├── database/
│   └── schema.sql                   # Schema MySQL
└── AHORA.md                         # Guía rápida de testing
```

---

## 🔧 Configuración

### Backend (.env)
```env
DB_HOST=localhost
DB_USER=foodapp
DB_PASSWORD=foodapp123
DB_NAME=food_transport
GATEWAY_HOST=192.168.4.1
GATEWAY_PORT=81
MQTT_ENABLED=false
```

### ESP32 Gateway
```cpp
// WiFi Access Point
const char* ssid = "ESP32-Gateway-Hieleras";
const char* password = "hieleras2026";
// IP fija: 192.168.4.1
// WebSocket puerto: 81
```

### ESP32 Nodo
```cpp
// MAC del Gateway (obtener del Serial Monitor del Gateway)
uint8_t gatewayAddress[] = {0xE0, 0x8C, 0xFE, 0x32, 0x9E, 0xCD};
```

---

## 🐛 Troubleshooting

**Backend no conecta al Gateway:**
- Verificar WiFi conectado a `ESP32-Gateway-Hieleras`
- `ping 192.168.4.1` debe responder
- Ver logs: `tail -f backend/backend.log`

**ESP32 Nodo no envía datos:**
- Verificar MAC del Gateway en Serial Monitor
- LED debe parpadear 3x al enviar (5x = error)
- Verificar botón conectado correctamente

**Datos no llegan a MySQL:**
- Verificar backend conectado: `ps aux | grep server.js`
- Verificar MySQL corriendo: `brew services list | grep mysql`
- Ver errores: `tail -50 backend/backend.log`

---

## 📝 Documentación

- **AHORA.md**: Guía rápida para testing
- **docs/API.md**: Documentación de API REST
- **hardware/README.md**: Hardware y conexiones

---

## 🎓 Stack Tecnológico

- **Hardware**: ESP32 (Arduino Core 3.3.7)
- **Protocolo**: ESP-NOW, WebSocket, REST API
- **Backend**: Node.js 20+, Express, MySQL 9.4
- **Frontend**: React 18, Vite, TailwindCSS
- **Librerías ESP32**: WiFi, ESP-NOW, WebSocketsServer, ArduinoJson

---

## 📄 Licencia

MIT
