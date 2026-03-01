# 🚀 COMANDOS RÁPIDOS DEL SISTEMA

## ▶️ INICIAR TODO

```bash
cd /Users/enrique/Documents/Programacion/invent
./EJECUTAR_TODO.sh
```

**Esto iniciará automáticamente:**
- ✅ Backend (puerto 3001)
- ✅ Simulador (datos cada 30 seg)
- ✅ Frontend (puerto 3002)

**Al terminar verás:**
- URL: http://localhost:3002
- Credenciales: admin@foodtransport.com / admin123
- PIDs de los procesos
- Estadísticas de datos

---

## 🛑 DETENER TODO

```bash
cd /Users/enrique/Documents/Programacion/invent
./DETENER_TODO.sh
```

**Esto detendrá:**
- 🔴 Backend
- 🔴 Simulador
- 🔴 Frontend
- 🔴 Liberará puertos 3001 y 3002

---

## 📊 VER ESTADO

```bash
# Ver procesos corriendo
ps aux | grep -E 'node.*(server|simulator)' | grep -v grep

# Ver puertos en uso
lsof -i:3001  # Backend
lsof -i:3002  # Frontend

# Ver logs en tiempo real
tail -f backend/simulator.log   # Simulador
tail -f backend/server.log      # Backend
tail -f frontend.log             # Frontend
```

---

## 🗄️ BASE DE DATOS

```bash
# Ver cuántos datos hay
mysql -u foodapp -pfoodapp123 food_transport -e "SELECT COUNT(*) FROM iot_sensor_readings WHERE device_id='HIELERA_99';" 2>&1 | grep -v Warning

# Ver estadísticas por sensor
mysql -u foodapp -pfoodapp123 food_transport -e "
SELECT 
    sensor_type as Sensor,
    COUNT(*) as Lecturas,
    ROUND(AVG(sensor_value), 1) as Promedio,
    ROUND(MIN(sensor_value), 1) as Minimo,
    ROUND(MAX(sensor_value), 1) as Maximo
FROM iot_sensor_readings 
WHERE device_id='HIELERA_99' 
GROUP BY sensor_type;
" 2>&1 | grep -v Warning

# Ver últimos 10 datos
mysql -u foodapp -pfoodapp123 food_transport -e "
SELECT sensor_type, sensor_value, unit, 
       DATE_FORMAT(recorded_at, '%H:%i:%s') as hora
FROM iot_sensor_readings 
WHERE device_id='HIELERA_99' 
ORDER BY recorded_at DESC 
LIMIT 10;
" 2>&1 | grep -v Warning
```

---

## 🐟 DATOS DE MARISCOS

El simulador genera valores realistas para transporte de mariscos:

| Parámetro | Rango | Ideal |
|-----------|-------|-------|
| Temperatura | -1°C a 4°C | 0-2°C |
| Humedad | 85-95% | 88-92% |
| Etileno | 0-5 ppm | < 2 ppm |

---

## 🔧 SOLUCIÓN RÁPIDA

### Si algo no funciona:

```bash
# 1. Detener todo
./DETENER_TODO.sh

# 2. Esperar 3 segundos
sleep 3

# 3. Iniciar de nuevo
./EJECUTAR_TODO.sh
```

### Si los puertos están ocupados:

```bash
# Liberar puertos manualmente
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
```

---

## 📡 GATEWAY ESP32 (Opcional)

Si quieres conectar el hardware real:

```bash
# 1. Detener simulador actual
pkill -f "node.*simulator.js"

# 2. Conectar al WiFi del Gateway
networksetup -setairportnetwork en0 ESP32-Gateway-Hieleras hieleras2026

# 3. Verificar conexión
ping -c 3 192.168.4.1

# 4. Reiniciar backend (se conectará automáticamente)
pkill -f "node.*server.js"
cd backend && node server.js > server.log 2>&1 &
```

---

## 🌐 ACCESO AL DASHBOARD

**URL:** http://localhost:3002

**Credenciales:**
- Email: `admin@foodtransport.com`
- Password: `admin123`

**Pestañas importantes:**
- **Datos IoT** → Ver temperatura, humedad, gases
- **Testing ESP32** → Estadísticas detalladas de HIELERA_99
- **Panel de Admin** → Gestión de usuarios

---

## 📝 NOTAS

- ✅ Los datos se guardan automáticamente en MySQL
- ✅ El simulador solo envía NUEVOS datos si estás conectado al Gateway WiFi
- ✅ Puedes ver los datos existentes aunque no estés conectado al Gateway
- ⚠️ El error "connack timeout" en Monitoreo IoT es normal (MQTT deshabilitado)

---

## 🆘 AYUDA

Si necesitas más información:
- Ver [LISTO_USAR.md](LISTO_USAR.md) para guía completa
- Ver logs: `tail -f backend/server.log`
- Verificar MySQL: `mysql -u foodapp -pfoodapp123 food_transport`
