# 🚀 Instalación Rápida con MySQL

## Opción 1: Instalación Automática con Docker (Recomendado)

```bash
# 1. Ejecutar script de instalación
./install.sh

# 2. Iniciar frontend
npm run dev
```

**¡Listo!** Accede a http://localhost:3002

---

## Opción 2: MySQL Local en Mac

### Paso 1: Configurar MySQL

```bash
# Crear base de datos y usuario
mysql -u root -p

CREATE DATABASE food_transport;
CREATE USER 'foodapp'@'localhost' IDENTIFIED BY 'foodapp123';
GRANT ALL PRIVILEGES ON food_transport.* TO 'foodapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importar schema
mysql -u foodapp -pfoodapp123 food_transport < database/schema.sql
```

### Paso 2: Backend

```bash
# Instalar dependencias
cd backend
npm install

# Inicializar usuarios de prueba
npm run init-db

# Iniciar servidor
npm start
```

### Paso 3: Frontend

```bash
# En otra terminal, desde la raíz
npm run dev
```

---

## 🔑 Credenciales de Prueba

**Admin**: admin@foodtransport.com / admin123  
**Cliente**: cliente@empresa.com / cliente123

---

## 📚 Documentación Completa

Ver [docs/INSTALLATION.md](docs/INSTALLATION.md) para instalación detallada y solución de problemas.

## 🔧 Puertos

- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:3001
- **MySQL**: localhost:3306

## ⚙️ Archivos de Configuración

- `.env` - Variables de entorno del backend
- `.env.local` - Variables de entorno del frontend (Vite)
- `docker-compose.yml` - Configuración de Docker

## 🛠️ Comandos Útiles

```bash
# Ver logs de Docker
docker-compose logs -f

# Detener Docker
docker-compose down

# Reiniciar base de datos
cd backend && npm run init-db

# Conectarse a MySQL
mysql -u foodapp -pfoodapp123 food_transport
```

## ❓ Problemas

Si las credenciales no funcionan, ejecuta:

```bash
cd backend
npm run init-db
```

Esto rehashea las contraseñas correctamente con bcrypt.
