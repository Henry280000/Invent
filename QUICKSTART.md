# ⚡ Guía de Inicio Rápido

¡Empieza a usar el Food Transport Dashboard en 2 minutos!

---

## 🚀 Inicio en 3 Pasos

### 1️⃣ Iniciar el Servidor

El servidor ya está corriendo en tu sistema. Si no, ejecuta:

```bash
npm run dev
```

Abre tu navegador en: **http://localhost:3000**

---

### 2️⃣ Activar el Simulador

**Opción A: Interfaz Gráfica (Más Fácil)**

1. Busca el botón **🎮 Simulador** en la esquina inferior derecha
2. Click para expandir el panel
3. Selecciona un escenario (ej: "Normal")
4. Click en **▶ Iniciar**

¡Listo! Verás datos fluyendo en tiempo real.

**Opción B: Consola del Navegador**

1. Presiona `F12` para abrir DevTools
2. Ve a la pestaña "Console"
3. Escribe:

```javascript
simulator.start()
```

---

### 3️⃣ Explorar el Dashboard

Observa cómo se actualizan:

- **🔒 Seguridad de Carcasa**: LDR, IMU, Hall Effect
- **🌡️ Condiciones Ambientales**: Temperatura, Humedad, Presión
- **🧪 Sensores Químicos**: NH₃, TMA, Etileno con gráficas
- **🚨 Sistema de Alertas**: Aparecerán alertas según el escenario
- **🔐 Integridad de Datos**: Hash-chain al 100%
- **📱 Info del Dispositivo**: Batería, señal RSSI

---

## 🎭 Escenarios de Prueba

### Escenario 1: Todo Normal ✅

```javascript
simulator.setScenario('normal')
simulator.start()
```

Verás:
- Temperatura estable (~2°C)
- Sin alertas
- Hash-chain validando correctamente

---

### Escenario 2: Producto en Descomposición 🍖

```javascript
simulator.setScenario('degradation')
simulator.start()
```

Verás:
- NH₃ y TMA elevados
- Alertas de calidad alimentaria
- Gráficas mostrando tendencia ascendente

---

### Escenario 3: Apertura No Autorizada 🚨

```javascript
simulator.setScenario('security_breach')
simulator.start()
```

Verás:
- LDR detecta luz
- IMU detecta movimiento
- Alertas críticas de seguridad

---

### Escenario 4: Falla de Refrigeración ❄️

```javascript
simulator.setScenario('temperature_failure')
simulator.start()
```

Verás:
- Temperatura elevada
- **Inconsistencia Biológica** (alerta roja animada)
- NH₃ anormalmente alto para la temperatura

---

## 🎯 Puntos Clave a Observar

### 1. Hash-Chaining
- Mira el panel "🔐 Integridad de Datos"
- Debe mostrar 100% de integridad
- Bloques válidos en verde

### 2. Gráficas en Tiempo Real
- Se actualizan cada 5 segundos (por defecto)
- Mantienen últimas 20 lecturas
- Líneas de referencia para umbrales

### 3. Inconsistencia Biológica
- Solo se activa en escenario "temperature_failure"
- Alerta roja grande y animada
- Muestra NH₃ esperado vs real

### 4. Duty Cycles
- Visible en "Sensores Químicos"
- Contador de ciclos
- Tiempo hasta próxima lectura

---

## ⚙️ Ajustes Rápidos

### Cambiar Velocidad del Simulador

En el panel del simulador, usa el slider de "Intervalo" o:

```javascript
simulator.stop()
simulator.start(2000)  // Cada 2 segundos
```

### Cambiar Broker MQTT

1. Click en **⚙️ Configuración** (arriba a la derecha)
2. Ingresa URL de tu broker
3. Click "Aplicar y reconectar"

---

## 🛑 Detener el Simulador

**En UI:**
- Click en **⏸ Detener** en el panel del simulador

**En consola:**
```javascript
simulator.stop()
```

---

## 🔄 Reiniciar Todo

**En UI:**
- Click en 🔄 (botón de reset)

**En consola:**
```javascript
simulator.reset()
```

Esto:
- Detiene la simulación
- Reinicia secuencia a 0
- Limpia hash-chain
- Vuelve a escenario "normal"

---

## 📊 Interacción con las Alertas

1. Espera a que aparezcan alertas
2. Click en **filtros** (Todas, Críticas, Altas, etc.)
3. Click en **Reconocer** para marcar como vista
4. Activa **Mostrar reconocidas** para verlas de nuevo

---

## 💡 Tips

### Ver Mensajes del Sistema

Abre la consola (F12) para ver:
- 📤 Mensajes enviados por el simulador
- 📦 Mensajes recibidos por el dashboard
- ✅ Validaciones de hash-chain
- 🚨 Alertas generadas

### Probar Múltiples Escenarios

```javascript
// Script de testing completo
simulator.setScenario('normal')
simulator.start(3000)

setTimeout(() => {
  simulator.setScenario('degradation')
}, 30000)

setTimeout(() => {
  simulator.setScenario('security_breach')
}, 60000)

setTimeout(() => {
  simulator.stop()
}, 90000)
```

### Responsive Testing

1. Abre DevTools (F12)
2. Click en icono de dispositivo móvil
3. Prueba diferentes tamaños de pantalla

---

## 📚 Siguiente Nivel

Una vez que domines el simulador:

1. **Lee el README.md** → Documentación completa
2. **Revisa SIMULATOR_GUIDE.md** → Guía detallada de escenarios
3. **Explora ARDUINO_INTEGRATION.md** → Conecta hardware real
4. **Configura MQTT_BROKERS_CONFIG.md** → Broker personalizado
5. **Deploy DEPLOYMENT.md** → Lleva a producción

---

## ❓ FAQ Rápido

**P: ¿Por qué no veo datos?**
R: Asegúrate de que el simulador esté iniciado (botón ▶).

**P: ¿Las gráficas no se actualizan?**
R: Espera ~5 segundos, se actualizan automáticamente.

**P: ¿Cómo cambio el idioma?**
R: Actualmente solo español. Puedes modificar los textos en los componentes.

**P: ¿Funciona offline?**
R: Sí, el simulador funciona sin internet. Solo necesitas conexión si usas un broker MQTT externo.

**P: ¿Cuántos dispositivos puedo monitorear?**
R: Con el código actual, uno a la vez. Para múltiples dispositivos, necesitas modificar App.jsx.

---

## 🎓 Comandos Útiles del Simulador

```javascript
// Estado actual
simulator.isRunning        // true/false
simulator.scenarioMode     // 'normal', 'degradation', etc.
simulator.sequenceNumber   // Número de mensajes enviados

// Comandos
simulator.start(interval)  // Iniciar con intervalo en ms
simulator.stop()           // Detener
simulator.reset()          // Reiniciar todo
simulator.setScenario(mode) // Cambiar escenario
```

---

## 🎉 ¡Listo!

Ahora estás listo para:
- ✅ Explorar todas las funcionalidades
- ✅ Probar diferentes escenarios
- ✅ Entender el flujo de datos IoT
- ✅ Prepararte para integración con hardware real

**¿Dudas?** Revisa los archivos de documentación en la raíz del proyecto.

---

**Dashboard corriendo en:** http://localhost:3000

**Documentación completa:** README.md

**¡Disfruta monitoreando! 🚚📊**
