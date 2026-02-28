import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { AdminPanel } from './components/admin/AdminPanel';
import { ClientTracking } from './components/client/ClientTracking';
import { MainDashboard } from './components/dashboard/MainDashboard';
import IoTDataView from './components/iot/IoTDataView';
import TestingView from './components/testing/TestingView';

/**
 * Componente principal con autenticación y navegación
 */
const AppContent = () => {
  const { user, logout, isAdmin, isClient } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  // Si no está autenticado, mostrar login/registro
  if (!user) {
    return showRegister ? (
      <Register onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  // Usuario autenticado - mostrar dashboard con navegación
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Food Transport Dashboard
              </h1>
              <p className="text-gray-600 text-sm">
                Monitoreo IoT de Carcasa Inteligente IP65 con LoRaWAN
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-sm font-medium transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                currentView === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Monitoreo IoT
            </button>

            <button
              onClick={() => setCurrentView('iot-data')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                currentView === 'iot-data'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Datos IoT
            </button>

            <button
              onClick={() => setCurrentView('testing')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                currentView === 'testing'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg">🔘</span>
              Testing ESP32
            </button>
            
            {isAdmin() && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  currentView === 'admin'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Panel de Admin
              </button>
            )}
            
            {isClient() && (
              <button
                onClick={() => setCurrentView('tracking')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  currentView === 'tracking'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mis Envíos
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto">
        {currentView === 'dashboard' && <MainDashboard />}
        {currentView === 'iot-data' && <IoTDataView />}
        {currentView === 'testing' && <TestingView />}
        {currentView === 'admin' && isAdmin() && <AdminPanel />}
        {currentView === 'tracking' && isClient() && <ClientTracking />}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-8 text-center text-gray-500 text-sm">
        <p>
          Dashboard IoT - Monitoreo de Transporte de Alimentos | 
          Certificación IP65 | LoRaWAN + MQTT | Protocol Buffers | Hash-Chaining
        </p>
        <p className="text-xs text-gray-600 mt-1">
          © 2026 - Desarrollado con React + Vite + Tailwind CSS
        </p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
