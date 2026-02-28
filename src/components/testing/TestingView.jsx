import { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

/**
 * Vista de Testing para ESP32 Nodo Test con Botón
 * Muestra datos del dispositivo de prueba (ID 99)
 */
const TestingView = () => {
  const [stats, setStats] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [recentData, setRecentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadAllData();
    
    // Auto-actualizar cada 5 segundos
    const interval = setInterval(() => {
      loadAllData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsData, latestReading, recentReadings] = await Promise.all([
        apiService.getTestingStats(),
        apiService.getTestingLatest(),
        apiService.getTestingData(20)
      ]);

      setStats(statsData);
      setLatestData(latestReading);
      setRecentData(recentReadings);
      setError('');
    } catch (err) {
      setError('Error cargando datos de testing');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar TODOS los datos de testing?')) {
      return;
    }

    try {
      setClearing(true);
      await apiService.clearTestingData();
      alert('Datos de testing eliminados correctamente');
      loadAllData();
    } catch (err) {
      alert('Error al eliminar datos: ' + err.message);
    } finally {
      setClearing(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      default:
        return '🟢';
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos de testing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🔘</span>
                <h1 className="text-3xl font-bold text-gray-900">
                  Modo Testing ESP32
                </h1>
              </div>
              <p className="text-gray-600">
                Monitoreo del nodo de prueba con botón (ID: 99)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadAllData}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                <i className="fa-solid fa-rotate"></i>
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
              {stats?.total_readings > 0 && (
                <button
                  onClick={handleClearData}
                  disabled={clearing}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <i className="fa-solid fa-trash"></i>
                  {clearing ? 'Eliminando...' : 'Limpiar Datos'}
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <i className="fa-solid fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}

        {/* Alert de modo testing */}
        <div className="mb-6 p-6 bg-amber-50 border-2 border-amber-300 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="font-bold text-amber-900 text-lg mb-2">
                Modo de Prueba Activo
              </h3>
              <p className="text-amber-800 mb-2">
                Esta vista muestra datos del <strong>ESP32 Nodo Test con Botón</strong>. 
                Los datos son simulados y se generan al presionar el botón físico.
              </p>
              <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                <li>ID de Hielera: <strong>99</strong> (identificador especial de testing)</li>
                <li>Datos generados: Al presionar botón físico en ESP32</li>
                <li>Valores: Simulados pero realistas para verificar comunicación</li>
                <li>Propósito: Verificar ESP-NOW, Gateway, Backend y Frontend</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Lecturas</span>
                <i className="fa-solid fa-database text-blue-500"></i>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.total_readings.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Presiones de botón</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Últimas 24h</span>
                <i className="fa-solid fa-clock text-green-500"></i>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.readings_24h}
              </p>
              <p className="text-xs text-gray-500 mt-1">Lecturas recientes</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Estado Actual</span>
                <i className="fa-solid fa-circle-check text-green-500"></i>
              </div>
              <p className="text-xl font-bold text-green-600">
                {latestData?.hasData ? 'Activo' : 'Sin datos'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {latestData?.hasData ? formatTimestamp(latestData.data.temperature?.timestamp) : 'Esperando primera lectura'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Tiempo Activo</span>
                <i className="fa-solid fa-calendar text-purple-500"></i>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {stats.first_reading ? (
                  new Date(stats.first_reading).toLocaleDateString('es-MX')
                ) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Primera lectura</p>
            </div>
          </div>
        )}

        {/* Última Lectura */}
        {latestData?.hasData && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Última Lectura del Botón
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Temperatura */}
              {latestData.data.temperature && (
                <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">🌡️</span>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      TEMPERATURA
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-gray-900 mb-1">
                    {latestData.data.temperature.value.toFixed(1)}
                    <span className="text-2xl text-gray-500 ml-1">
                      {latestData.data.temperature.unit}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(latestData.data.temperature.timestamp)}
                  </p>
                </div>
              )}

              {/* Humedad */}
              {latestData.data.humidity && (
                <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-cyan-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">💧</span>
                    <span className="text-sm font-medium text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
                      HUMEDAD
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-gray-900 mb-1">
                    {latestData.data.humidity.value.toFixed(1)}
                    <span className="text-2xl text-gray-500 ml-1">
                      {latestData.data.humidity.unit}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(latestData.data.humidity.timestamp)}
                  </p>
                </div>
              )}

              {/* Etileno */}
              {latestData.data.ethylene && (
                <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">🍃</span>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      ETILENO
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-gray-900 mb-1">
                    {latestData.data.ethylene.value.toFixed(1)}
                    <span className="text-2xl text-gray-500 ml-1">
                      {latestData.data.ethylene.unit}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(latestData.data.ethylene.timestamp)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Promedios */}
        {stats?.averages && Object.keys(stats.averages).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Promedios (Última Hora)
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sensor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promedio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Máximo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lecturas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(stats.averages).map(([type, data]) => (
                    <tr key={type} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 capitalize">
                          {type === 'temperature' ? '🌡️ Temperatura' : 
                           type === 'humidity' ? '💧 Humedad' : 
                           '🍃 Etileno'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-bold">{data.avg}</td>
                      <td className="px-6 py-4 text-gray-600">{data.min}</td>
                      <td className="px-6 py-4 text-gray-600">{data.max}</td>
                      <td className="px-6 py-4 text-gray-500">{data.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Historial Reciente */}
        {recentData?.rawData && recentData.rawData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📜</span>
              Historial Reciente (Últimas 20 lecturas)
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentData.rawData.slice(0, 20).map((reading, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatTimestamp(reading.recorded_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {reading.sensor_type === 'temperature' ? '🌡️ Temperatura' :
                             reading.sensor_type === 'humidity' ? '💧 Humedad' :
                             '🍃 Etileno'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">
                            {parseFloat(reading.sensor_value).toFixed(2)} {reading.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reading.severity)}`}>
                            {getSeverityIcon(reading.severity)}
                            {reading.severity || 'normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de Severidad */}
        {stats?.severity_summary && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Resumen de Estado (Últimas 24h)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-1">Normal</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.severity_summary.normal || 0}
                    </p>
                  </div>
                  <span className="text-5xl">🟢</span>
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-800 mb-1">Advertencia</p>
                    <p className="text-3xl font-bold text-amber-600">
                      {stats.severity_summary.warning || 0}
                    </p>
                  </div>
                  <span className="text-5xl">🟡</span>
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Crítico</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.severity_summary.critical || 0}
                    </p>
                  </div>
                  <span className="text-5xl">🔴</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sin datos */}
        {(!stats || stats.total_readings === 0) && (
          <div className="bg-white p-12 rounded-lg shadow-sm border-2 border-dashed border-gray-300 text-center">
            <span className="text-6xl mb-4 block">🔘</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No hay datos de testing todavía
            </h3>
            <p className="text-gray-600 mb-4">
              Presiona el botón en tu ESP32 Nodo Test para generar datos simulados
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left max-w-md mx-auto">
              <p className="text-sm font-medium text-blue-900 mb-2">Instrucciones:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Asegúrate de que el Gateway esté encendido</li>
                <li>Verifica que el Nodo Test esté conectado</li>
                <li>Presiona el botón físico en el ESP32</li>
                <li>Los datos aparecerán aquí automáticamente</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestingView;
