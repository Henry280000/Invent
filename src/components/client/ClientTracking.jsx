import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';

export const ClientTracking = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClientShipments();
    const interval = setInterval(loadClientShipments, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadClientShipments = async () => {
    try {
      const data = await apiService.getShipments();
      // El backend ya filtra por cliente si es necesario
      setShipments(data.shipments || []);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar envíos: ' + err.message);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'en_ruta': 'text-blue-600 bg-blue-50',
      'entregado': 'text-green-600 bg-green-50',
      'detenido': 'text-amber-600 bg-amber-50',
      'cancelado': 'text-red-600 bg-red-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'en_ruta': 'En Ruta',
      'entregado': 'Entregado',
      'detenido': 'Detenido',
      'cancelado': 'Cancelado',
    };
    return labels[status] || status;
  };

  const getTimeRemaining = (estimatedArrival) => {
    const now = new Date();
    const arrival = new Date(estimatedArrival);
    const diff = arrival - now;
    
    if (diff < 0) return 'Vencido';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tracking de Envíos</h2>
        <p className="text-gray-600 text-sm">Monitorea tus productos en tiempo real</p>
      </div>

      {error && (
        <div className="card bg-red-50 border-red-500">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Cargando envíos...</p>
        </div>
      ) : shipments.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay envíos activos</h3>
          <p className="text-gray-500 text-sm">Tus envíos aparecerán aquí cuando sean creados</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {shipments.map((shipment) => (
            <div key={shipment.id} className="card">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{shipment.truckId}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shipment.status)}`}>
                      {getStatusLabel(shipment.status)}
                    </span>
                  </div>
                  <p className="text-gray-600">{shipment.product}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">ID del Envío</p>
                  <p className="font-mono text-xs text-gray-700">#{shipment.id}</p>
                </div>
              </div>

              {/* Ruta */}
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Origen</p>
                    <p className="font-semibold text-gray-900">{shipment.origin}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-px bg-gray-300 w-16"></div>
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="h-px bg-gray-300 w-16"></div>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-gray-500 mb-1">Destino</p>
                    <p className="font-semibold text-gray-900">{shipment.destination}</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas de sensor */}
              {shipment.sensorData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-xs text-blue-600 mb-1">Temperatura</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {shipment.sensorData.temperature.toFixed(1)}°C
                    </p>
                    <p className="text-xs text-blue-600 mt-1">DHT22</p>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-xs text-green-600 mb-1">Humedad</p>
                    <p className="text-2xl font-bold text-green-900">
                      {shipment.sensorData.humidity.toFixed(1)}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">DHT22</p>
                  </div>
                  <div className="bg-amber-50 rounded p-3">
                    <p className="text-xs text-amber-600 mb-1">Tiempo Restante</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {getTimeRemaining(shipment.estimatedArrival)}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">ETA</p>
                  </div>
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-xs text-purple-600 mb-1">Estado</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {shipment.status === 'en_ruta' ? '✓' : '●'}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Monitoreo</p>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-200 pt-4">
                <div>
                  <p className="text-gray-500 mb-1">Llegada Estimada</p>
                  <p className="font-medium text-gray-900">
                    {new Date(shipment.estimatedArrival).toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Última Actualización</p>
                  <p className="font-medium text-gray-900">
                    {shipment.sensorData?.lastUpdate 
                      ? new Date(shipment.sensorData.lastUpdate).toLocaleTimeString('es-ES')
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {/* Ubicación simulada */}
              {shipment.currentLocation && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Ubicación GPS Aproximada</p>
                  <div className="bg-gray-100 rounded p-3 font-mono text-xs text-gray-700">
                    Lat: {shipment.currentLocation.lat.toFixed(4)}, Lng: {shipment.currentLocation.lng.toFixed(4)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
