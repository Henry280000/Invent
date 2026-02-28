# 🚀 Deployment Guide

Guía para desplegar el dashboard en diferentes plataformas.

---

## 📦 Build de Producción

```bash
# Generar build optimizado
npm run build

# El bundle estará en ./dist/
# Tamaño aproximado: ~500KB (gzip)
```

---

## ☁️ Deployment en Vercel (Recomendado)

### Opción 1: Desde GitHub

1. **Subir código a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit: Food Transport Dashboard"
git branch -M main
git remote add origin https://github.com/tu-usuario/food-transport-dashboard.git
git push -u origin main
```

2. **Conectar con Vercel:**
   - Ir a https://vercel.com
   - Click en "New Project"
   - Importar repositorio de GitHub
   - Framework Preset: Vite
   - Click en "Deploy"

### Opción 2: Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Hacer login
vercel login

# Deploy
npm run build
vercel --prod

# La URL estará disponible en segundos
# Ejemplo: https://food-transport-dashboard.vercel.app
```

**Características Vercel:**
- ✅ Deploy automático en cada push
- ✅ SSL gratis
- ✅ CDN global
- ✅ Preview deployments
- ✅ Gratis para proyectos personales

---

## 🌐 Deployment en Netlify

### Opción 1: Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Inicializar
netlify init

# Deploy
npm run build
netlify deploy --prod --dir=dist

# URL: https://your-site.netlify.app
```

### Opción 2: Drag & Drop

1. Hacer build: `npm run build`
2. Ir a https://app.netlify.com/drop
3. Arrastrar carpeta `dist/`
4. ¡Listo!

**Características Netlify:**
- ✅ Fácil de usar
- ✅ Forms incluidos
- ✅ Functions serverless
- ✅ Gratis tier generoso

---

## 🐳 Docker

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Build & Run

```bash
# Build image
docker build -t food-transport-dashboard .

# Run container
docker run -d -p 8080:80 food-transport-dashboard

# Acceder en http://localhost:8080
```

### Docker Compose

```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    
  mosquitto:
    image: eclipse-mosquitto
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

## ☁️ AWS S3 + CloudFront

### 1. Build

```bash
npm run build
```

### 2. Crear bucket S3

```bash
aws s3 mb s3://food-transport-dashboard
aws s3 website s3://food-transport-dashboard --index-document index.html
```

### 3. Upload

```bash
aws s3 sync dist/ s3://food-transport-dashboard --delete
```

### 4. Configurar CloudFront (opcional, para CDN global)

1. Crear distribución CloudFront
2. Origin: bucket S3
3. Configurar certificado SSL
4. Esperar ~15 minutos para propagación

**Ventajas:**
- ✅ Altamente escalable
- ✅ CDN integrado
- ✅ Pay-as-you-go
- ⚠️ Configuración más compleja

---

## 🔧 Azure Static Web Apps

```bash
# Instalar CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy dist/

# O integrar con GitHub Actions
```

---

## 🌍 GitHub Pages

### En package.json, agregar:

```json
{
  "homepage": "https://tu-usuario.github.io/food-transport-dashboard",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

```bash
# Instalar gh-pages
npm install --save-dev gh-pages

# Deploy
npm run deploy
```

**Limitaciones:**
- Solo sitios estáticos
- Sin variables de entorno privadas

---

## ⚙️ Variables de Entorno

### .env para desarrollo

```bash
# .env.local
VITE_MQTT_BROKER_URL=ws://broker.emqx.io:8083/mqtt
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=
VITE_MQTT_TOPIC=food/transport/sensors/+
```

### En mqttService.js

```javascript
const defaultConfig = {
  url: import.meta.env.VITE_MQTT_BROKER_URL || 'ws://broker.emqx.io:8083/mqtt',
  username: import.meta.env.VITE_MQTT_USERNAME || '',
  password: import.meta.env.VITE_MQTT_PASSWORD || ''
};
```

### En Vercel

1. Project Settings → Environment Variables
2. Agregar variables con prefijo `VITE_`
3. Redeploy

### En Netlify

1. Site Settings → Build & Deploy → Environment
2. Agregar variables
3. Rebuild

---

## 🔒 Seguridad en Producción

### Configurar CORS en broker MQTT

```conf
# mosquitto.conf
allow_anonymous false
password_file /mosquitto/config/passwd
acl_file /mosquitto/config/acl

# WebSocket con TLS
listener 9001
protocol websockets
cafile /mosquitto/certs/ca.crt
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
```

### Crear usuarios

```bash
mosquitto_passwd -c /mosquitto/config/passwd dashboard_user
```

### ACL (Access Control List)

```conf
# /mosquitto/config/acl
user dashboard_user
topic read food/transport/sensors/#
topic write food/transport/commands/#
```

---

## 📊 Monitoring

### Agregar analytics (opcional)

```bash
npm install @vercel/analytics
```

```javascript
// En App.jsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      {/* ... tu código ... */}
      <Analytics />
    </>
  );
}
```

### Error tracking con Sentry

```bash
npm install @sentry/react
```

```javascript
// En main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

---

## 📈 Performance Optimization

### En vite.config.js

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          mqtt: ['mqtt', 'protobufjs']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
```

### Lazy loading de componentes

```javascript
import { lazy, Suspense } from 'react';

const ChemicalCard = lazy(() => import('./components/sensors/ChemicalCard'));

// En render
<Suspense fallback={<LoadingSpinner />}>
  <ChemicalCard data={data} />
</Suspense>
```

---

## ✅ Checklist Pre-Deploy

- [ ] `npm run build` sin errores
- [ ] Probar build local con `npm run preview`
- [ ] Configurar variables de entorno
- [ ] Broker MQTT accesible desde internet
- [ ] SSL/TLS configurado (wss://)
- [ ] Credenciales seguras (no en código)
- [ ] Testing en diferentes navegadores
- [ ] Testing responsive en móvil
- [ ] Favicon y meta tags configurados
- [ ] 404 page configurada
- [ ] Analytics configurado (opcional)

---

## 🆘 Troubleshooting Deployment

### Error: "Failed to load module"
→ Limpiar cache: `rm -rf node_modules dist && npm install && npm run build`

### Error: WebSocket connection failed
→ Verificar CORS en broker MQTT
→ Usar wss:// en producción

### Página en blanco después de deploy
→ Verificar base path en vite.config.js
→ Revisar console del navegador

### Variables de entorno no funcionan
→ Asegurarse de usar prefijo `VITE_`
→ Redeploy después de cambiar variables

---

## 📞 URLs Útiles

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Vite Build**: https://vitejs.dev/guide/build.html
- **Docker Hub**: https://hub.docker.com

---

**¡Éxito con tu deployment! 🚀**
