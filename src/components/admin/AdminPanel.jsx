import { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

export const AdminPanel = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewShipment, setShowNewShipment] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [newShipment, setNewShipment] = useState({
    clientEmail: '',
    origin: '',
    destination: '',
    product: '',
    estimatedArrival: '',
    truckId: '',
  });
  const [updateForm, setUpdateForm] = useState({
    message: '',
    location: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getShipments();
      setShipments(data.shipments || []);
    } catch (err) {
      setError('Error al cargar envíos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await apiService.createShipment(newShipment);
      setShowNewShipment(false);
      setNewShipment({
        clientEmail: '',
        origin: '',
        destination: '',
        product: '',
        estimatedArrival: '',
        truckId: '',
      });
      loadShipments(); // Recargar lista
    } catch (err) {
      setError('Error al crear envío: ' + err.message);
    }
  };

  const updateShipmentStatus = async (id, newStatus) => {
    try {
      await apiService.updateShipment(id, { status: newStatus });
      loadShipments(); // Recargar lista
    } catch (err) {
      setError('Error al actualizar estado: ' + err.message);
    }
  };

  const deleteShipment = async (id) => {
    if (confirm('¿Eliminar este envío?')) {
      try {
        await apiService.deleteShipment(id);
        loadShipments(); // Recargar lista
      } catch (err) {
        setError('Error al eliminar envío: ' + err.message);
      }
    }
  };

  const openUpdateModal = (shipment) => {
    setSelectedShipment(shipment);
    setUpdateForm({ message: '', location: '' });
    setShowUpdateModal(true);
  };

  const handleSendUpdate = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!updateForm.message.trim()) {
      setError('El mensaje es requerido');
      return;
    }

    try {
      await apiService.createShipmentUpdate(selectedShipment.id, updateForm);
      setShowUpdateModal(false);
      setUpdateForm({ message: '', location: '' });
      setSelectedShipment(null);
      alert('Actualización enviada exitosamente al cliente');
    } catch (err) {
      setError('Error al enviar actualización: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'en_ruta': 'badge-blue',
      'entregado': 'badge-green',
      'detenido': 'badge-amber',
      'cancelado': 'badge-red',
    };
    const labels = {
      'en_ruta': 'En Ruta',
      'entregado': 'Entregado',
      'detenido': 'Detenido',
      'cancelado': 'Cancelado',
    };
    return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="card bg-red-50 border-red-500">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel de Administrador</h2>
          <p className="text-gray-600 text-sm">Gestión de envíos y tracking</p>
        </div>
        <button
          onClick={() => setShowNewShipment(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
        >
          + Nuevo Envío
        </button>
      </div>

      {/* Formulario de nuevo envío */}
      {showNewShipment && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo Envío</h3>
          <form onSubmit={handleCreateShipment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del Cliente
                </label>
                <input
                  type="email"
                  value={newShipment.clientEmail}
                  onChange={(e) => setNewShipment({...newShipment, clientEmail: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="cliente@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID del Camión
                </label>
                <input
                  type="text"
                  value={newShipment.truckId}
                  onChange={(e) => setNewShipment({...newShipment, truckId: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="TRUCK-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origen
                </label>
                <input
                  type="text"
                  value={newShipment.origin}
                  onChange={(e) => setNewShipment({...newShipment, origin: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="CDMX, México"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destino
                </label>
                <input
                  type="text"
                  value={newShipment.destination}
                  onChange={(e) => setNewShipment({...newShipment, destination: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Monterrey, México"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto
                </label>
                <input
                  type="text"
                  value={newShipment.product}
                  onChange={(e) => setNewShipment({...newShipment, product: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Carne refrigerada"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Llegada Estimada
                </label>
                <input
                  type="datetime-local"
                  value={newShipment.estimatedArrival}
                  onChange={(e) => setNewShipment({...newShipment, estimatedArrival: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors text-sm"
              >
                Crear Envío
              </button>
              <button
                type="button"
                onClick={() => setShowNewShipment(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal para enviar actualización */}
      {showUpdateModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Enviar Actualización al Cliente</h3>
            <p className="text-sm text-gray-600 mb-4">
              Envío: <strong>{selectedShipment.truckId}</strong> - {selectedShipment.clientEmail}
            </p>
            
            <form onSubmit={handleSendUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación Actual <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={updateForm.location}
                  onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                  placeholder="ej: En camino, Guadalajara, Jalisco"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje * <span className="text-xs text-gray-500">(máx. 500 caracteres)</span>
                </label>
                <textarea
                  value={updateForm.message}
                  onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })}
                  placeholder="Escribe aquí el mensaje para el cliente..."
                  maxLength={500}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {updateForm.message.length}/500 caracteres
                </p>
              </div>

              {error && showUpdateModal && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors text-sm"
                >
                  📤 Enviar Actualización
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setUpdateForm({ message: '', location: '' });
                    setSelectedShipment(null);
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de envíos */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Envíos Activos (<span className="font-orbitron">{shipments.length}</span>)</h3>
        
        {loading ? (
          <p className="text-gray-500 text-center py-8">Cargando envíos...</p>
        ) : shipments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay envíos registrados</p>
        ) : (
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="p-4 border border-gray-200 rounded hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{shipment.truckId}</h4>
                      {getStatusBadge(shipment.status)}
                    </div>
                    <p className="text-sm text-gray-600">{shipment.product}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openUpdateModal(shipment)}
                      className="px-3 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200 font-medium"
                      title="Enviar actualización al cliente"
                    >
                      📍 Actualizar
                    </button>
                    <select
                      value={shipment.status}
                      onChange={(e) => updateShipmentStatus(shipment.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="en_ruta">En Ruta</option>
                      <option value="detenido">Detenido</option>
                      <option value="entregado">Entregado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    <button
                      onClick={() => deleteShipment(shipment.id)}
                      className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Cliente:</span>
                    <p className="font-medium">{shipment.clientEmail}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Origen:</span>
                    <p className="font-medium">{shipment.origin}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Destino:</span>
                    <p className="font-medium">{shipment.destination}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Llegada:</span>
                    <p className="font-medium">
                      {new Date(shipment.estimatedArrival).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {shipment.sensorData && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Temp:</span>
                      <span className="ml-1 font-medium">{shipment.sensorData.temperature.toFixed(1)}°C</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Humedad:</span>
                      <span className="ml-1 font-medium">{shipment.sensorData.humidity.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
