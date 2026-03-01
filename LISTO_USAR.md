# 🎯 SISTEMA IOT LISTO - INSTRUCCIONES FINALES

## ✅ CAMBIOS REALIZADOS

### 1. Backend Corregido
- ✅ Endpoint `/api/iot/by-category/:category` arreglado
- ✅ Ahora lee directamente de `iot_sensor_readings`
- ✅ No requiere tabla `sensor_classifications`

### 2. Simulador Mejorado para MARISCOS
- 🐟 **Temperatura**: -1°C a 4°C (óptimo: 0-2°C)
- 💧 **Humedad**: 85-95% (alta humedad para frescura)
- 🍃 **Etileno**: 0-5 ppm (muy bajo, mariscos no producen etileno)
- 📡 **SOLO funciona cuando estás conectado al Gateway WiFi**

### 3. Frontend Actualizado
- ✅ Reiniciado en http://localhost:3002
- ✅ Mostrará datos de las 3 categorías

---

## 🚀 ESTADO ACTUAL

```
✅ Backend corriendo (PID: 85211) - Puerto 3001
✅ Simulador corriendo (PID: 85210) - Esperando conexión
✅ Frontend corriendo - Puerto 3002
⚠️  Esperando conexión al Gateway ESP32
```

---

## 📡 PARA VER DATOS EN EL DASHBOARD

### Opción 1: Conectar al Gateway ESP32 (Hardware Real)

```bash
# 1. Conectar al WiFi del Gateway
networksetup -setairportnetwork en0 ESP32-Gateway-Hieleras hieleras2026

# 2. Verificar conexión
ping -c 2 192.168.4.1

# 3. Esperar 5 segundos y ver logs
tail -f backend/simulator.log

# Deberías ver:
# ✅ Conectado al Gateway
# 📊 Envío #1
# 🌡️  Temperatura: 1.2°C
# 💧 Humedad: 88.5%
# 🍃 Etileno: 2.3 ppm
# ✅ Guardado en MySQL
```

### Opción 2: Datos Antiguos (Ya en la BD)

```bash
# Ver datos existentes por categoría
mysql -u foodapp -pfoodapp123 food_transport -e "
SELECT sensor_type, COUNT(*) as lecturas, 
       AVG(sensor_value) as promedio,
       MIN(sensor_value) as minimo,
       MAX(sensor_value) as maximo
FROM iot_sensor_readings 
WHERE device_id='HIELERA_99'
GROUP BY sensor_type;
" 2>&1 | grep -v Warning
```

**Datos actuales en BD:**
- 🌡️ Temperatura: 49 lecturas (promedio: 3.7°C, rango: 2.2-4.9°C)
- 💧 Humedad: 49 lecturas (promedio: 88%, rango: 80-95%)
- 🍃 Etileno: 49 lecturas (promedio: 54.8 ppm, rango: 0.17-97.5 ppm)

---

## 🌐 ACCESO AL DASHBOARD

**URL:** http://localhost:3002

**Credenciales:**
```
Email: admin@foodtransport.com
Password: admin123
```

**Pestañas disponibles:**
1. **Monitoreo IoT** - Vista con "Error: connack timeout" (MQTT no necesario)
2. **Datos IoT** - ✅ AQUÍ verás los datos de temperatura, humedad y gases
3. **Testing ESP32** - Datos del nodo de prueba (HIELERA_99)
4. **Panel de Admin** - Gestión de usuarios y envíos

---

## 📊 CÓMO VER LOS DATOS

### En la pestaña "Datos IoT":

1. Verás botones: **Temperatura | Humedad | Presión | Gases | ...**
2. Click en cada botón para ver datos de esa categoría
3. Los datos se actualizan automáticamente cada 10 segundos

### En la pestaña "Testing ESP32":

1. Verás estadísticas del nodo HIELERA_99
2. Gráficos de las últimas lecturas
3. Tabla con datos detallados

---

## 🔍 VERIFICAR QUE TODO FUNCIONA

```bash
# 1. Ver logs del simulador (debe decir "esperando conexión")
tail -f backend/simulator.log

# 2. Ver logs del backend
tail -f backend/server.log

# 3. Contar datos en MySQL
mysql -u foodapp -pfoodapp123 food_transport -e "
SELECT COUNT(*) as total_lecturas 
FROM iot_sensor_readings 
WHERE device_id='HIELERA_99';
" 2>&1 | grep -v Warning

# 4. Ver últimos 6 datos
mysql -u foodapp -pfoodapp123 food_transport -e "
SELECT sensor_type, sensor_value, unit, 
       DATE_FORMAT(recorded_at, '%H:%i:%s') as hora
FROM iot_sensor_readings 
WHERE device_id='HIELERA_99' 
ORDER BY recorded_at DESC 
LIMIT 6;
" 2>&1 | grep -v Warning
```

---

## 🐟 ESPECIFICACIONES DE MARISCOS

El simulador ahora genera datos realistas para **transporte de mariscos frescos**:

| Parámetro | Rango | Ideal | Alerta |
|-----------|-------|-------|--------|
| **Temperatura** | -1°C a 4°C | 0-2°C | > 3°C |
| **Humedad** | 85-95% | 88-92% | < 85% o > 95% |
| **Etileno** | 0-5 ppm | < 2 ppm | > 3 ppm |

**Variación:**
- Temperatura: ±1°C alrededor de 1°C (refrigeración estable)
- Humedad: ±5% alrededor de 90% (alta humedad)
- Etileno: 0-5 ppm (mariscos no producen etileno)

---

## 🛑 DETENER TODO

```bash
# Detener backend y simulador
pkill -f "node.*server.js"
pkill -f "node.*simulator.js"

# Detener frontend
lsof -ti:3002 | xargs kill -9
```

---

## 🔄 REINICIAR TODO

```bash
cd /Users/enrique/Documents/Programacion/invent

# 1. Iniciar backend y simulador
cd backend
node simulator.js > simulator.log 2>&1 &
node server.js > server.log 2>&1 &

# 2. Iniciar frontend
cd ..
npm run dev > frontend.log 2>&1 &

# 3. Esperar 5 segundos
sleep 5

# 4. Abrir navegador
open http://localhost:3002
```

---

## ❓ SOLUCIÓN DE PROBLEMAS

### No veo datos en el dashboard

1. **Verifica que el backend esté corriendo:**
   ```bash
   ps aux | grep "node.*server.js" | grep -v grep
   ```

2. **Verifica que hay datos en MySQL:**
   ```bash
   mysql -u foodapp -pfoodapp123 food_transport -e "SELECT COUNT(*) FROM iot_sensor_readings WHERE device_id='HIELERA_99';" 2>&1 | grep -v Warning
   ```

3. **Recarga el navegador:** Ctrl + Shift + R (forzar recarga sin caché)

4. **Verifica credenciales:** Usa el EMAIL completo `admin@foodtransport.com`

### Error "connack timeout" en Monitoreo IoT

- ✅ **NORMAL** - MQTT no está habilitado
- 💡 Usa la pestaña **"Datos IoT"** o **"Testing ESP32"** en su lugar

### El simulador no envía datos

- ⚠️ El simulador **solo funciona conectado al Gateway WiFi**
- 📡 Conéctate a: `ESP32-Gateway-Hieleras` (password: `hieleras2026`)
- 🔍 Verifica con: `ping 192.168.4.1`

---

## 📝 RESUMEN

✅ **Backend:** Corregido para leer datos directamente  
✅ **Simulador:** Datos realistas para mariscos (0-2°C)  
✅ **Frontend:** Actualizado y funcionando  
✅ **Base de Datos:** 147 lecturas disponibles  
✅ **Credenciales:** `admin@foodtransport.com` / `admin123`  

**🎯 Abre http://localhost:3002 → Pestaña "Datos IoT" → Click en "Temperatura"**

---

## 💡 NOTA IMPORTANTE

Los datos **YA ESTÁN** en la base de datos (lecturas antiguas).  
El nuevo simulador generará datos más realistas **SOLO cuando te conectes al Gateway WiFi**.  
Pero **NO necesitas** el Gateway para ver los datos existentes en el dashboard.
