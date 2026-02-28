/* eslint-env node */
/* eslint-disable no-undef */
require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔌 Conectando a MySQL...');
    
    // Conectar a MySQL sin seleccionar base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'foodapp',
      password: process.env.DB_PASSWORD || 'foodapp123',
    });

    console.log('✅ Conectado a MySQL');

    // Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'food_transport'}`);
    console.log('✅ Base de datos verificada');

    // Usar la base de datos
    await connection.query(`USE ${process.env.DB_NAME || 'food_transport'}`);

    // Hashear contraseñas
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientPassword = await bcrypt.hash('cliente123', 10);

    console.log('🔐 Contraseñas hasheadas generadas');
    console.log('   Admin hash:', adminPassword);
    console.log('   Client hash:', clientPassword);

    // Insertar usuarios de prueba
    console.log('👤 Insertando usuarios de prueba...');
    
    try {
      await connection.query(
        `INSERT INTO users (email, password, name, role, company) VALUES (?, ?, ?, ?, ?)`,
        ['admin@foodtransport.com', adminPassword, 'Administrador Principal', 'admin', 'Food Transport Inc.']
      );
      console.log('   ✅ Admin creado: admin@foodtransport.com / admin123');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        // Actualizar contraseña si ya existe
        await connection.query(
          `UPDATE users SET password = ? WHERE email = ?`,
          [adminPassword, 'admin@foodtransport.com']
        );
        console.log('   ✅ Admin actualizado: admin@foodtransport.com / admin123');
      }
    }

    try {
      await connection.query(
        `INSERT INTO users (email, password, name, role, company) VALUES (?, ?, ?, ?, ?)`,
        ['cliente@empresa.com', clientPassword, 'Cliente Demo', 'client', 'Empresa Demo S.A.']
      );
      console.log('   ✅ Cliente creado: cliente@empresa.com / cliente123');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        await connection.query(
          `UPDATE users SET password = ? WHERE email = ?`,
          [clientPassword, 'cliente@empresa.com']
        );
        console.log('   ✅ Cliente actualizado: cliente@empresa.com / cliente123');
      }
    }

    // Verificar usuarios
    const [users] = await connection.query('SELECT id, email, name, role FROM users');
    console.log('\n📋 Usuarios en la base de datos:');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ID: ${user.id}`);
    });

    console.log('\n✨ Inicialización completada exitosamente!');
    console.log('\n📝 Credenciales de prueba:');
    console.log('   Admin: admin@foodtransport.com / admin123');
    console.log('   Cliente: cliente@empresa.com / cliente123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
