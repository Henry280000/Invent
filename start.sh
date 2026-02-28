#!/bin/bash

# Script simple para iniciar el contenedor
# Food Transport IoT System

echo "🚀 Iniciando contenedores Docker..."
echo ""

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    echo "   Por favor inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

# Construir e iniciar contenedores
docker-compose up -d --build

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado
echo ""
echo "📊 Estado de los contenedores:"
docker-compose ps

echo ""
echo "✅ Sistema iniciado!"
echo ""
echo "📡 Servicios disponibles:"
echo "   - MQTT Broker: mqtt://localhost:1883"
echo "   - MQTT WebSocket: ws://localhost:9001"
echo "   - MySQL: localhost:3306"
echo "   - Backend API: http://localhost:3001"
echo ""
echo "🔍 Ver logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Detener:"
echo "   docker-compose down"
echo ""
