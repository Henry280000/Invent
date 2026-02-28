import { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

const IoTDataView = () => {
  const [stats, setStats] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('temperature');
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = [
    { id: 'temperature', name: 'Temperatura', unit: '°C' },
    { id: 'humidity', name: 'Humedad', unit: '%' },
    { id: 'pressure', name: 'Presión', unit: 'hPa' },
    { id: 'gas', name: 'Gases', unit: 'ppm' },
    { id: 'motion', name: 'Movimiento', unit: '' },
    { id: 'light', name: 'Luz', unit: '' },
    { id: 'location', name: 'Ubicación', unit: '' },
  ];

  const getCategoryIcon = (categoryId) => {
    const icons = {
      temperature: <i className="fa-solid fa-temperature-half"></i>,
      humidity: <i className="fa-solid fa-droplet"></i>,
      pressure: <i className="fa-solid fa-gauge"></i>,
      gas: <i className="fa-solid fa-smog"></i>,
      motion: <i className="fa-solid fa-person-walking"></i>,
      light: <i className="fa-solid fa-lightbulb"></i>,
      location: <i className="fa-solid fa-location-dot"></i>,
    };
    return icons[categoryId] || null;
  };

  useEffect(() => {
    loadStats();
    loadCategoryData(selectedCategory);
    
    // Actualizar cada 10 segundos
    const interval = setInterval(() => {
      loadStats();
      loadCategoryData(selectedCategory);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedCategory]);

  const loadStats = async () => {
    try {
      const data = await apiService.getIotStats();
      setStats(data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const loadCategoryData = async (category) => {
    try {
      setLoading(true);
      const data = await apiService.getIotByCategory(category, 20);
      setCategoryData(data.data || []);
      setError('');
    } catch (err) {
      setError('Error cargando datos de sensores');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      normal: 'bg-green-100 text-green-800',
      warning: 'bg-amber-100 text-amber-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      normal: 'Normal',
      warning: 'Advertencia',
      critical: 'Crítico',
    };
    return labels[severity] || severity;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return date.toLocaleDateString('es-MX');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-blue-600"></i> Datos IoT en Tiempo Real
        </h2>
        <p className="text-gray-600">
          Monitoreo y clasificación automática de sensores
        </p>
      </div>

      {/* Estadísticas Generales */}
      {stats && stats.totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Dispositivos Activos</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totals.total_devices || 0}
                </p>
              </div>
              <div className="text-4xl text-blue-600"><i className="fa-solid fa-mobile-screen-button"></i></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Lecturas (última hora)</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totals.total_readings || 0}
                </p>
              </div>
              <div className="text-4xl text-green-600"><i className="fa-solid fa-chart-line"></i></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Camiones Monitoreados</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.totals.total_trucks || 0}
                </p>
              </div>
              <div className="text-4xl text-purple-600"><i className="fa-solid fa-truck-fast"></i></div>
            </div>
          </div>
        </div>
      )}

      {/* Clasificaciones por Severidad */}
      {stats && stats.classifications && stats.classifications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Clasificación por Severidad (última hora)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.classifications.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${getSeverityColor(item.severity)}`}
              >
                <p className="text-sm font-medium capitalize">{item.category}</p>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs">{getSeverityLabel(item.severity)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selector de Categoría */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Datos por Categoría
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryIcon(cat.id)} {cat.name}
            </button>
          ))}
        </div>

        {/* Datos de la Categoría Seleccionada */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Cargando datos de sensores...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : categoryData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay datos disponibles para esta categoría
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Dispositivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Camión
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Severidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryData.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {reading.device_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {reading.truck_id || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {reading.sensor_type}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {reading.sensor_value?.toFixed(2)} {reading.unit || ''}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                          reading.severity
                        )}`}
                      >
                        {getSeverityLabel(reading.severity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatTimestamp(reading.recorded_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ubicaciones (si la categoría es location) */}
      {selectedCategory === 'location' && categoryData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-map-location-dot text-blue-600"></i> Ubicaciones Recientes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryData
              .filter((r) => r.location_lat && r.location_lng)
              .slice(0, 4)
              .map((reading) => (
                <div
                  key={reading.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {reading.device_id}
                      </p>
                      <p className="text-sm text-gray-600">
                        {reading.truck_id || 'Sin camión asignado'}
                      </p>
                    </div>
                    <span className="text-2xl text-red-600"><i className="fa-solid fa-location-dot"></i></span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Lat:</span>{' '}
                      <span className="font-orbitron">{reading.location_lat?.toFixed(6)}</span>
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Lng:</span>{' '}
                      <span className="font-orbitron">{reading.location_lng?.toFixed(6)}</span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatTimestamp(reading.recorded_at)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IoTDataView;
