@echo off
REM SCRIPT PARA DETENER TODOS LOS SERVICIOS DEL SISTEMA IOT - WINDOWS
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🛑 DETENIENDO SISTEMA IOT
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM ============================================================
REM PASO 1: IDENTIFICAR PROCESOS
REM ============================================================
echo 📋 Identificando procesos...
echo.

set BACKEND_FOUND=0
set SIMULATOR_FOUND=0
set FRONTEND_FOUND=0

tasklist /FI "IMAGENAME eq node.exe" | findstr /C:"node.exe" >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq node.exe" ^| findstr /C:"node.exe"') do (
        set /a NODE_COUNT+=1
    )
    if defined NODE_COUNT (
        echo   🔴 Procesos Node.js detectados
        set BACKEND_FOUND=1
    )
)

netstat -ano | findstr :3002 >nul 2>&1
if !errorlevel! equ 0 (
    echo   🔴 Frontend detectado ^(puerto 3002^)
    set FRONTEND_FOUND=1
)

netstat -ano | findstr :3001 >nul 2>&1
if !errorlevel! equ 0 (
    echo   🔴 Backend detectado ^(puerto 3001^)
    set BACKEND_FOUND=1
)

if !BACKEND_FOUND! equ 0 if !SIMULATOR_FOUND! equ 0 if !FRONTEND_FOUND! equ 0 (
    echo ✅ No hay procesos corriendo
    echo.
    pause
    exit /b 0
)

echo.

REM ============================================================
REM PASO 2: DETENER BACKEND
REM ============================================================
echo 🛑 Deteniendo backend...
taskkill /F /FI "WINDOWTITLE eq *server.js*" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Backend detenido
) else (
    echo ⚠️  Backend no estaba corriendo
)

REM ============================================================
REM PASO 3: DETENER SIMULADOR
REM ============================================================
echo 🛑 Deteniendo simulador...
taskkill /F /FI "WINDOWTITLE eq *simulator.js*" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Simulador detenido
) else (
    echo ⚠️  Simulador no estaba corriendo
)

REM ============================================================
REM PASO 4: DETENER FRONTEND
REM ============================================================
echo 🛑 Deteniendo frontend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Frontend detenido
        set FRONTEND_KILLED=1
    )
)

if not defined FRONTEND_KILLED (
    echo ⚠️  Frontend no estaba corriendo
)

REM Liberar puerto 3001 por si acaso
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1

REM Detener cualquier proceso Node relacionado con el proyecto
wmic process where "commandline like '%%server.js%%'" delete >nul 2>&1
wmic process where "commandline like '%%simulator.js%%'" delete >nul 2>&1

REM ============================================================
REM PASO 5: ESPERAR Y VERIFICAR
REM ============================================================
echo.
echo ⏳ Esperando 2 segundos...
timeout /t 2 >nul

REM Verificar que todo se detuvo
set REMAINING=0
for /f %%i in ('tasklist /FI "IMAGENAME eq node.exe" ^| findstr /C:"node.exe" ^| find /C "node.exe"') do set REMAINING=%%i

if !REMAINING! equ 0 (
    echo ✅ Todos los procesos se detuvieron correctamente
) else (
    echo ⚠️  Hay !REMAINING! proceso^(s^) Node.js aún corriendo
    echo    Intentando detener con fuerza...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 1 >nul
    echo ✅ Forzado
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ SISTEMA DETENIDO COMPLETAMENTE
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📝 Para reiniciar el sistema:
echo    EJECUTAR_TODO.bat
echo.
echo 📊 Para verificar que nada está corriendo:
echo    tasklist ^| findstr node.exe
echo    netstat -ano ^| findstr :3001
echo    netstat -ano ^| findstr :3002
echo.

pause
