# 🚀 Guía de Instalación y Configuración con MySQL

## 📋 Requisitos Previos

### Opción 1: Docker (Recomendado)
- Docker Desktop instalado
- docker-compose instalado
- 2GB de espacio libre

### Opción 2: MySQL Local en Mac
- MySQL 8.0+ instalado en macOS
- Acceso root a MySQL
- Node.js 18+ y npm

## 🐳 Instalación con Docker (Automática)

### Paso 1: Instalación Automática

```bash
# Dar permisos de ejecución al script
chmod +x install.sh

# Ejecutar instalación automática
./install.sh
```

Este script hará automáticamente:
- ✅ Verificar Docker
- ✅ Crear archivo .env
- ✅ Instalar dependencias del backend
- ✅ Iniciar MySQL en Docker
- ✅ Crear las tablas de la base de datos
- ✅ Insertar usuarios de prueba

### Paso 2: Iniciar Frontend

```bash
# En la raíz del proyecto
npm run dev
```

### ¡Listo! 🎉
- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **MySQL**: localhost:3306

---

## 🍎 Instalación con MySQL Local en Mac

### Paso 1: Instalar MySQL (si no lo tienes)

```bash
# Usando Homebrew
brew install mysql

# Iniciar MySQL
brew services start mysql

# Configurar seguridad (establecer contraseña root)
mysql_secure_installation
```

### Paso 2: Crear Base de Datos y Usuario

```bash
# Conectarse a MySQL como root
mysql -u root -p

# Dentro de MySQL, ejecutar:
CREATE DATABASE food_transport;
CREATE USER 'foodapp'@'localhost' IDENTIFIED BY 'foodapp123';
GRANT ALL PRIVILEGES ON food_transport.* TO 'foodapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 3: Importar Schema

```bash
# Desde la terminal, importar el schema
mysql -u foodapp -pfoodapp123 food_transport < database/schema.sql
```

### Paso 4: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env (ya debería estar configurado para MySQL local)
# No necesitas cambiar nada si usas los valores por defecto
```

### Paso 5: Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### Paso 6: Inicializar Usuarios de Prueba

```bash
# Dentro de la carpeta backend
npm run init-db
```

Esto creará los usuarios de prueba con contraseñas hasheadas correctamente.

### Paso 7: Iniciar Backend

```bash
# Dentro de la carpeta backend
npm start
# O para desarrollo con hot-reload:
npm run dev
```

### Paso 8: Iniciar Frontend

```bash
# En otra terminal, desde la raíz del proyecto
npm run dev
```

---

## 🔍 Verificar Instalación

### 1. Verificar MySQL

```bash
mysql -u foodapp -pfoodapp123 food_transport -e "SELECT email, role FROM users;"
```

Deberías ver:
```
+---------------------------+--------+
| email                     | role   |
+---------------------------+--------+
| admin@foodtransport.com   | admin  |
| cliente@empresa.com       | client |
+---------------------------+--------+
```

### 2. Verificar Backend

```bash
curl http://localhost:3001/api/health
```

Respuesta esperada:
```json
{"status":"ok","database":"connected"}
```

### 3. Verificar Frontend

Abre el navegador en: http://localhost:3002

---

## 🔑 Credenciales de Prueba

### Administrador
- **Email**: admin@foodtransport.com
- **Password**: admin123

### Cliente
- **Email**: cliente@empresa.com  
- **Password**: cliente123

---

## 🛠️ Comandos Útiles

### Docker

```bash
# Ver logs del backend
docker-compose logs -f backend

# Ver logs de MySQL
docker-compose logs -f mysql

# Detener todos los contenedores
docker-compose down

# Detener y eliminar volúmenes (⚠️ elimina datos)
docker-compose down -v

# Reconstruir contenedores
docker-compose up --build -d
```

### MySQL

```bash
# Conectarse a MySQL (Docker)
docker exec -it food_transport_mysql mysql -u foodapp -pfoodapp123 food_transport

# Conectarse a MySQL (Local)
mysql -u foodapp -pfoodapp123 food_transport

# Ver todas las tablas
SHOW TABLES;

# Ver usuarios
SELECT id, email, name, role FROM users;

# Ver envíos
SELECT id, truck_id, origin, destination, status FROM shipments;

# Limpiar datos de prueba
DELETE FROM shipments WHERE id > 0;
DELETE FROM sensor_data WHERE id > 0;
```

### Backend

```bash
# Modo desarrollo (hot-reload)
cd backend && npm run dev

# Modo producción
cd backend && npm start

# Reinicializar base de datos
cd backend && npm run init-db
```

---

## 🔧 Solución de Problemas

### Error: "Can't connect to MySQL server"

**Causa**: MySQL no está corriendo o la configuración es incorrecta.

**Solución**:

```bash
# Docker
docker-compose ps  # Verificar que MySQL esté "Up"
docker-compose logs mysql  # Ver logs de errores

# Local
brew services list  # Verificar que MySQL esté started
mysql.server start  # Iniciar manualmente
```

### Error: "Access denied for user 'foodapp'"

**Causa**: Usuario o contraseña incorrectos.

**Solución**:

```bash
# Conectarse como root y recrear usuario
mysql -u root -p

DROP USER IF EXISTS 'foodapp'@'localhost';
CREATE USER 'foodapp'@'localhost' IDENTIFIED BY 'foodapp123';
GRANT ALL PRIVILEGES ON food_transport.* TO 'foodapp'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Port 3306 already in use"

**Causa**: Ya hay un MySQL corriendo localmente.

**Solución (Opción 1)**: Detener MySQL local
```bash
brew services stop mysql
```

**Solución (Opción 2)**: Cambiar puerto en docker-compose.yml
```yaml
ports:
  - "3307:3306"  # Usar puerto 3307 en lugar de 3306
```

Y actualizar `.env`:
```
DB_PORT=3307
```

### Credenciales no funcionan después de instalar

**Causa**: Las contraseñas no están hasheadas correctamente.

**Solución**:

```bash
cd backend
npm run init-db
```

Este script rehashea las contraseñas correctamente.

### Error: "ECONNREFUSED 127.0.0.1:3001"

**Causa**: El backend no está corriendo.

**Solución**:

```bash
cd backend
npm install  # Si es primera vez
npm start
```

---

## 🧪 Probar la Instalación

### 1. Registrar un nuevo usuario

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Usuario Test",
    "role": "client",
    "company": "Test Inc."
  }'
```

### 2. Hacer login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@foodtransport.com",
    "password": "admin123"
  }'
```

Guarda el `token` de la respuesta.

### 3. Obtener envíos

```bash
# Reemplaza YOUR_TOKEN con el token del paso anterior
curl http://localhost:3001/api/shipments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Estructura de Base de Datos

### Tablas Principales

1. **users** - Usuarios del sistema (admin/client)
2. **shipments** - Envíos/tracking
3. **sensor_data** - Datos históricos de sensores
4. **alerts** - Alertas generadas

### Relaciones

```
users (1) ----> (N) shipments (client_id)
users (1) ----> (N) shipments (created_by)
shipments (1) ----> (N) sensor_data
shipments (1) ----> (N) alerts
```

### Vistas

- **shipments_with_client**: Envíos con información del cliente
- **user_stats**: Estadísticas por usuario

---

## 🚀 Despliegue en Producción

### Variables de Entorno a Configurar

```bash
NODE_ENV=production
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=strong-random-password
JWT_SECRET=very-long-random-string-minimum-32-chars
FRONTEND_URL=https://your-domain.com
```

### Seguridad

1. **No usar** las contraseñas de ejemplo
2. **Generar** un JWT_SECRET aleatorio:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Usar HTTPS** en producción
4. **Configurar** firewall para MySQL (solo acceso desde backend)
5. **Habilitar** SSL en MySQL
6. **Configurar** backup automático de la base de datos

---

## 📚 Documentación Adicional

- [Schema SQL](../database/schema.sql) - Estructura completa de la base de datos
- [API Endpoints](./API.md) - Documentación de todos los endpoints
- [Tracking & Auth](./TRACKING_AUTH.md) - Sistema de autenticación y tracking

---

## 💡 Consejos

- Para desarrollo, usa `npm run dev` en backend para hot-reload
- Los logs del backend se muestran en la terminal
- Puedes usar tools como [Postman](https://www.postman.com/) o [Insomnia](https://insomnia.rest/) para probar la API
- Para visualizar la base de datos, usa [TablePlus](https://tableplus.com/) (Mac) o [MySQL Workbench](https://www.mysql.com/products/workbench/)
