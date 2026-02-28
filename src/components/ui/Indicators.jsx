/**
 * Componente para mostrar badges de estado con colores según severidad
 */
export const StatusBadge = ({ status, text }) => {
  const getColorClass = () => {
    switch (status?.toLowerCase()) {
      case 'critical':
        return 'badge-error';
      case 'high':
      case 'warning':
        return 'badge-warning';
      case 'medium':
        return 'badge-info';
      case 'low':
      case 'normal':
        return 'badge-success';
      default:
        return 'badge-info';
    }
  };

  return (
    <span className={`badge ${getColorClass()}`}>
      {text || status}
    </span>
  );
};

/**
 * Componente para indicador binario (encendido/apagado)
 */
export const BinaryIndicator = ({ active, label, activeText, inactiveText }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${
          active ? 'text-red-600' : 'text-green-600'
        }`}>
          {active ? activeText : inactiveText}
        </span>
        <div className={`w-2.5 h-2.5 rounded-full ${
          active ? 'bg-red-500' : 'bg-green-500'
        }`} />
      </div>
    </div>
  );
};

/**
 * Componente para mostrar valores numéricos con unidad
 */
export const MetricDisplay = ({ label, value, unit, status = 'normal' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="p-3 bg-gray-50 rounded border border-gray-200">
      <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-semibold ${getStatusColor()}`}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
};

/**
 * Componente para mostrar el progreso de un valor dentro de un rango
 */
export const ProgressBar = ({ value, min, max, label, thresholds }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  const getColor = () => {
    if (thresholds) {
      if (value >= thresholds.critical) return 'bg-red-500';
      if (value >= thresholds.warning) return 'bg-amber-500';
      if (value >= thresholds.normal) return 'bg-green-500';
    }
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-900 font-medium">{value.toFixed(1)}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Componente para mostrar timestamp formateado
 */
export const Timestamp = ({ time, label = 'Última lectura' }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="text-xs text-gray-500">
      {label}: <span className="text-gray-700">{formatTime(time)}</span>
    </div>
  );
};

/**
 * Spinner de carga
 */
export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
};

/**
 * Indicador de conexión
 */
export const ConnectionStatus = ({ connected, connecting }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        connected ? 'bg-green-500' : 
        connecting ? 'bg-amber-500' : 
        'bg-red-500'
      }`} />
      <span className="text-sm text-gray-600">
        {connected ? 'Conectado' : connecting ? 'Conectando...' : 'Desconectado'}
      </span>
    </div>
  );
};
