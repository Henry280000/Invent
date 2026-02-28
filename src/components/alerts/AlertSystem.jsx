import { StatusBadge, Timestamp } from '../ui/Indicators';
import { useState } from 'react';

/**
 * Componente de Sistema de Alertas
 */
export const AlertSystem = ({ alerts, onAcknowledge }) => {
  const [filter, setFilter] = useState('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'CRÍTICA';
      case 'HIGH': return 'ALTA';
      case 'MEDIUM': return 'MEDIA';
      case 'LOW': return 'BAJA';
      default: return severity;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'SECURITY': return 'Seguridad';
      case 'ENVIRONMENTAL': return 'Ambiental';
      case 'CHEMICAL': return 'Química';
      case 'FOOD_QUALITY': return 'Calidad';
      case 'BIOLOGICAL': return 'Biológica';
      default: return category;
    }
  };

  const filteredAlerts = alerts
    .filter(alert => filter === 'all' || alert.severity === filter)
    .filter(alert => showAcknowledged || !alert.acknowledged)
    .sort((a, b) => b.timestamp - a.timestamp);

  const alertCounts = {
    critical: alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length,
    high: alerts.filter(a => a.severity === 'HIGH' && !a.acknowledged).length,
    medium: alerts.filter(a => a.severity === 'MEDIUM' && !a.acknowledged).length,
    low: alerts.filter(a => a.severity === 'LOW' && !a.acknowledged).length,
  };

  return (
    <div className="card">
      <h2 className="card-header font-josefin">Sistema de Alertas (Análisis Multi-Sensor)
        {alertCounts.critical > 0 && (
          <span className="ml-auto badge-error">
            {alertCounts.critical} CRÍTICAS
          </span>
        )}
      </h2>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          Todas ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('CRITICAL')}
          className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
            filter === 'CRITICAL'
              ? 'bg-red-600 text-white border-red-600' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          Críticas ({alertCounts.critical})
        </button>
        <button
          onClick={() => setFilter('HIGH')}
          className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
            filter === 'HIGH'
              ? 'bg-amber-600 text-white border-amber-600' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          Altas ({alertCounts.high})
        </button>
        <button
          onClick={() => setFilter('MEDIUM')}
          className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
            filter === 'MEDIUM'
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          Medias ({alertCounts.medium})
        </button>
        <label className="flex items-center gap-2 ml-auto">
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-gray-600">Mostrar reconocidas</span>
        </label>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay alertas {filter !== 'all' && filter}</p>
            <p className="text-sm text-gray-600 mt-1">Sistema funcionando normalmente</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded border-l-4 ${
                alert.acknowledged 
                  ? 'bg-gray-100 border-gray-400 opacity-60' 
                  : alert.severity === 'CRITICAL'
                  ? 'bg-red-50 border-red-500'
                  : alert.severity === 'HIGH'
                  ? 'bg-amber-50 border-amber-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-gray-900">{alert.title}</h3>
                      <StatusBadge status={alert.severity} text={getSeverityLabel(alert.severity)} />
                      <span className="text-xs text-gray-500">{getCategoryLabel(alert.category)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                    <Timestamp time={alert.timestamp} label="Detectada" />
                    {alert.acknowledged && (
                      <p className="text-xs text-green-600 mt-1">
                        Reconocida {new Date(alert.acknowledgedAt).toLocaleTimeString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
                {!alert.acknowledged && onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    Reconocer
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Estadísticas */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-red-600">{alertCounts.critical}</p>
              <p className="text-xs text-gray-600">Críticas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{alertCounts.high}</p>
              <p className="text-xs text-gray-600">Altas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{alertCounts.medium}</p>
              <p className="text-xs text-gray-600">Medias</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{alertCounts.low}</p>
              <p className="text-xs text-gray-600">Bajas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
