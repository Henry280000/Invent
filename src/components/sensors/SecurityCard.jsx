import { BinaryIndicator, MetricDisplay } from '../ui/Indicators';

/**
 * Tarjeta de sensores de seguridad de la carcasa
 */
export const SecurityCard = ({ data }) => {
  if (!data) {
    return (
      <div className="card">
        <h2 className="card-header font-josefin">Seguridad de Carcasa (LDR, IMU MPU-6050, Hall A3144)</h2>
        <p className="text-gray-500 text-center py-4">Sin datos</p>
      </div>
    );
  }

  const {
    ldr_light_detected,
    imu_movement_alert,
    hall_magnet_attached,
    imu_acceleration_x = 0,
    imu_acceleration_y = 0,
    imu_acceleration_z = 0
  } = data;

  // Calcular aceleración total
  const totalAcceleration = Math.sqrt(
    imu_acceleration_x ** 2 + 
    imu_acceleration_y ** 2 + 
    imu_acceleration_z ** 2
  );

  const getAccelerationStatus = () => {
    if (totalAcceleration > 2.0) return 'critical';
    if (totalAcceleration > 1.0) return 'warning';
    return 'normal';
  };

  return (
    <div className="card">
      <h2 className="card-header font-josefin">Seguridad de Carcasa (LDR, IMU MPU-6050, Hall A3144)</h2>

      <div className="space-y-3">
        <BinaryIndicator
          active={ldr_light_detected}
          label="Detección de Luz (LDR)"
          activeText="LUZ DETECTADA"
          inactiveText="CERRADO"
        />

        <BinaryIndicator
          active={imu_movement_alert}
          label="Movimiento (IMU MPU-6050)"
          activeText="ALERTA"
          inactiveText="NORMAL"
        />

        <BinaryIndicator
          active={!hall_magnet_attached}
          label="Acoplamiento (Hall Effect A3144)"
          activeText="DESACOPLADO"
          inactiveText="ACOPLADO"
        />

        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Aceleración IMU</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricDisplay
              label="Eje X"
              value={imu_acceleration_x}
              unit="g"
              status={Math.abs(imu_acceleration_x) > 1.0 ? 'warning' : 'normal'}
            />
            <MetricDisplay
              label="Eje Y"
              value={imu_acceleration_y}
              unit="g"
              status={Math.abs(imu_acceleration_y) > 1.0 ? 'warning' : 'normal'}
            />
            <MetricDisplay
              label="Eje Z"
              value={imu_acceleration_z}
              unit="g"
              status={Math.abs(imu_acceleration_z) > 1.0 ? 'warning' : 'normal'}
            />
            <MetricDisplay
              label="Total"
              value={totalAcceleration}
              unit="g"
              status={getAccelerationStatus()}
            />
          </div>
        </div>

        {(ldr_light_detected || imu_movement_alert || !hall_magnet_attached) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700 text-sm font-semibold">
              Verificación de seguridad requerida
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
