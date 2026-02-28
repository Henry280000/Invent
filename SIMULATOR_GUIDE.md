# 🎮 Guía de Uso del Simulador

## Inicio Rápido

### 1. Iniciar el Dashboard
```bash
npm run dev
```

### 2. Abrir la Consola del Navegador
- Chrome/Edge: `F12` o `Cmd+Option+J` (Mac) / `Ctrl+Shift+J` (Windows)
- Firefox: `F12` o `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)

### 3. Comandos del Simulador

#### Iniciar Simulación Normal
```javascript
simulator.start()
// Envía datos cada 5 segundos con valores normales
```

#### Cambiar Velocidad de Envío
```javascript
simulator.start(2000)  // Cada 2 segundos
simulator.start(10000) // Cada 10 segundos
```

#### Detener Simulación
```javascript
simulator.stop()
```

## 🎭 Escenarios de Testing

### Escenario 1: Operación Normal
```javascript
simulator.setScenario('normal')
simulator.start()
```
**Comportamiento esperado:**
- Temperatura: 2°C (±1.5°C)
- Humedad: 85% (±10%)
- NH₃: ~2-5 ppm
- TMA: ~0.5-2 ppm
- Etileno: ~20-40 ppm
- Sin alertas de seguridad
- Hash-chain al 100%

---

### Escenario 2: Degradación de Alimentos
```javascript
simulator.setScenario('degradation')
simulator.start()
```
**Comportamiento esperado:**
- NH₃: 10-20 ppm (⚠️ ALTO)
- TMA: 5-10 ppm (⚠️ ALTO)
- Etileno: 100-200 ppm (⚠️ ALTO)
- Alertas de calidad alimentaria
- Recomendación de inspección

**Uso:** Simular producto en mal estado o tiempo prolongado sin refrigeración

---

### Escenario 3: Violación de Seguridad
```javascript
simulator.setScenario('security_breach')
simulator.start()
```
**Comportamiento esperado:**
- LDR: Detección de luz (🚨 APERTURA)
- IMU: Movimientos bruscos (🚨 ALERTA)
- Hall: Desacoplamiento (⚠️ SEPARADO)
- Aceleraciones altas (>1g)
- Alertas críticas de seguridad

**Uso:** Simular manipulación no autorizada o transporte inadecuado

---

### Escenario 4: Falla de Refrigeración + Inconsistencia Biológica
```javascript
simulator.setScenario('temperature_failure')
simulator.start()
```
**Comportamiento esperado:**
- Temperatura: 8°C (🚨 FUERA DE RANGO)
- NH₃: 20-40 ppm (🚨 INCONSISTENCIA)
- Alerta de inconsistencia biológica
- NH₃ anormalmente alto para temperatura
- Posible contaminación previa

**Uso:** Detectar fallas del sistema de refrigeración o productos con historial térmico comprometido

---

## 📊 Secuencia de Testing Completa

```javascript
// 1. Operación normal durante 30 segundos
simulator.setScenario('normal')
simulator.start(3000)

// Esperar 30 segundos...

// 2. Simular inicio de degradación
simulator.setScenario('degradation')

// Esperar 30 segundos...

// 3. Simular intento de robo
simulator.setScenario('security_breach')

// Esperar 20 segundos...

// 4. Volver a normal
simulator.setScenario('normal')

// 5. Detener después de verificar
setTimeout(() => simulator.stop(), 60000)
```

## 🔬 Validación de Funcionalidades

### ✅ Hash-Chaining
```javascript
// El simulador genera hash-chains válidos
// Verifica en el dashboard:
// - Integridad: 100%
// - Bloques válidos: todos en verde
// - Sin pérdida de paquetes
```

### ✅ Inconsistencia Biológica
```javascript
simulator.setScenario('temperature_failure')
simulator.start(5000)

// Observa en "Sensores Químicos":
// - Alerta roja animada
// - Cálculo de NH₃ esperado vs real
// - Porcentaje de desviación
```

### ✅ Duty Cycles
```javascript
// Observa en "Sensores Químicos":
// - Contador de ciclos incrementa
// - Tiempo hasta próxima lectura
// - Nota sobre membrana hidrofóbica
```

### ✅ Sistema de Alertas
```javascript
simulator.setScenario('security_breach')
simulator.start()

// Verifica:
// - Alertas aparecen en tiempo real
// - Filtros funcionan (Críticas, Altas, etc.)
// - Botón "Reconocer" funciona
// - Estadísticas se actualizan
```

## 🎨 Visualización de Datos

### Gráficas que deberías ver:

1. **Temperatura y Humedad** (Condiciones Ambientales)
   - 2 líneas: azul (temp) y verde (humedad)
   - Últimas 20 lecturas

2. **Gases** (Sensores Químicos)
   - NH₃ (rojo)
   - TMA (naranja)
   - Etileno escalado (morado)
   - Líneas de referencia para umbrales

3. **NH₃ vs Temperatura** (Validación Biológica)
   - Comparación en ejes independientes
   - Detecta anomalías

## 🐛 Debugging

### Ver mensajes del simulador:
```javascript
// Abrir consola y observar:
// 📤 Simulated message #X sent [scenario]
```

### Ver mensajes recibidos:
```javascript
// En consola del dashboard:
// 📦 Received sensor data: ...
// ✅ Block validated successfully
```

### Reiniciar todo:
```javascript
simulator.reset()
// Reinicia secuencia, hash-chain, y vuelve a 'normal'
```

## 📱 Testing Responsive

1. Abrir DevTools → Toggle Device Toolbar
2. Probar en:
   - iPhone 12 Pro (390x844)
   - iPad Pro (1024x1366)
   - Desktop (1920x1080)

## ⚙️ Configuración MQTT Personalizada

Si tienes un broker propio:

```javascript
// 1. Stop simulator
simulator.stop()

// 2. En UI: Click "⚙️ Configuración"
// 3. Ingresar:
//    - URL: ws://tu-broker:8083/mqtt
//    - Client ID: test_dashboard
//    - Usuario/Contraseña si aplica

// 4. Click "Aplicar y reconectar"

// 5. Restart simulator
simulator.start()
```

## 🎯 Métricas de Éxito

Al finalizar testing, deberías ver:

- ✅ Conexión MQTT estable
- ✅ Hash-chain al 100% de integridad
- ✅ 4 tipos de alertas generadas en diferentes escenarios
- ✅ Gráficas actualizándose en tiempo real
- ✅ Inconsistencia biológica detectada en scenario 4
- ✅ Dispositivo con batería/señal en rangos normales
- ✅ Todas las tarjetas mostrando datos coherentes

## 🔗 Recursos Adicionales

- **README.md**: Documentación completa
- **src/proto/sensordata.proto**: Schema de datos
- **src/services/**: Lógica de negocio
- **Consola del navegador**: Logs detallados

---

**¡Happy Testing! 🚀**
