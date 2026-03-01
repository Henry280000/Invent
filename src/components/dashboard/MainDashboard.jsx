import { useState, useEffect, useRef } from 'react';
import apiService from '../../services/apiService';

// Componentes
import { LoadingSpinner } from '../ui/Indicators';

/**
 * Dashboard principal de monitoreo IoT
 */
export const MainDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado de datos en tiempo real
  const [stats, setStats] = useState(null);
  const [temperatureData, setTemperatureData] = useState([]);
  const [humidityData, setHumidityData] = useState([]);
  const [ethyleneData, setEthyleneData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  const initialized = useRef(false);

  // Cargar datos desde MySQL
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar estadísticas
        const statsData = await apiService.getIotStats();
        setStats(statsData);
        
        // Cargar últimas 10 lecturas de cada tipo
        const tempData = await apiService.getIotByCategory('temperature', 10);
        setTemperatureData(tempData.data || []);
        
        const humData = await apiService.getIotByCategory('humidity', 10);
        setHumidityData(humData.data || []);
        
        const ethData = await apiService.getIotByCategory('ethylene', 10);
        setEthyleneData(ethData.data || []);
        
        setLastUpdate(new Date());
        setLoading(false);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();

    // Actualizar cada 10 segundos
    const interval = setInterval(loadData, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getLatestValue = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return null;
    return dataArray[0];
  };

  const getAverageValue = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return 0;
    const sum = dataArray.reduce((acc, item) => acc + parseFloat(item.sensor_value), 0);
    return (sum / dataArray.length).toFixed(2);
  };

  const getSeverityColor = (severity) => {
    const normalizedSeverity = severity ? severity.toLowerCase() : 'normal';
    const colors = {
      normal: 'text-green-600',
      warning: 'text-amber-600',
      critical: 'text-red-600',
    };
    return colors[normalizedSeverity] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const latestTemp = getLatestValue(temperatureData);
  const latestHum = getLatestValue(humidityData);
  const latestEth = getLatestValue(ethyleneData);

  return (
    <div className="space-y-6">
      {/* Mensaje informativo */}
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <p className="text-blue-900 font-semibold mb-1">Monitoreo en Tiempo Real</p>
            <p className="text-blue-800 text-sm">
              Datos actualizándose automáticamente cada 10 segundos desde MySQL. 
              Cuando te conectes al Gateway WiFi (ESP32-Gateway-Hieleras), el simulador 
              generará nuevos datos cada 30 segundos.
            </p>
            {lastUpdate && (
              <p className="text-blue-700 text-xs mt-2">
                ⏱️ Última actualización: {formatTimestamp(lastUpdate)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas Generales */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Dispositivos Activos</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totals?.total_devices || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Lecturas (última hora)</p>
              <p className="text-3xl font-bold text-green-600">{stats.totals?.total_readings || 0}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Camiones Monitoreados</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totals?.total_trucks || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de Sensores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temperatura */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-temperature-half text-red-500"></i>
              Temperatura
            </h3>
          </div>
          
          {latestTemp ? (
            <>
              <div className="mb-4">
                <p className="text-4xl font-bold text-gray-900">
                  {parseFloat(latestTemp.sensor_value).toFixed(2)} <span className="text-2xl text-gray-600">°C</span>
                </p>
                <p className={`text-sm font-medium ${getSeverityColor(latestTemp.severity)}`}>
                  {latestTemp.severity}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimestamp(latestTemp.recorded_at)}
                </p>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600">Promedio últimas 10 lecturas:</p>
                <p className="text-lg font-semibold text-gray-800">{getAverageValue(temperatureData)} °C</p>
              </div>
              
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-gray-700">Últimas lecturas:</p>
                {temperatureData.slice(0, 5).map((reading, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-600">
                    <span>{formatTimestamp(reading.recorded_at)}</span>
                    <span className="font-medium">{parseFloat(reading.sensor_value).toFixed(2)} °C</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500">Sin datos</p>
          )}
        </div>

        {/* Humedad */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-droplet text-blue-500"></i>
              Humedad
            </h3>
          </div>
          
          {latestHum ? (
            <>
              <div className="mb-4">
                <p className="text-4xl font-bold text-gray-900">
                  {parseFloat(latestHum.sensor_value).toFixed(2)} <span className="text-2xl text-gray-600">%</span>
                </p>
                <p className={`text-sm font-medium ${getSeverityColor(latestHum.severity)}`}>
                  {latestHum.severity}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimestamp(latestHum.recorded_at)}
                </p>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600">Promedio últimas 10 lecturas:</p>
                <p className="text-lg font-semibold text-gray-800">{getAverageValue(humidityData)} %</p>
              </div>
              
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-gray-700">Últimas lecturas:</p>
                {humidityData.slice(0, 5).map((reading, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-600">
                    <span>{formatTimestamp(reading.recorded_at)}</span>
                    <span className="font-medium">{parseFloat(reading.sensor_value).toFixed(2)} %</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500">Sin datos</p>
          )}
        </div>

        {/* Etileno */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-smog text-purple-500"></i>
              Etileno
            </h3>
          </div>
          
          {latestEth ? (
            <>
              <div className="mb-4">
                <p className="text-4xl font-bold text-gray-900">
                  {parseFloat(latestEth.sensor_value).toFixed(2)} <span className="text-2xl text-gray-600">ppm</span>
                </p>
                <p className={`text-sm font-medium ${getSeverityColor(latestEth.severity)}`}>
                  {latestEth.severity}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimestamp(latestEth.recorded_at)}
                </p>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600">Promedio últimas 10 lecturas:</p>
                <p className="text-lg font-semibold text-gray-800">{getAverageValue(ethyleneData)} ppm</p>
              </div>
              
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-gray-700">Últimas lecturas:</p>
                {ethyleneData.slice(0, 5).map((reading, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-600">
                    <span>{formatTimestamp(reading.recorded_at)}</span>
                    <span className="font-medium">{parseFloat(reading.sensor_value).toFixed(2)} ppm</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500">Sin datos</p>
          )}
        </div>
      </div>

      {/* Información del dispositivo */}
      {latestTemp && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Dispositivo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Device ID</p>
              <p className="font-semibold text-gray-900">{latestTemp.device_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Truck ID</p>
              <p className="font-semibold text-gray-900">{latestTemp.truck_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <p className="font-semibold text-green-600">● Activo</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Última Lectura</p>
              <p className="font-semibold text-gray-900">{formatTimestamp(latestTemp.recorded_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
