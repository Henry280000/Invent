import { MetricDisplay, StatusBadge, Timestamp } from '../ui/Indicators';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

/**
 * Tarjeta de sensores químicos (NH3, TMA, Etileno)
 */
export const ChemicalCard = ({ data, history = [], environmental }) => {
  if (!data) {
    return (
      <div className="card">
        <h2 className="card-header font-josefin">Sensores Químicos (MQ-137, MQ-135, MQ-3)</h2>
        <p className="text-gray-500 text-center py-4">Sin datos</p>
      </div>
    );
  }

  const { ammonia_nh3, trimethylamine_tma, ethylene, duty_cycle_counter, next_reading_time } = data;

  const getChemicalStatus = (value, thresholds) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.high) return 'warning';
    if (value >= thresholds.medium) return 'warning';
    return 'success';
  };

  const thresholds = {
    ammonia: { medium: 5, high: 15, critical: 30 },
    tma: { medium: 2, high: 5, critical: 10 },
    ethylene: { medium: 50, high: 100, critical: 200 }
  };

  // Calcular NH3 esperado basado en temperatura (lógica de inconsistencia biológica)
  const calculateExpectedNH3 = (temp) => {
    if (!temp) return null;
    const baseNH3 = 3;
    const tempFactor = Math.exp(0.1 * temp);
    return baseNH3 * tempFactor;
  };

  const expectedNH3 = environmental?.temperature ? calculateExpectedNH3(environmental.temperature) : null;
  const biologicalInconsistency = expectedNH3 && ammonia_nh3 > (expectedNH3 * 1.5);

  // Preparar datos para gráfico
  const chartData = history.slice(-20).map((item) => ({
    name: new Date(parseInt(item.timestamp)).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    NH3: item.chemical?.ammonia_nh3 || 0,
    TMA: item.chemical?.trimethylamine_tma || 0,
    Etileno: (item.chemical?.ethylene || 0) / 10, // Escalar para visualización
    temp: item.environmental?.temperature || 0
  }));

  // Calcular tiempo hasta próxima lectura
  const timeUntilNextReading = next_reading_time ? 
    Math.max(0, parseInt(next_reading_time) - Date.now()) : 0;
  const minutesUntilNext = Math.floor(timeUntilNextReading / 60000);

  return (
    <div className="card">
      <h2 className="card-header font-josefin">Sensores Químicos (MQ-137, MQ-135, MQ-3)</h2>

      {/* Indicador de Duty Cycle */}
      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-700">Ciclo de lectura</span>
          <StatusBadge status="info" text={`Ciclo #${duty_cycle_counter}`} />
        </div>
        <p className="text-xs text-gray-600">
          Próxima lectura en: <span className="text-blue-700 font-medium">{minutesUntilNext} min</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          30-45s de sensado cada 15 minutos (membrana hidrofóbica)
        </p>
      </div>

      {/* Valores actuales */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricDisplay
          label="Amoniaco (MQ-137)"
          value={ammonia_nh3}
          unit="ppm NH₃"
          status={getChemicalStatus(ammonia_nh3, thresholds.ammonia)}
        />
        <MetricDisplay
          label="TMA (MQ-135)"
          value={trimethylamine_tma}
          unit="ppm"
          status={getChemicalStatus(trimethylamine_tma, thresholds.tma)}
        />
        <MetricDisplay
          label="Etileno (MQ-3)"
          value={ethylene}
          unit="ppm"
          status={getChemicalStatus(ethylene, thresholds.ethylene)}
        />
      </div>

      {/* Alerta de Inconsistencia Biológica */}
      {biologicalInconsistency && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 rounded">
          <div className="flex items-start gap-3">
            <div>
              <h3 className="text-red-700 font-bold text-sm mb-1">
                INCONSISTENCIA BIOLÓGICA DETECTADA
              </h3>
              <p className="text-xs text-gray-700 mb-2">
                El nivel de NH₃ ({ammonia_nh3.toFixed(2)} ppm) es anormalmente alto para la 
                temperatura actual ({environmental.temperature.toFixed(1)}°C).
              </p>
              <p className="text-xs text-gray-600">
                NH₃ esperado: ~{expectedNH3.toFixed(2)} ppm | 
                Desviación: {((ammonia_nh3 / expectedNH3 - 1) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-amber-700 mt-2">
                Posible falla de refrigeración o contaminación previa del producto.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de tendencia */}
      {chartData.length > 1 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Tendencia de gases (últimas 20 lecturas)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280" 
                style={{ fontSize: '10px' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#6B7280" 
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
              
              {/* Líneas de referencia para umbrales críticos */}
              <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'NH₃ Crítico', fill: '#EF4444', fontSize: 10 }} />
              <ReferenceLine y={10} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'TMA Crítico', fill: '#F59E0B', fontSize: 10 }} />
              
              <Line 
                type="monotone" 
                dataKey="NH3" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 3 }}
                name="NH₃ (ppm)"
              />
              <Line 
                type="monotone" 
                dataKey="TMA" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', r: 3 }}
                name="TMA (ppm)"
              />
              <Line 
                type="monotone" 
                dataKey="Etileno" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 3 }}
                name="Etileno (÷10)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparación NH3 vs Temperatura */}
      {expectedNH3 && chartData.length > 1 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Validación Biológica: NH₃ vs Temperatura
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
                stroke="#EF4444" 
                style={{ fontSize: '10px' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#3B82F6" 
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
                dataKey="NH3" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 3 }}
                name="NH₃ Real (ppm)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="temp" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 3 }}
                name="Temp (°C)"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-600 mt-2">
            A menor temperatura, menor producción de NH₃. Desviaciones significativas indican problemas.
          </p>
        </div>
      )}

      {/* Leyenda de umbrales */}
      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-xs">
        <p className="text-gray-700 font-semibold mb-2">Umbrales de alerta:</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-red-600">NH₃:</span> 5/15/<strong>30</strong> ppm
          </div>
          <div>
            <span className="text-amber-600">TMA:</span> 2/5/<strong>10</strong> ppm
          </div>
          <div>
            <span className="text-purple-600">Etileno:</span> 50/100/<strong>200</strong> ppm
          </div>
        </div>
      </div>
    </div>
  );
};
