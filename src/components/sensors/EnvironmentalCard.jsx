import { MetricDisplay, ProgressBar, Timestamp } from '../ui/Indicators';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Tarjeta de datos ambientales (temperatura, humedad, presión)
 */
export const EnvironmentalCard = ({ data, history = [] }) => {
  if (!data) {
    return (
      <div className="card">
        <h2 className="card-header">Condiciones Ambientales (DHT22, BMP280)</h2>
        <p className="text-gray-500 text-center py-4">Sin datos</p>
      </div>
    );
  }

  const { temperature, humidity, pressure } = data;

  const getTempStatus = () => {
    if (temperature < -5 || temperature > 10) return 'critical';
    if (temperature < -2 || temperature > 5) return 'warning';
    return 'success';
  };

  const getHumidityStatus = () => {
    if (humidity < 60 || humidity > 100) return 'critical';
    if (humidity < 80 || humidity > 95) return 'warning';
    return 'success';
  };

  // Preparar datos para el gráfico
  const chartData = history.slice(-20).map((item, index) => ({
    name: new Date(parseInt(item.timestamp)).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    temperatura: item.environmental?.temperature || 0,
    humedad: item.environmental?.humidity || 0
  }));

  return (
    <div className="card">
      <h2 className="card-header font-josefin">Condiciones Ambientales (DHT22, BMP280)</h2>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricDisplay
          label="Temperatura (DHT22)"
          value={temperature}
          unit="°C"
          status={getTempStatus()}
        />
        <MetricDisplay
          label="Humedad (DHT22)"
          value={humidity}
          unit="%"
          status={getHumidityStatus()}
        />
        <MetricDisplay
          label="Presión (BMP280)"
          value={pressure}
          unit="hPa"
        />
      </div>

      <div className="space-y-3 mb-4">
        <ProgressBar
          value={temperature}
          min={-10}
          max={15}
          label="Rango de temperatura"
          thresholds={{ normal: -2, warning: 5, critical: 10 }}
        />
        <ProgressBar
          value={humidity}
          min={0}
          max={100}
          label="Rango de humedad"
          thresholds={{ normal: 80, warning: 95, critical: 100 }}
        />
      </div>

      {chartData.length > 1 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Histórico (últimas 20 lecturas)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280" 
                style={{ fontSize: '10px' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                yAxisId="left"
                stroke="#3B82F6" 
                style={{ fontSize: '10px' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#10B981" 
                style={{ fontSize: '10px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="temperatura" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 3 }}
                name="Temp (°C)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="humedad" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 3 }}
                name="Humedad (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-xs text-gray-600">
          <strong>Rango óptimo:</strong> Temperatura: -2°C a 5°C | Humedad: 80% a 95%
        </p>
      </div>
    </div>
  );
};
