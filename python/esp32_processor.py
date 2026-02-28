"""
Script de Procesamiento Estadístico - Sistema de Hieleras IoT
=============================================================

Este script se conecta al Gateway ESP32 vía WebSocket y realiza:
1. Recepción de datos en tiempo real
2. Análisis estadístico de vida útil de alimentos
3. Generación de gráficas automáticas
4. Registro de trazabilidad en archivo log

Requisitos:
pip install websocket-client pandas matplotlib plotly openpyxl

Uso:
python esp32_processor.py

Autor: Sistema IoT Food Transport
Fecha: 2026
"""

import asyncio
import websocket
import json
import pandas as pd
import matplotlib.pyplot as plt
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime
import os
import logging
from pathlib import Path

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('hieleras_trazabilidad.log'),
        logging.StreamHandler()
    ]
)

class HieleraDataProcessor:
    """
    Procesador de datos de hieleras con análisis estadístico
    """
    
    def __init__(self, websocket_url="ws://localhost:8080"):
        self.websocket_url = websocket_url
        self.ws = None
        self.data_buffer = []
        self.hieleras_data = {}  # {id: DataFrame}
        self.is_running = False
        
        # Crear directorio para gráficas
        self.output_dir = Path("graficas_hieleras")
        self.output_dir.mkdir(exist_ok=True)
        
        # Parámetros de vida útil (días) según condiciones
        self.vida_util_optima = {
            'manzana': 90,
            'platano': 14,
            'aguacate': 21,
            'fresa': 7,
            'lechuga': 14
        }
        
        logging.info("📊 Procesador de Hieleras IoT inicializado")
        logging.info(f"📁 Gráficas se guardarán en: {self.output_dir.absolute()}")
    
    def on_message(self, ws, message):
        """Callback cuando llega un mensaje WebSocket"""
        try:
            data = json.loads(message)
            
            # Procesar según tipo de mensaje
            if data['type'] == 'sensor_update':
                self.process_sensor_data(data['data'])
            
            elif data['type'] == 'current_state':
                logging.info(f"📦 Estado actual recibido: {data['total']} hieleras activas")
                for hielera in data['hieleras']:
                    self.process_sensor_data(hielera)
            
            elif data['type'] == 'welcome':
                logging.info("✅ Conectado al servidor de hieleras")
                # Registrarse como cliente
                ws.send(json.dumps({'type': 'register', 'client': 'python_processor'}))
                
        except json.JSONDecodeError:
            logging.error(f"❌ Error decodificando JSON: {message}")
        except Exception as e:
            logging.error(f"❌ Error procesando mensaje: {e}")
    
    def process_sensor_data(self, data):
        """Procesar datos de sensor"""
        try:
            hielera_id = data['id']
            temp = data['temp']
            hum = data['hum']
            ethylene = data['ethylene']
            timestamp = datetime.now()
            
            # Crear registro
            record = {
                'timestamp': timestamp,
                'temperature': temp,
                'humidity': hum,
                'ethylene': ethylene
            }
            
            # Agregar al DataFrame de la hielera
            if hielera_id not in self.hieleras_data:
                self.hieleras_data[hielera_id] = pd.DataFrame()
            
            df = self.hieleras_data[hielera_id]
            new_row = pd.DataFrame([record])
            self.hieleras_data[hielera_id] = pd.concat([df, new_row], ignore_index=True)
            
            # Log de trazabilidad
            logging.info(
                f"📦 Hielera {hielera_id}: "
                f"Temp={temp:.1f}°C, Hum={hum:.1f}%, Eth={ethylene:.1f}ppm"
            )
            
            # Calcular vida útil estimada
            vida_util = self.calcular_vida_util(temp, hum, ethylene)
            logging.info(f"📊 Vida útil estimada: {vida_util:.1f} días")
            
            # Generar gráficas cada 10 registros
            if len(self.hieleras_data[hielera_id]) % 10 == 0:
                self.generar_graficas(hielera_id)
            
            # Guardar datos cada 20 registros
            if len(self.hieleras_data[hielera_id]) % 20 == 0:
                self.guardar_datos(hielera_id)
            
        except Exception as e:
            logging.error(f"❌ Error procesando datos de sensor: {e}")
    
    def calcular_vida_util(self, temp, hum, ethylene):
        """
        Calcular vida útil estimada de alimentos basado en condiciones
        
        Modelo simplificado:
        - Temperatura óptima: 0-4°C
        - Humedad óptima: 80-95%
        - Etileno bajo: <100 ppm
        
        Returns:
            float: Días de vida útil estimados
        """
        # Vida útil base (días) - ejemplo con manzanas
        vida_base = self.vida_util_optima['manzana']
        
        # Factor de temperatura (óptimo: 0-4°C)
        if 0 <= temp <= 4:
            factor_temp = 1.0
        elif temp < 0:
            factor_temp = 0.9 - (abs(temp) * 0.02)  # Congelación reduce calidad
        else:
            factor_temp = 1.0 - ((temp - 4) * 0.1)  # Temperatura alta acelera deterioro
        
        # Factor de humedad (óptimo: 80-95%)
        if 80 <= hum <= 95:
            factor_hum = 1.0
        elif hum < 80:
            factor_hum = 0.9 - ((80 - hum) * 0.01)  # Deshidratación
        else:
            factor_hum = 0.95 - ((hum - 95) * 0.02)  # Exceso de humedad
        
        # Factor de etileno (óptimo: <100 ppm)
        if ethylene < 100:
            factor_eth = 1.0
        elif ethylene < 200:
            factor_eth = 0.8
        else:
            factor_eth = 0.5  # Maduración acelerada
        
        # Calcular vida útil final
        vida_util = vida_base * factor_temp * factor_hum * factor_eth
        return max(0, vida_util)  # No puede ser negativa
    
    def generar_graficas(self, hielera_id):
        """Generar gráficas de tendencias"""
        try:
            df = self.hieleras_data[hielera_id]
            if df.empty or len(df) < 3:
                return
            
            # Crear figura con subplots
            fig = make_subplots(
                rows=2, cols=2,
                subplot_titles=(
                    f'Hielera {hielera_id} - Temperatura',
                    f'Hielera {hielera_id} - Humedad',
                    f'Hielera {hielera_id} - Etileno',
                    f'Hielera {hielera_id} - Vida Útil Estimada'
                )
            )
            
            # Temperatura
            fig.add_trace(
                go.Scatter(
                    x=df['timestamp'],
                    y=df['temperature'],
                    name='Temperatura',
                    line=dict(color='rgb(255, 127, 14)')
                ),
                row=1, col=1
            )
            
            # Humedad
            fig.add_trace(
                go.Scatter(
                    x=df['timestamp'],
                    y=df['humidity'],
                    name='Humedad',
                    line=dict(color='rgb(44, 160, 44)')
                ),
                row=1, col=2
            )
            
            # Etileno
            fig.add_trace(
                go.Scatter(
                    x=df['timestamp'],
                    y=df['ethylene'],
                    name='Etileno',
                    line=dict(color='rgb(214, 39, 40)')
                ),
                row=2, col=1
            )
            
            # Vida útil estimada
            vida_util_series = df.apply(
                lambda row: self.calcular_vida_util(
                    row['temperature'], row['humidity'], row['ethylene']
                ),
                axis=1
            )
            
            fig.add_trace(
                go.Scatter(
                    x=df['timestamp'],
                    y=vida_util_series,
                    name='Vida Útil',
                    line=dict(color='rgb(31, 119, 180)', width=3)
                ),
                row=2, col=2
            )
            
            # Configurar layout
            fig.update_xaxes(title_text="Tiempo", row=1, col=1)
            fig.update_xaxes(title_text="Tiempo", row=1, col=2)
            fig.update_xaxes(title_text="Tiempo", row=2, col=1)
            fig.update_xaxes(title_text="Tiempo", row=2, col=2)
            
            fig.update_yaxes(title_text="°C", row=1, col=1)
            fig.update_yaxes(title_text="%", row=1, col=2)
            fig.update_yaxes(title_text="ppm", row=2, col=1)
            fig.update_yaxes(title_text="Días", row=2, col=2)
            
            fig.update_layout(
                title_text=f"Análisis de Condiciones - Hielera {hielera_id}",
                showlegend=False,
                height=800
            )
            
            # Guardar gráfica
            filename = self.output_dir / f"hielera_{hielera_id}_analisis.html"
            fig.write_html(str(filename))
            logging.info(f"📈 Gráfica guardada: {filename}")
            
        except Exception as e:
            logging.error(f"❌ Error generando gráficas: {e}")
    
    def guardar_datos(self, hielera_id):
        """Guardar datos en archivo Excel"""
        try:
            df = self.hieleras_data[hielera_id]
            if df.empty:
                return
            
            # Agregar columna de vida útil
            df['vida_util_dias'] = df.apply(
                lambda row: self.calcular_vida_util(
                    row['temperature'], row['humidity'], row['ethylene']
                ),
                axis=1
            )
            
            # Guardar en Excel
            filename = self.output_dir / f"hielera_{hielera_id}_datos.xlsx"
            df.to_excel(filename, index=False, engine='openpyxl')
            logging.info(f"💾 Datos guardados: {filename}")
            
            # Generar reporte estadístico
            self.generar_reporte_estadistico(hielera_id, df)
            
        except Exception as e:
            logging.error(f"❌ Error guardando datos: {e}")
    
    def generar_reporte_estadistico(self, hielera_id, df):
        """Generar reporte estadístico en texto"""
        try:
            reporte = f"""
═══════════════════════════════════════════
REPORTE ESTADÍSTICO - HIELERA {hielera_id}
═══════════════════════════════════════════

Periodo: {df['timestamp'].min()} a {df['timestamp'].max()}
Total de registros: {len(df)}

TEMPERATURA:
  Media: {df['temperature'].mean():.2f}°C
  Desv. Est.: {df['temperature'].std():.2f}°C
  Mínima: {df['temperature'].min():.2f}°C
  Máxima: {df['temperature'].max():.2f}°C

HUMEDAD:
  Media: {df['humidity'].mean():.2f}%
  Desv. Est.: {df['humidity'].std():.2f}%
  Mínima: {df['humidity'].min():.2f}%
  Máxima: {df['humidity'].max():.2f}%

ETILENO:
  Media: {df['ethylene'].mean():.2f} ppm
  Desv. Est.: {df['ethylene'].std():.2f} ppm
  Mínimo: {df['ethylene'].min():.2f} ppm
  Máximo: {df['ethylene'].max():.2f} ppm

VIDA ÚTIL ESTIMADA:
  Media: {df['vida_util_dias'].mean():.2f} días
  Mínima: {df['vida_util_dias'].min():.2f} días
  Máxima: {df['vida_util_dias'].max():.2f} días

═══════════════════════════════════════════
"""
            
            # Guardar reporte
            filename = self.output_dir / f"hielera_{hielera_id}_reporte.txt"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(reporte)
            
            logging.info(f"📄 Reporte generado: {filename}")
            
        except Exception as e:
            logging.error(f"❌ Error generando reporte: {e}")
    
    def on_error(self, ws, error):
        """Callback de error"""
        logging.error(f"❌ Error WebSocket: {error}")
    
    def on_close(self, ws, close_status_code, close_msg):
        """Callback al cerrar conexión"""
        logging.info("🔌 Conexión WebSocket cerrada")
        self.is_running = False
    
    def on_open(self, ws):
        """Callback al abrir conexión"""
        logging.info("✅ Conexión WebSocket establecida")
        self.is_running = True
    
    def run(self):
        """Iniciar procesamiento"""
        logging.info(f"🚀 Conectando a {self.websocket_url}...")
        
        websocket.enableTrace(False)
        self.ws = websocket.WebSocketApp(
            self.websocket_url,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        
        # Ejecutar en loop infinito con reconexión automática
        while True:
            try:
                self.ws.run_forever()
                logging.info("⏳ Reconectando en 5 segundos...")
                import time
                time.sleep(5)
            except KeyboardInterrupt:
                logging.info("⏹️  Detenido por usuario")
                break
            except Exception as e:
                logging.error(f"❌ Error en loop principal: {e}")
                import time
                time.sleep(5)

def main():
    """Función principal"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║   Sistema de Procesamiento Estadístico - Hieleras IoT    ║
║                                                           ║
║   Conectando al Gateway ESP32 vía WebSocket...           ║
║   Las gráficas se generarán automáticamente              ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Conectar al backend Node.js (puerto 8080)
    # O directamente al Gateway ESP32 (por defecto porta 81)
    
    # Opción 1: A través del backend Node.js (recomendado)
    processor = HieleraDataProcessor("ws://localhost:8080")
    
    # Opción 2: Directo al Gateway ESP32 (si estás conectado a su WiFi)
    # processor = HieleraDataProcessor("ws://192.168.4.1:81")
    
    processor.run()

if __name__ == "__main__":
    main()
