# 🪟 Instrucciones para Windows

## 📋 Requisitos Previos

Antes de ejecutar los scripts, asegúrate de tener instalado:

1. **Node.js** (v20 o superior)
   - Descargar de: https://nodejs.org/
   - Verificar: `node --version`

2. **MySQL** (v8.0 o superior)
   - Descargar de: https://dev.mysql.com/downloads/mysql/
   - O instalar con Chocolatey: `choco install mysql`
   - Verificar: `mysql --version`

3. **Git** (opcional, para clonar repositorio)
   - Descargar de: https://git-scm.com/download/win

## 🚀 Inicio Rápido

### Opción 1: Doble Clic (Recomendado)
1. Abre el Explorador de Archivos
2. Navega a la carpeta del proyecto
3. Doble clic en `EJECUTAR_TODO.bat`
4. Espera a que se abra el navegador en http://localhost:3002

### Opción 2: Línea de Comandos
```cmd
cd C:\ruta\a\tu\proyecto\invent
EJECUTAR_TODO.bat
```

## 🛑 Detener el Sistema

### Opción 1: Doble Clic
- Doble clic en `DETENER_TODO.bat`

### Opción 2: Línea de Comandos
```cmd
DETENER_TODO.bat
```

### Opción 3: Manual (si los scripts fallan)
```cmd
REM Detener todos los procesos Node.js
taskkill /F /IM node.exe

REM Liberar puertos
for /f "tokens=5" %a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %a
for /f "tokens=5" %a in ('netstat -aon ^| findstr :3002') do taskkill /F /PID %a
```

## 📝 Primera Configuración

### 1. Instalar Dependencias

**Backend:**
```cmd
cd backend
npm install
```

**Frontend:**
```cmd
cd ..
npm install
```

### 2. Configurar MySQL

Crea la base de datos y usuario:

```cmd
mysql -u root -p
```

Dentro de MySQL:
```sql
CREATE DATABASE food_transport;
CREATE USER 'foodapp'@'localhost' IDENTIFIED BY 'foodapp123';
GRANT ALL PRIVILEGES ON food_transport.* TO 'foodapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Inicializar Base de Datos

```cmd
cd backend\scripts
node init-db.js
```

## 🔐 Credenciales de Acceso

Después de ejecutar `EJECUTAR_TODO.bat`:

- **URL**: http://localhost:3002
- **Email**: admin@foodtransport.com
- **Password**: admin123

## 📊 Estructura de Archivos Windows

```
invent/
├── EJECUTAR_TODO.bat      ← Script para iniciar todo
├── DETENER_TODO.bat       ← Script para detener todo
├── README_WINDOWS.md      ← Este archivo
├── backend/
│   ├── server.js          ← API Backend (puerto 3001)
│   ├── simulator.js       ← Simulador de datos
│   └── scripts/
│       └── init-db.js     ← Inicialización de BD
└── src/
    └── ...                ← Frontend React
```

## 🐛 Solución de Problemas

### Error: "node no se reconoce como comando"
- **Solución**: Reinstala Node.js desde https://nodejs.org/ y reinicia tu terminal

### Error: "mysql no se reconoce como comando"
- **Solución**: Agrega MySQL al PATH de Windows
  1. Panel de Control → Sistema → Configuración avanzada
  2. Variables de entorno
  3. Editar PATH y agregar: `C:\Program Files\MySQL\MySQL Server 8.0\bin`

### Error: "Puerto 3001 o 3002 en uso"
- **Solución 1**: Ejecutar `DETENER_TODO.bat`
- **Solución 2**: Reiniciar Windows

### Error: "Cannot find module"
- **Solución**: Reinstalar dependencias
  ```cmd
  cd backend
  rmdir /s /q node_modules
  npm install
  
  cd ..
  rmdir /s /q node_modules
  npm install
  ```

### Frontend no abre en el navegador
- **Solución**: Abre manualmente http://localhost:3002 en tu navegador

### No se ven datos en el sistema
- **Verificación 1**: El simulador funciona cada 30 segundos automáticamente
- **Verificación 2**: Ya hay datos de ejemplo en la BD
- **Verificación 3**: Verifica logs:
  ```cmd
  type backend\server.log
  type backend\simulator.log
  type frontend.log
  ```

## 📡 Características del Sistema

### 🔹 Backend (Puerto 3001)
- API REST para gestión de datos
- WebSocket para comunicación con ESP32
- Simulador de datos de sensores cada 30 segundos
- Almacenamiento en MySQL

### 🔹 Frontend (Puerto 3002)
- Panel de administración
- Tracking de clientes
- Monitoreo IoT en tiempo real
- Visualización de datos de sensores
- Sistema de actualizaciones de ubicación

### 🔹 Base de Datos (MySQL)
- Lecturas de sensores IoT
- Usuarios y autenticación
- Envíos y tracking
- Actualizaciones de ubicación

## 📊 Datos del Simulador

El simulador genera datos optimizados para **transporte de mariscos**:

| Sensor | Rango | Unidad | Frecuencia |
|--------|-------|--------|------------|
| **Temperatura** | 0-2°C | °C | 30 segundos |
| **Humedad** | 85-95% | % | 30 segundos |
| **Etileno** | 0-5 ppm | ppm | 30 segundos |

## 🌐 Funcionalidades Principales

### Para Administradores:
1. **Panel de Admin**: Gestión de envíos
2. **Enviar Actualizaciones**: Botón "📍 Actualizar" para informar ubicación/estado a clientes
3. **Monitoreo IoT**: Visualización en tiempo real de sensores
4. **Datos IoT**: Tabla detallada con todas las lecturas

### Para Clientes:
1. **Tracking**: Seguimiento de sus envíos
2. **Ver Actualizaciones**: Botón para ver mensajes del administrador
3. **Estado de Sensores**: Visualización de temperatura, humedad, etileno

## 🔧 Comandos Útiles

### Ver Procesos Activos
```cmd
REM Ver procesos Node.js
tasklist | findstr node.exe

REM Ver qué ocupa el puerto 3001
netstat -ano | findstr :3001

REM Ver qué ocupa el puerto 3002
netstat -ano | findstr :3002
```

### Ver Logs en Tiempo Real
```cmd
REM Backend
powershell Get-Content backend\server.log -Wait -Tail 20

REM Simulador
powershell Get-Content backend\simulator.log -Wait -Tail 20

REM Frontend
powershell Get-Content frontend.log -Wait -Tail 20
```

### Verificar Datos en MySQL
```cmd
mysql -u foodapp -pfoodapp123 food_transport -e "SELECT COUNT(*) as lecturas FROM iot_sensor_readings"

mysql -u foodapp -pfoodapp123 food_transport -e "SELECT * FROM iot_sensor_readings ORDER BY recorded_at DESC LIMIT 5"
```

## 🎯 Flujo de Trabajo Típico

1. **Ejecutar** `EJECUTAR_TODO.bat`
2. **Esperar** 10-15 segundos hasta ver "Sistema completo iniciado"
3. **Abrir navegador** en http://localhost:3002
4. **Login** con admin@foodtransport.com / admin123
5. **Ver datos** en "Monitoreo IoT" o "Datos IoT"
6. **Enviar actualización** desde "Panel de Admin" → Clic "📍 Actualizar"
7. **Detener** con `DETENER_TODO.bat` cuando termines

## 📞 Soporte

Si tienes problemas:
1. Revisa la sección "Solución de Problemas" arriba
2. Verifica los logs en `backend\server.log`, `backend\simulator.log`, `frontend.log`
3. Asegúrate de que MySQL está corriendo: `sc query MySQL80`
4. Verifica que los puertos 3001 y 3002 estén libres

## 🔄 Actualizar el Proyecto

```cmd
git pull origin main
cd backend
npm install
cd ..
npm install
```

## 🚀 Productividad

### Crear Acceso Directo en el Escritorio

1. Clic derecho en `EJECUTAR_TODO.bat`
2. Enviar a → Escritorio (crear acceso directo)
3. Renombrar a "🚀 Iniciar Sistema IoT"

### Auto-inicio con Windows (Opcional)

1. Presiona `Win + R`
2. Escribe `shell:startup` y presiona Enter
3. Copia el acceso directo de `EJECUTAR_TODO.bat` aquí

**Nota**: No recomendado si usas la computadora para otros proyectos.

---

**Sistema**: Monitoreo IoT para Transporte de Alimentos  
**Versión**: 2.0  
**SO Compatible**: Windows 10/11  
**Arquitectura**: Offline-First (funciona sin internet)
