import { StatusBadge } from '../ui/Indicators';

/**
 * Componente para visualizar la integridad de Hash-Chaining
 */
export const HashChainViewer = ({ chainStats, recentBlocks = [] }) => {
  if (!chainStats) {
    return (
      <div className="card">
        <h2 className="card-header font-josefin">Integridad de Datos (SHA-256 Hash-Chain)</h2>
        <p className="text-gray-500 text-center py-4">Sin datos de cadena</p>
      </div>
    );
  }

  const { totalBlocks, validBlocks, invalidBlocks, integrityPercentage, lastSequence } = chainStats;

  const getIntegrityStatus = () => {
    if (integrityPercentage >= 99) return 'success';
    if (integrityPercentage >= 95) return 'warning';
    return 'critical';
  };

  const getIntegrityColor = () => {
    if (integrityPercentage >= 99) return 'text-green-600';
    if (integrityPercentage >= 95) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="card">
      <h2 className="card-header font-josefin">Integridad de Datos (SHA-256 Hash-Chain)
        <StatusBadge 
          status={getIntegrityStatus()} 
          text={`${integrityPercentage.toFixed(1)}%`}
        />
      </h2>

      {/* Indicador visual de integridad */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Integridad de la cadena</span>
          <span className={`text-2xl font-bold ${getIntegrityColor()}`}>
            {integrityPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${
              integrityPercentage >= 99 ? 'bg-green-500' :
              integrityPercentage >= 95 ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ width: `${integrityPercentage}%` }}
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
          <p className="text-xs text-gray-600 mb-1">Total Bloques</p>
          <p className="text-xl font-bold text-blue-600">{totalBlocks}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
          <p className="text-xs text-gray-600 mb-1">Válidos</p>
          <p className="text-xl font-bold text-green-600">{validBlocks}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
          <p className="text-xs text-gray-600 mb-1">Inválidos</p>
          <p className="text-xl font-bold text-red-600">{invalidBlocks}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
          <p className="text-xs text-gray-600 mb-1">Secuencia</p>
          <p className="text-xl font-bold text-gray-700">#{lastSequence}</p>
        </div>
      </div>

      {/* Bloques recientes */}
      {recentBlocks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Últimos bloques ({recentBlocks.length})
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {recentBlocks.reverse().map((block, index) => (
              <div
                key={block.sequence}
                className={`flex items-center justify-between p-2 rounded text-xs ${
                  block.valid 
                    ? 'bg-green-50 border-l-2 border-green-500' 
                    : 'bg-red-50 border-l-2 border-red-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={block.valid ? 'text-green-600' : 'text-red-600'}>
                    {block.valid ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700">Bloque #{block.sequence}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-gray-500 font-mono text-[10px]">
                    {block.hash.substring(0, 8)}...
                  </code>
                  <span className="text-gray-500">
                    {new Date(parseInt(block.timestamp)).toLocaleTimeString('es-ES')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información de validación */}
      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
        <p className="text-xs text-gray-700 mb-2">
          <strong>¿Qué es Hash-Chaining?</strong>
        </p>
        <p className="text-xs text-gray-600">
          Cada mensaje contiene el hash del mensaje anterior, formando una cadena inmutable. 
          Si un bloque se modifica o se pierde, la cadena se rompe y se detecta la alteración.
        </p>
        {invalidBlocks > 0 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded">
            <p className="text-xs text-red-700">
              Se detectaron {invalidBlocks} bloque(s) con problemas de validación. 
              Posible pérdida de paquetes o alteración de datos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
