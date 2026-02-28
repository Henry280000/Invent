# 🚀 Cómo Iniciar el Sistema

## Necesitas tener Docker Desktop corriendo

### 1️⃣ Inicia Docker Desktop

**En Mac:** 
- Abre Docker Desktop desde Aplicaciones
- Espera a que el icono de la ballena esté disponible en la barra superior

### 2️⃣ Inicia los contenedores

```bash
./start.sh
```

Esto iniciará:
- ✅ MySQL (base de datos) - puerto 3306
- ✅ Mosquitto (broker MQTT) - puerto 1883
- ✅ Backend (API + Cliente MQTT) - puerto 3001

### 3️⃣ Inicializa la base de datos (solo la primera vez)

```bash
cd backend
npm run init-db
cd ..
```

### 4️⃣ Inicia el frontend

```bash
npm run dev
```

Abre: **http://localhost:3002**

---

## 🔐 Credenciales

- **Admin:** admin@foodtransport.com / admin123
- **Cliente:** cliente@empresa.com / cliente123

---

## 🧪 Probar con datos MQTT

Una vez todo iniciado, puedes enviar datos de prueba:

```bash
# Instalar cliente MQTT (si no lo tienes)
brew install mosquitto

# Enviar temperatura
mosquitto_pub -h localhost -t "iot/sensors/temperature/sensor_001" -m '{
  "deviceId": "sensor_001",
  "truckId": "TRUCK-001",
  "sensorType": "temperature",
  "value": 3.5,
  "unit": "°C"
}'
```

Verás los datos en la pestaña **📊 Datos IoT** del dashboard.

---

## ❌ Si Docker no funciona

### Alternativa: MySQL local

1. Instala MySQL:
```bash
brew install mysql
brew services start mysql
```

2. Crea el usuario:
```bash
mysql -u root -p
CREATE USER 'foodapp'@'localhost' IDENTIFIED BY 'foodapp123';
GRANT ALL PRIVILEGES ON *.* TO 'foodapp'@'localhost';
FLUSH PRIVILEGES;
exit;
```

3. Inicia solo el backend:
```bash
cd backend
npm run init-db
npm start
```

4. En otra terminal, inicia el frontend:
```bash
npm run dev
```

**Nota:** Sin Docker no tendrás el broker MQTT, pero el sistema de usuarios y envíos funcionará.
