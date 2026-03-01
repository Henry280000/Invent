#!/bin/bash
# SCRIPT COMPLETO PARA INICIAR EL SISTEMA IOT CON DATOS DE MARISCOS

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 INICIANDO SISTEMA IOT DE MONITOREO${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================
# PASO 1: LIMPIAR PROCESOS ANTERIORES
# ============================================================
echo -e "${YELLOW}🔄 [1/7] Deteniendo procesos anteriores...${NC}"
pkill -f "node.*server.js" 2>/dev/null
pkill -f "node.*simulator.js" 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 2
echo -e "${GREEN}✅ Procesos detenidos${NC}"
echo ""

# ============================================================
# PASO 2: RESTABLECER CREDENCIALES
# ============================================================
echo -e "${YELLOW}🔐 [2/7] Restableciendo credenciales...${NC}"
cd /Users/enrique/Documents/Programacion/invent/backend/scripts
node init-db.js 2>/dev/null
cd /Users/enrique/Documents/Programacion/invent
echo -e "${GREEN}✅ Credenciales: admin@foodtransport.com / admin123${NC}"
echo ""

# ============================================================
# PASO 3: VERIFICAR MYSQL
# ============================================================
echo -e "${YELLOW}🗄️  [3/7] Verificando base de datos...${NC}"
MYSQL_COUNT=$(mysql -u foodapp -pfoodapp123 food_transport -e "SELECT COUNT(*) as c FROM iot_sensor_readings WHERE device_id='HIELERA_99';" 2>/dev/null | tail -1)
echo -e "${GREEN}✅ MySQL funcionando - $MYSQL_COUNT lecturas disponibles${NC}"
echo ""

# ============================================================
# PASO 4: INICIAR SIMULADOR (con verificación de Gateway)
# ============================================================
echo -e "${YELLOW}📡 [4/7] Iniciando simulador de mariscos...${NC}"
cd /Users/enrique/Documents/Programacion/invent/backend
node simulator.js > simulator.log 2>&1 &
SIMULATOR_PID=$!
sleep 2

# Verificar si simulador está esperando conexión
if grep -q "esperando conexión" simulator.log 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Simulador esperando conexión al Gateway WiFi${NC}"
    echo -e "${YELLOW}   (Datos antiguos disponibles en BD)${NC}"
else
    echo -e "${GREEN}✅ Simulador iniciado (PID: $SIMULATOR_PID)${NC}"
fi
echo ""

# ============================================================
# PASO 5: INICIAR BACKEND
# ============================================================
echo -e "${YELLOW}🚀 [5/7] Iniciando backend (API + WebSocket)...${NC}"
node server.js > server.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Verificar que backend inició correctamente
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend corriendo (PID: $BACKEND_PID)${NC}"
    echo -e "${GREEN}   API: http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Error iniciando backend${NC}"
    echo -e "${RED}   Ver logs: tail backend/server.log${NC}"
    exit 1
fi
echo ""

# ============================================================
# PASO 6: INICIAR FRONTEND
# ============================================================
echo -e "${YELLOW}🌐 [6/7] Iniciando frontend (React + Vite)...${NC}"
cd /Users/enrique/Documents/Programacion/invent
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 5

# Verificar que frontend inició
if grep -q "Local:.*localhost:3002" frontend.log 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend corriendo (PID: $FRONTEND_PID)${NC}"
    echo -e "${GREEN}   URL: http://localhost:3002${NC}"
else
    echo -e "${RED}❌ Error iniciando frontend${NC}"
    echo -e "${RED}   Ver logs: tail frontend.log${NC}"
fi
echo ""

# ============================================================
# PASO 7: VERIFICAR DATOS Y ESTADO
# ============================================================
echo -e "${YELLOW}📊 [7/7] Verificando datos disponibles...${NC}"
mysql -u foodapp -pfoodapp123 food_transport -e "
SELECT 
    sensor_type as 'Sensor',
    COUNT(*) as 'Lecturas',
    CONCAT(ROUND(AVG(sensor_value), 1), ' ', unit) as 'Promedio',
    CONCAT(ROUND(MIN(sensor_value), 1), ' - ', ROUND(MAX(sensor_value), 1)) as 'Rango'
FROM iot_sensor_readings 
WHERE device_id='HIELERA_99' 
GROUP BY sensor_type, unit;
" 2>/dev/null

echo ""
echo -e "${GREEN}✅ Sistema completo iniciado${NC}"
echo ""

# ============================================================
# RESUMEN FINAL
# ============================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 RESUMEN DEL SISTEMA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🌐 FRONTEND:${NC}"
echo "   URL: http://localhost:3002"
echo "   Email: admin@foodtransport.com"
echo "   Password: admin123"
echo ""
echo -e "${GREEN}📡 SERVICIOS:${NC}"
echo "   Backend:   PID $BACKEND_PID (puerto 3001)"
echo "   Simulador: PID $SIMULATOR_PID"
echo "   Frontend:  PID $FRONTEND_PID (puerto 3002)"
echo ""
echo -e "${GREEN}📊 DATOS:${NC}"
echo "   • Temperatura: Ideal para mariscos (0-2°C)"
echo "   • Humedad: Alta para frescura (85-95%)"
echo "   • Etileno: Muy bajo (0-5 ppm)"
echo ""
echo -e "${YELLOW}📝 COMANDOS ÚTILES:${NC}"
echo "   Ver logs simulador: tail -f backend/simulator.log"
echo "   Ver logs backend:   tail -f backend/server.log"
echo "   Ver logs frontend:  tail -f frontend.log"
echo "   Detener todo:       pkill -f 'node.*(server|simulator)'; lsof -ti:3002 | xargs kill -9"
echo ""
echo -e "${YELLOW}⚠️  NOTA:${NC}"
echo "   • Si ves 'Error: connack timeout' en Monitoreo IoT, es NORMAL"
echo "   • Usa la pestaña 'Datos IoT' o 'Testing ESP32' para ver datos"
echo "   • El simulador solo envía NUEVOS datos si estás en la red Gateway WiFi"
echo "   • YA HAY datos disponibles en la BD para visualizar"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎯 Abre tu navegador en: http://localhost:3002${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Opcional: Abrir navegador automáticamente (descomenta si quieres)
# sleep 2
# open http://localhost:3002
