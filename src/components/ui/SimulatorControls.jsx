import { useState } from 'react';
import dataSimulator from '../../utils/dataSimulator';

/**
 * Panel de control del simulador de datos
 */
export const SimulatorControls = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [scenario, setScenario] = useState('normal');
  const [interval, setInterval] = useState(5000);
  const [expanded, setExpanded] = useState(false);

  const scenarios = [
    { value: 'normal', label: 'Normal', color: 'success' },
    { value: 'degradation', label: 'Degradación', color: 'warning' },
    { value: 'security_breach', label: 'Violación de Seguridad', color: 'error' },
    { value: 'temperature_failure', label: 'Falla de Refrigeración', color: 'error' }
  ];

  const handleStart = () => {
    dataSimulator.setScenario(scenario);
    dataSimulator.start(interval);
    setIsRunning(true);
  };

  const handleStop = () => {
    dataSimulator.stop();
    setIsRunning(false);
  };

  const handleReset = () => {
    dataSimulator.reset();
    setIsRunning(false);
    setScenario('normal');
  };

  const handleScenarioChange = (newScenario) => {
    setScenario(newScenario);
    if (isRunning) {
      dataSimulator.setScenario(newScenario);
    }
  };

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setExpanded(true)}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <span>Simulador</span>
          {isRunning && (
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <div className="card shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">
            Simulador de Datos
          </h3>
          <button
            onClick={() => setExpanded(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors text-lg font-bold"
          >
            ×
          </button>
        </div>

        {/* Estado */}
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estado:</span>
            <span className={`text-sm font-semibold flex items-center gap-2 ${
              isRunning ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isRunning ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Ejecutando
                </>
              ) : (
                'Detenido'
              )}
            </span>
          </div>
        </div>

        {/* Escenarios */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Escenario:
          </label>
          <div className="space-y-2">
            {scenarios.map((s) => (
              <button
                key={s.value}
                onClick={() => handleScenarioChange(s.value)}
                className={`w-full px-3 py-2 rounded border text-left text-sm font-medium transition-colors ${
                  scenario === s.value
                    ? s.color === 'success' ? 'bg-green-600 text-white border-green-600' :
                      s.color === 'warning' ? 'bg-amber-600 text-white border-amber-600' :
                      s.color === 'error' ? 'bg-red-600 text-white border-red-600' :
                      'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Intervalo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Intervalo: <span className="text-blue-600">{interval/1000}s</span>
          </label>
          <input
            type="range"
            min="1000"
            max="10000"
            step="1000"
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value))}
            className="w-full"
            disabled={isRunning}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1s</span>
            <span>10s</span>
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded border border-green-600 font-medium text-sm transition-colors"
            >
              Iniciar
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded border border-red-600 font-medium text-sm transition-colors"
            >
              Detener
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 font-medium text-sm transition-colors"
          >
            Reiniciar
          </button>
        </div>

        {/* Info */}
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-600">
          También disponible en consola: <code className="text-blue-700">window.simulator</code>
        </div>
      </div>
    </div>
  );
};
