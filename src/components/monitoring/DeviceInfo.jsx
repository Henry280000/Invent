import { MetricDisplay, ConnectionStatus, Timestamp } from '../ui/Indicators';

/**
 * Componente de información del dispositivo
 */
export const DeviceInfo = ({ data, connected, lastUpdate }) => {
  if (!data) {
    return (
      <div className="card">
        <h2 className="card-header font-josefin">Información del Dispositivo (Arduino/ESP32 + LoRaWAN)</h2>
        <p className="text-gray-500 text-center py-4">Esperando datos...</p>
        <div className="mt-4">
          <ConnectionStatus connected={connected} connecting={!connected} />
        </div>
      </div>
    );
  }

  const { device_id, sequence_number, battery_voltage, signal_strength } = data;

  const getBatteryStatus = (voltage) => {
    if (voltage >= 3.7) return 'success';
    if (voltage >= 3.3) return 'warning';
    return 'critical';
  };

  const getSignalStatus = (rssi) => {
    if (rssi >= -80) return 'success';
    if (rssi >= -100) return 'warning';
    return 'critical';
  };

  const batteryPercentage = battery_voltage ? 
    Math.min(Math.max(((battery_voltage - 3.0) / (4.2 - 3.0)) * 100, 0), 100) : 0;

  return (
    <div className="card">
      <h2 className="card-header">Información del Dispositivo (Arduino/ESP32 + LoRaWAN)
        <ConnectionStatus connected={connected} />
      </h2>

      {/* ID del dispositivo */}
      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">ID de Dispositivo</p>
        <p className="text-sm font-mono text-blue-700">{device_id || 'N/A'}</p>
      </div>

      {/* Métricas del dispositivo */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricDisplay
          label="Batería (LiPo 3.7V)"
          value={battery_voltage || 0}
          unit="V"
          status={getBatteryStatus(battery_voltage)}
        />
        <MetricDisplay
          label="Señal (LoRaWAN)"
          value={signal_strength || 0}
          unit="dBm RSSI"
          status={getSignalStatus(signal_strength)}
        />
      </div>

      {/* Indicador de batería visual */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Nivel de batería</span>
          <span className="text-xs text-gray-700">{batteryPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              batteryPercentage >= 60 ? 'bg-green-500' :
              batteryPercentage >= 30 ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ width: `${batteryPercentage}%` }}
          />
        </div>
      </div>

      {/* Información de transmisión */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Secuencia</p>
          <p className="text-lg font-bold text-gray-900">#{sequence_number || 0}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Protocolo</p>
          <p className="text-sm font-semibold text-blue-700">LoRaWAN</p>
        </div>
      </div>

      {/* Última actualización */}
      {lastUpdate && (
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <Timestamp time={lastUpdate} label="Última actualización" />
        </div>
      )}

      {/* Advertencias */}
      {battery_voltage < 3.3 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded">
          <p className="text-amber-700 text-xs">
            Batería baja. Considerar reemplazo pronto.
          </p>
        </div>
      )}
      {signal_strength < -100 && (
        <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded">
          <p className="text-red-700 text-xs">
            Señal débil. Posible pérdida de datos.
          </p>
        </div>
      )}

      {/* Info técnica */}
      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600">
        <p className="mb-1"><strong>Carcasa:</strong> IP65 (resistente a polvo y agua)</p>
        <p><strong>Comunicación:</strong> LoRaWAN → MQTT/WebSocket → Dashboard</p>
      </div>
    </div>
  );
};
