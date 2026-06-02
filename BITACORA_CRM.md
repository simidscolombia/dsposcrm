# 📓 BITÁCORA DE DESARROLLO - SIMIDS CRM

Este documento contiene las reglas críticas y la configuración del CRM para evitar errores recurrentes durante el despliegue y desarrollo.

## 🛡️ JERARQUÍA DE SEGURIDAD (REGLA DE ORO)

1. **CRM (`/var/www/simids-crm`)**: ENTORNO DE DESARROLLO ÁGIL. 
   - Se permite programar y actualizar "sobre la marcha" (live updates).
   - Aquí implementaremos la IA, el diseño futurista y las pasarelas de pago.

2. **POS (`/var/www/simids-pos`)**: ENTORNO DE MISIÓN CRÍTICA.
   - **PROHIBIDO MODIFICAR DIRECTAMENTE**. 
   - Cualquier error aquí afecta a todos los clientes activos.
   - Todo cambio debe probarse primero en `/var/www/simids-demo` y ser aprobado por el administrador.

---

## 🚀 REGLAS TÉCNICAS (CRÍTICAS)

### 1. ⚠️ El error del doble `/api`
- **REGLA**: NUNCA habilitar `axios.defaults.baseURL` en `src/main.jsx` si los componentes ya tienen el prefijo `/api`.
- **POR QUÉ**: Si ambos están activos, las peticiones fallan con 404 porque buscan en `/api/api/...`.
- **ESTADO ACTUAL**: `axios.defaults.baseURL` está comentada en `main.jsx`.

### 2. 🏗️ Proceso de Build (Frontend)
- **REGLA**: El frontend debe compilarse siempre con la variable `VITE_API_URL` apuntando a `/api` para producción.
- **COMANDO**: `VITE_API_URL=/api npm run build` (o tenerlo en `.env.production`).

### 3. 🔑 Credenciales y Seguridad
- **DATABASE**: PostgreSQL local en el servidor (`simids_crm`).
- **AUTH**: Los usuarios están en la tabla `crm_users`. Las contraseñas usan `bcrypt`.
- **ADMIN ACTUAL**: `admin` / `123456`.

---

## 🏗️ ESTRUCTURA Y AUDITORÍA DEL CÓDIGO

### Estructura de Archivos
- **`/backend`**: Servidor Express con arquitectura de Rutas, Controladores y Servicios.
  - `src/server.js`: Punto de entrada (Puerto 4050).
  - `src/routes/`: Definición de todos los endpoints del API.
  - `src/services/`: Integraciones externas (Wompi, WhatsApp).
- **`/frontend`**: Aplicación React (Vite).
  - `src/App.jsx`: Manejo de rutas del frontend.
  - `src/pages/admin/`: Vistas principales del panel administrativo.
  - `src/components/Admin/`: Componentes reutilizables de la interfaz.

---

## ✅ ESTADO DE FUNCIONALIDADES (AUDITORÍA)

| Módulo | Estado | Observaciones |
| :--- | :--- | :--- |
| **Login / Auth** | ✅ Funcional | Usa JWT y contraseñas encriptadas en PostgreSQL. |
| **Usuarios** | ✅ Funcional | Gestión completa de usuarios y roles desde el CRM. |
| **Dashboard** | ✅ Funcional | Corregido error 500 (faltaba tabla `crm_distributors`). |
| **Clientes** | ✅ Funcional | Visualización y edición activa. Corregido join con distribuidores. |
| **Cobros / Pagos** | ✅ Funcional | Generación de links de Wompi integrada. |
| **Gateways (Config)** | ✅ Funcional | Permite actualizar llaves de producción desde el UI. |
| **Pipeline (Leads)** | ✅ Funcional | Gestión de embudo de ventas activo. |
| **WhatsApp** | ❌ Incompleto | Requiere instancia de **WAHA** corriendo en el puerto 3000. |
| **IA (Reglas/Chat)** | ❌ Incompleto | Requiere configurar `OPENAI_API_KEY` en el `.env`. |

---

## 🛠️ CONFIGURACIÓN DEL SISTEMA

### Backend
- **UBICACIÓN**: `/var/www/simids-crm/backend`
- **PUERTO**: 4050
- **GESTIÓN**: Controlado por PM2: `pm2 restart simids-crm`
- **VARIABLES**: Archivo `.env` (contiene llaves de Wompi/Bold y DB_URL).

### Frontend
- **UBICACIÓN**: `/var/www/simids-crm/frontend`
- **DESPLIEGUE**: Carpeta `dist/` servida por Nginx.
- **NGINX**: Configuración en `/etc/nginx/sites-enabled/simids-unified`.

---

## 📝 REGISTRO DE CAMBIOS RECIENTES (LOG)

- **2026-05-06**: Auditoría completa del sistema e identificación de módulos pendientes (WAHA/AI).
- **2026-05-06**: Creada tabla `crm_distributors` para arreglar errores 500 en Dashboard y Clientes.
- **2026-05-06**: Corregido error de duplicación de `/api` en `main.jsx` y `LoginPage.jsx`.
- **2026-05-06**: Implementado sistema de gestión de usuarios y cambio de contraseñas desde el UI.
- **2026-05-06**: Integración completa de Wompi con generación de links dinámica.
