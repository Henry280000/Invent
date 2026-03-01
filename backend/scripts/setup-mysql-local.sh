#!/bin/bash

# Script para configurar MySQL LOCAL (sin Docker)

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🗄️  CONFIGURACIÓN MYSQL LOCAL                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Intentar sin contraseña primero
echo "1️⃣  Intentando conectar a MySQL sin contraseña..."
if mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión exitosa sin contraseña${NC}"
    USE_PASSWORD=false
else
    echo -e "${YELLOW}⚠️  Root requiere contraseña${NC}"
    read -sp "Ingresa la contraseña de MySQL root: " MYSQL_ROOT_PASS
    echo ""
    
    if mysql -u root -p"$MYSQL_ROOT_PASS" -e "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Conexión exitosa con contraseña${NC}"
        USE_PASSWORD=true
    else
        echo -e "${RED}❌ No se puede conectar a MySQL${NC}"
        exit 1
    fi
fi

echo ""
echo "2️⃣  Creando base de datos y usuario..."

# Crear comandos SQL
SQL_COMMANDS="
-- Crear base de datos
DROP DATABASE IF EXISTS food_transport;
CREATE DATABASE food_transport CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario foodapp
DROP USER IF EXISTS 'foodapp'@'localhost';
CREATE USER 'foodapp'@'localhost' IDENTIFIED BY 'foodapp123';
GRANT ALL PRIVILEGES ON food_transport.* TO 'foodapp'@'localhost';
FLUSH PRIVILEGES;

-- Usar base de datos
USE food_transport;
"

# Ejecutar comandos SQL
if [ "$USE_PASSWORD" = true ]; then
    echo "$SQL_COMMANDS" | mysql -u root -p"$MYSQL_ROOT_PASS"
else
    echo "$SQL_COMMANDS" | mysql -u root
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Base de datos y usuario creados${NC}"
else
    echo -e "${RED}❌ Error creando base de datos${NC}"
    exit 1
fi

echo ""
echo "3️⃣  Creando tablas desde schema.sql..."

# Leer schema.sql y ejecutarlo (saltando las primeras líneas de creación de DB y usuario)
if [ "$USE_PASSWORD" = true ]; then
    mysql -u foodapp -pfoodapp123 food_transport < ../database/schema.sql 2>&1 | grep -v "Warning"
else
    # Si no hay contraseña de root, el usuario foodapp tampoco debería necesitarla
    mysql -u foodapp -pfoodapp123 food_transport < ../database/schema.sql 2>&1 | grep -v "Warning"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tablas creadas correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  Algunas tablas pueden ya existir (normal)${NC}"
fi

echo ""
echo "4️⃣  Verificando configuración..."

# Verificar tablas
TABLES=$(mysql -u foodapp -pfoodapp123 food_transport -e "SHOW TABLES;" 2>/dev/null | wc -l)
TABLES=$((TABLES - 1))

if [ $TABLES -gt 0 ]; then
    echo -e "${GREEN}✅ $TABLES tablas creadas en food_transport${NC}"
    echo ""
    echo "Tablas disponibles:"
    mysql -u foodapp -pfoodapp123 food_transport -e "SHOW TABLES;" 2>/dev/null
else
    echo -e "${RED}❌ No se crearon tablas${NC}"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ MYSQL LOCAL CONFIGURADO CORRECTAMENTE                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Credenciales:${NC}"
echo "  Host: localhost"
echo "  Puerto: 3306"
echo "  Base de datos: food_transport"
echo "  Usuario: foodapp"
echo "  Contraseña: foodapp123"
echo ""
echo -e "${GREEN}Probar conexión:${NC}"
echo "  mysql -u foodapp -pfoodapp123 food_transport"
echo ""
echo -e "${GREEN}Siguiente paso:${NC}"
echo "  cd /Users/enrique/Documents/Programacion/invent/backend"
echo "  npm start"
echo ""
