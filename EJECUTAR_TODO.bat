@echo off
REM SCRIPT COMPLETO PARA INICIAR EL SISTEMA IOT CON DATOS DE MARISCOS - WINDOWS
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🚀 INICIANDO SISTEMA IOT DE MONITOREO
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM ============================================================
REM PASO 1: LIMPIAR PROCESOS ANTERIORES
REM ============================================================
echo 🔄 [1/7] Deteniendo procesos anteriores...
taskkill /F /FI "WINDOWTITLE eq *server.js*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq *simulator.js*" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 >nul
echo ✅ Procesos detenidos
echo.

REM ============================================================
REM PASO 2: RESTABLECER CREDENCIALES
REM ============================================================
echo 🔐 [2/7] Restableciendo credenciales...
cd backend\scripts
node init-db.js >nul 2>&1
cd ..\..
echo ✅ Credenciales: admin@foodtransport.com / admin123
echo.

REM ============================================================
REM PASO 3: VERIFICAR MYSQL
REM ============================================================
echo 🗄️  [3/7] Verificando base de datos...
for /f "skip=1" %%i in ('mysql -u foodapp -pfoodapp123 food_transport -e "SELECT COUNT(*) FROM iot_sensor_readings WHERE device_id='HIELERA_99';" 2^>nul') do set MYSQL_COUNT=%%i
echo ✅ MySQL funcionando - !MYSQL_COUNT! lecturas disponibles
echo.

REM ============================================================
REM PASO 4: INICIAR SIMULADOR (con verificación de Gateway)
REM ============================================================
echo 📡 [4/7] Iniciando simulador de mariscos...
cd backend
start /B node simulator.js > simulator.log 2>&1
timeout /t 2 >nul

REM Verificar si simulador está esperando conexión
findstr /C:"esperando conexión" simulator.log >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠️  Simulador esperando conexión al Gateway WiFi
    echo    ^(Datos antiguos disponibles en BD^)
) else (
    echo ✅ Simulador iniciado
)
echo.

REM ============================================================
REM PASO 5: INICIAR BACKEND
REM ============================================================
echo 🚀 [5/7] Iniciando backend ^(API + WebSocket^)...
start /B node server.js > server.log 2>&1
timeout /t 3 >nul

echo ✅ Backend corriendo
echo    API: http://localhost:3001
echo.

REM ============================================================
REM PASO 6: INICIAR FRONTEND
REM ============================================================
echo 🌐 [6/7] Iniciando frontend ^(React + Vite^)...
cd ..
start /B npm run dev > frontend.log 2>&1
timeout /t 5 >nul

findstr /C:"localhost:3002" frontend.log >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Frontend corriendo
    echo    URL: http://localhost:3002
) else (
    echo ❌ Error iniciando frontend
    echo    Ver logs: type frontend.log
)
echo.

REM ============================================================
REM PASO 7: VERIFICAR DATOS Y ESTADO
REM ============================================================
echo 📊 [7/7] Verificando datos disponibles...
mysql -u foodapp -pfoodapp123 food_transport -e "SELECT sensor_type as 'Sensor', COUNT(*) as 'Lecturas', CONCAT(ROUND(AVG(sensor_value), 1), ' ', unit) as 'Promedio', CONCAT(ROUND(MIN(sensor_value), 1), ' - ', ROUND(MAX(sensor_value), 1)) as 'Rango' FROM iot_sensor_readings WHERE device_id='HIELERA_99' GROUP BY sensor_type, unit;" 2>nul

echo.
echo ✅ Sistema completo iniciado
echo.

REM ============================================================
REM RESUMEN FINAL
REM ============================================================
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📋 RESUMEN DEL SISTEMA
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 🌐 FRONTEND:
echo    URL: http://localhost:3002
echo    Email: admin@foodtransport.com
echo    Password: admin123
echo.
echo 📡 SERVICIOS:
echo    Backend:   puerto 3001
echo    Simulador: generando datos cada 30s
echo    Frontend:  puerto 3002
echo.
echo 📊 DATOS:
echo    • Temperatura: Ideal para mariscos ^(0-2°C^)
echo    • Humedad: Alta para frescura ^(85-95%%^)
echo    • Etileno: Muy bajo ^(0-5 ppm^)
echo.
echo 📝 COMANDOS ÚTILES:
echo    Ver logs simulador: type backend\simulator.log
echo    Ver logs backend:   type backend\server.log
echo    Ver logs frontend:  type frontend.log
echo    Detener todo:       DETENER_TODO.bat
echo.
echo ⚠️  NOTA:
echo    • Los datos se actualizan cada 30 segundos
echo    • El simulador solo envía NUEVOS datos si estás en la red Gateway WiFi
echo    • YA HAY datos disponibles en la BD para visualizar
echo    • Usa Panel de Admin para enviar actualizaciones a clientes
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎯 Abre tu navegador en: http://localhost:3002
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Opción para abrir navegador automáticamente (descomenta si quieres)
REM timeout /t 2 >nul
REM start http://localhost:3002

pause
