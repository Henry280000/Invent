#!/bin/bash
# SCRIPT PARA DETENER TODOS LOS SERVICIOS DEL SISTEMA IOT

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}🛑 DETENIENDO SISTEMA IOT${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================
# PASO 1: OBTENER PIDS ANTES DE DETENER
# ============================================================
echo -e "${YELLOW}📋 Identificando procesos...${NC}"

BACKEND_PID=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $2}')
SIMULATOR_PID=$(ps aux | grep "node.*simulator.js" | grep -v grep | awk '{print $2}')
FRONTEND_PID=$(lsof -ti:3002 2>/dev/null)

if [ -z "$BACKEND_PID" ] && [ -z "$SIMULATOR_PID" ] && [ -z "$FRONTEND_PID" ]; then
    echo -e "${GREEN}✅ No hay procesos corriendo${NC}"
    echo ""
    exit 0
fi

echo ""
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "  🔴 Backend (PID: $BACKEND_PID)"
fi
if [ ! -z "$SIMULATOR_PID" ]; then
    echo -e "  🔴 Simulador (PID: $SIMULATOR_PID)"
fi
if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "  🔴 Frontend (PID: $FRONTEND_PID)"
fi
echo ""

# ============================================================
# PASO 2: DETENER BACKEND
# ============================================================
echo -e "${YELLOW}🛑 Deteniendo backend...${NC}"
pkill -f "node.*server.js" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend detenido${NC}"
else
    echo -e "${YELLOW}⚠️  Backend no estaba corriendo${NC}"
fi

# ============================================================
# PASO 3: DETENER SIMULADOR
# ============================================================
echo -e "${YELLOW}🛑 Deteniendo simulador...${NC}"
pkill -f "node.*simulator.js" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Simulador detenido${NC}"
else
    echo -e "${YELLOW}⚠️  Simulador no estaba corriendo${NC}"
fi

# ============================================================
# PASO 4: DETENER FRONTEND
# ============================================================
echo -e "${YELLOW}🛑 Deteniendo frontend...${NC}"
lsof -ti:3002 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend detenido${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend no estaba corriendo${NC}"
fi

# Liberar puerto 3001 por si acaso
lsof -ti:3001 | xargs kill -9 2>/dev/null

# ============================================================
# PASO 5: ESPERAR Y VERIFICAR
# ============================================================
echo ""
echo -e "${YELLOW}⏳ Esperando 2 segundos...${NC}"
sleep 2

# Verificar que todo se detuvo
REMAINING=$(ps aux | grep -E "node.*(server|simulator)" | grep -v grep | wc -l | tr -d ' ')

if [ "$REMAINING" -eq "0" ]; then
    echo -e "${GREEN}✅ Todos los procesos se detuvieron correctamente${NC}"
else
    echo -e "${RED}⚠️  Hay $REMAINING proceso(s) aún corriendo${NC}"
    echo -e "${YELLOW}   Intentando detener con kill -9...${NC}"
    ps aux | grep -E "node.*(server|simulator)" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
    sleep 1
    echo -e "${GREEN}✅ Forzado${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SISTEMA DETENIDO COMPLETAMENTE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 Para reiniciar el sistema:${NC}"
echo "   ./EJECUTAR_TODO.sh"
echo ""
echo -e "${YELLOW}📊 Para verificar que nada está corriendo:${NC}"
echo "   ps aux | grep -E 'node.*(server|simulator)' | grep -v grep"
echo "   lsof -i:3001"
echo "   lsof -i:3002"
echo ""
