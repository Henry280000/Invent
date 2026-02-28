import { useState, useEffect, useRef } from 'react';
import mqttService from '../../services/mqttService';
import protobufService from '../../services/protobufService';
import hashChainService from '../../services/hashChainService';
import alertService from '../../services/alertService';

// Componentes
import { SecurityCard } from '../sensors/SecurityCard';
import { EnvironmentalCard } from '../sensors/EnvironmentalCard';
import { ChemicalCard } from '../sensors/ChemicalCard';
import { AlertSystem } from '../alerts/AlertSystem';
import { HashChainViewer } from '../monitoring/HashChainViewer';
import { DeviceInfo } from '../monitoring/DeviceInfo';
import { LoadingSpinner } from '../ui/Indicators';
import { SimulatorControls } from '../ui/SimulatorControls';

/**
 * Dashboard principal de monitoreo IoT
 */
export const MainDashboard = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado de datos
  const [currentData, setCurrentData] = useState(null);
  const [dataHistory, setDataHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [chainStats, setChainStats] = useState(null);
  const [recentBlocks, setRecentBlocks] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Configuración MQTT
  const [mqttConfig, setMqttConfig] = useState({
    url: 'ws://broker.emqx.io:8083/mqtt',
    username: '',
    password: '',
    clientId: ''
  });

  const [showConfig, setShowConfig] = useState(false);
  const initialized = useRef(false);

  // Inicialización
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeServices = async () => {
      try {
        console.log('🚀 Initializing services...');
        
        // Inicializar Protobuf
        await protobufService.initialize();
        
        // Conectar a MQTT
        await mqttService.connect(mqttConfig);

        // Suscribirse a mensajes
        const unsubscribe = mqttService.onMessage((message) => {
          handleMqttMessage(message);
        });

        setLoading(false);

        return () => {
          unsubscribe();
          mqttService.disconnect();
        };
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejar mensajes MQTT entrantes
  const handleMqttMessage = (message) => {
    console.log('📨 Message received:', message.type);

    if (message.type === 'connection') {
      setConnected(message.status === 'connected');
    } else if (message.type === 'error') {
      setError(message.error);
    } else if (message.type === 'data') {
      const { data } = message;
      
      // Actualizar datos actuales
      setCurrentData(data);
      setLastUpdate(message.receivedAt);

      // Agregar al historial (mantener últimos 100)
      setDataHistory(prev => {
        const updated = [...prev, data];
        return updated.slice(-100);
      });

      // Actualizar estadísticas de hash chain
      setChainStats(hashChainService.getChainStats());
      setRecentBlocks(hashChainService.getRecentBlocks(10));

      // Analizar y generar alertas
      const newAlerts = alertService.analyzeSensorData(data);
      if (newAlerts.length > 0) {
        console.log(`🚨 ${newAlerts.length} new alerts generated`);
        setAlerts(alertService.getAlerts());
      }
    }
  };

  // Reconocer alerta
  const handleAcknowledgeAlert = (alertId) => {
    alertService.acknowledgeAlert(alertId);
    setAlerts(alertService.getAlerts());
  };

  // Reconectar MQTT
  const handleReconnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await mqttService.disconnect();
      await mqttService.connect(mqttConfig);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Actualizar configuración MQTT
  const handleUpdateMqttConfig = async (newConfig) => {
    setMqttConfig(newConfig);
    setShowConfig(false);
    await handleReconnect();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Inicializando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Panel de configuración */}
      {showConfig && (
        <div className="card">
          <h3 className="font-semibold mb-3">Configuración de Broker MQTT</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="URL del broker"
              value={mqttConfig.url}
              onChange={(e) => setMqttConfig({ ...mqttConfig, url: e.target.value })}
              className="px-3 py-2 bg-white border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Client ID (opcional)"
              value={mqttConfig.clientId}
              onChange={(e) => setMqttConfig({ ...mqttConfig, clientId: e.target.value })}
              className="px-3 py-2 bg-white border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Usuario (opcional)"
              value={mqttConfig.username}
              onChange={(e) => setMqttConfig({ ...mqttConfig, username: e.target.value })}
              className="px-3 py-2 bg-white border border-gray-300 rounded text-sm"
            />
            <input
              type="password"
              placeholder="Contraseña (opcional)"
              value={mqttConfig.password}
              onChange={(e) => setMqttConfig({ ...mqttConfig, password: e.target.value })}
              className="px-3 py-2 bg-white border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => handleUpdateMqttConfig(mqttConfig)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              Aplicar y reconectar
            </button>
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Topic: <code className="text-blue-700">food/transport/sensors/+</code>
          </p>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border-red-500">
          <p className="text-red-700 font-semibold">Error: {error}</p>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sensores de Seguridad */}
          <SecurityCard data={currentData?.security} />

          {/* Sensores Ambientales */}
          <EnvironmentalCard 
            data={currentData?.environmental} 
            history={dataHistory}
          />

          {/* Sensores Químicos */}
          <ChemicalCard 
            data={currentData?.chemical}
            history={dataHistory}
            environmental={currentData?.environmental}
          />
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Información del Dispositivo */}
          <DeviceInfo 
            data={currentData}
            connected={connected}
            lastUpdate={lastUpdate}
          />

          {/* Hash Chain Viewer */}
          <HashChainViewer 
            chainStats={chainStats}
            recentBlocks={recentBlocks}
          />
        </div>
      </div>

      {/* Sistema de Alertas (ancho completo) */}
      <div className="mt-4">
        <AlertSystem 
          alerts={alerts}
          onAcknowledge={handleAcknowledgeAlert}
        />
      </div>

      {/* Controles del Simulador (flotante) */}
      <SimulatorControls />
    </div>
  );
};
