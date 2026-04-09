# Bitácora de Desarrollo - Discovery Systems POS

## Registro de Cambios y Soluciones Técnicas

### [2026-04-09] Fortalecimiento de Seguridad, UI Móvil y Gestión de "Motor Maestro"

#### 🎯 Objetivo
Profesionalizar el CRM centralizando la seguridad (Login), resolviendo la usabilidad en dispositivos móviles y estandarizando el proceso de despliegue en el servidor "Maestro".

#### ✅ Logros y Soluciones Implementadas
1. **Sistema de Autenticación Centralizado (JWT) 🔐**:
   - **Backend**: Creación del `authController` y middleware `authenticateToken`. Implementación de seguridad via JWT (JSON Web Tokens).
   - **Base de Datos**: Creación de la tabla `crm_users` con soporte para roles. Usuario inicial: `admin` / `admin123` (Bcrypt hash).
   - **Endpoint de Init**: `/api/admin/init-tables` ahora prepara el entorno de seguridad completo.
2. **Interfaz Móvil "Responsive" (Sidebar) 📱**:
   - **Problema**: El menú lateral quedaba fijo e impedía navegar en celulares.
   - **Solución**: Rediseño de `AdminLayout.jsx`. Ahora el menú se oculta automáticamente en móviles y se activa mediante un botón "hamburguesa" flotante. Se añadió un overlay táctil para cerrar el menú con un toque.
3. **Capa de Seguridad en Frontend 🚧**:
   - **LoginPage**: Pantalla de acceso personalizada con estética Premium.
   - **ProtectedRoute**: Implementación de guardias de ruta en React. Si no hay sesión, el sistema redirige automáticamente al Login.
   - **Axios Interceptor**: Configuración global para que todas las peticiones lleven el token de seguridad y gestionen automáticamente el cierre de sesión si el token expira.

#### 🚀 Instrucciones para Actualizar el Servidor "Maestro"
Para que estos cambios surtan efecto en `maestro.poslatino.com`, seguir estos pasos en la consola:
1. **Reiniciar el Motor Maestro**:
   ```bash
   pm2 restart maestro
   ```
2. **Sincronizar Cambios (Si usas Git)**:
   ```bash
   cd /root/discovery-systems-pos && git pull && pm2 restart maestro
   ```
3. **Punto de Entrada**: Una vez reiniciado, visitar `https://maestro.poslatino.com/api/admin/init-tables` para crear el usuario admin.

---

### [2026-04-08] Resolución de Bloqueo por Límite de Almacenamiento en MongoDB Atlas

#### 🎯 Objetivo
Recuperar el acceso de escritura de los clientes en producción (ej. `ferreteriatabares`) que estaban bloqueados porque el clúster de MongoDB Atlas había alcanzado su capacidad máxima, y el IP Whitelisting impedía gestionar el clúster desde IPs locales.

#### ✅ Logros y Soluciones Implementadas
1. **Acceso vía Droplet Autorizado 🚪**: 
   - Se aprovechó la conexión SSH a la Gota de DigitalOcean (`104.248.55.236`), la cual ya contaba con autorización (IP Whitelisted) en MongoDB Atlas.
2. **Diagnóstico de Almacenamiento (Rayos X) 🔍**: 
   - Se elaboró el script `escanear_clientes.js` para leer los pesos en el clúster. Descubrimos que la memoria consumida por clientes reales rondaba pírricos 200MB, pero coexistían más de 25 bases de datos "zombies/abandonadas".
3. **Auditoría Transaccional de Inactividad 🕵️‍♂️**:
   - Se creó el script `ver_inactividad.js`. Usamos la inteligencia del motor de Mongo de extraer el Timestamp embebido en todos los IDs (ObjectIds) para escanear en milisegundos hace cuántos días cada cliente había insertado por última vez siquiera un alfiler en el sistema.
4. **Respaldo Infalible (Backup) 💾**:
   - Instalamos la herramienta oficial (`mongodb-database-tools`) y disparamos un `mongodump` total del clúster. Toda la historia se empacó hermética en `respaldo_mongo_seguro.tar.gz`.
5. **El Botón Rojo de Purga (Limpieza Quirúrgica) 🧹**:
   - Diseñamos el script final `purga_cementerio.js` con una directriz clara: asesina (`dropDatabase`) a cualquier cliente inactivo hace **100 días o más**.
   - **Resultado**: Fulminamos en menos de un segundo **29 bases de datos abandonadas** (algunas de 1000+ días de moho). Atlas respiró, los Gigabytes sobrantes bajaron y el sistema resucitó para seguir vendiendo.

---

### [2026-02-21] Refinamiento de UX/UI en Wizard de Cotización y Portal de Cliente

#### 🎯 Objetivo
Mejorar sustancialmente la experiencia del usuario (UX) mediante pasos guiados, eliminación de fricción prematura de captura de datos, simplificación de la vista de cotización y personalización dinámica del portal conversacional del cliente.

#### ✅ Logros y Soluciones Implementadas
- [x] **Arquitectura 'Premium Paper' 📄**: Rediseño total de la Vista Previa y Factura Final para simular un documento oficial de alta gama.
- [x] **Edición Dinámica en Tiempo Real 🔄**: Capacidad de modificar cantidades, cambiar productos o eliminar líneas directamente desde la vista previa de "papel".
- [x] **Sincronización de Portal de Clientes ☁️**: Corrección de mapeo de campos (final_amount) para asegurar que el portal muestre el total real de la cotización.
- [x] **Optimización de UX en Ruleta 🎰**: Transición suave entre la personalización del kit y la obtención del premio.
1. **Rediseño del Flujo de Cotización (Anti-fricción)**:
   - **Problema**: Solicitar nombre y teléfono antes de jugar la "Ruleta" generaba fricción innecesaria (la gente desconfía antes del premio).
   - **Solución**: Se movió la solicitud de Nombre y Teléfono (WhatsApp) *después* del premio (al final del todo, preguntando "¿A dónde te enviamos el Obsequio y la Copia?"). Psicológicamente aumenta la conversión.

2. **Pasos Guiados (Stepper) y Cabecera Global**:
   - **Mejora**: Se eliminaron textos duplicados e innecesarios de las pantallas internas (Ej: `CitySelection`, `BusinessTypeSelection`). 
   - **Solución**: Se implementó una cabecera global fija en la pantalla principal (`QuotePage`) con títulos guiados estilo paso a paso ("Paso 1: ¿De dónde nos visitas?") con subtítulos, llevando al cliente de la mano.

3. **Portal Conversacional IA Contextual**:
   - **Mejora**: En lugar de mostrar un saludo genérico de "IA de Ventas", ahora el bot se presenta como un Asesor Personal.
   - **Solución**: Se integró la consulta del número y nombre del Asesor a partir de la Ciudad escogida por el cliente (`/api/config/whatsapp/:cityParam`). El chat final saluda usando el nombre de ese agente real, para una experiencia "humana".

4. **Transición Transparente (Seamless Redirect)**:
   - **Solución**: Tan pronto el cliente da clic en "Continuar" para reclamar su premio confirmando sus datos, la cotización se graba en CRM en segundo plano e inmediatamente se redirige al cliente a su Dashboard/Chat del Portal (`/#/portal/:id`) sin que lo note.

---

### [2026-02-19] Implementación Exitosa en Vercel (Producción)

#### 🎯 Objetivo
Desplegar la aplicación Full-Stack (Frontend React + Backend Express) en Vercel Serverless, conectando exitosamente a Supabase PostgreSQL y resolviendo problemas de conexión y "Crash Loop".

#### ✅ Logros y Soluciones Implementadas
1. **Configuración de "Monorepo" Node.js en Vercel**:
   - **Problema**: Vercel no instalaba las dependencias del Backend ubicadas en `backend/src` porque solo miraba el root.
   - **Solución**: Se consolidaron todas las dependencias del Backend (`express`, `pg`, `cors`, etc.) en el `package.json` de la **RAÍZ DEL PROYECTO**. Esto permite que Vercel instale todo en `/var/task/node_modules` y `server.js` pueda encontrar los módulos.

2. **Conexión a Supabase (Pooler)**:
   - **Problema**: Errores intermitentes con el Pooler de Supabase (puerto 6543) y pgBouncer.
   - **Solución**: Se aseguró el uso de la `DATABASE_URL` completa con `?pgbouncer=true` y `ssl: { rejectUnauthorized: false }` en la configuración de `pg.Pool`.

3. **Corrección de Rutas API en Frontend**:
   - **Problema**: El frontend hacía peticiones a `/api/api/categories` causando errores 404, debido a que `API_URL` ya contenía `/api` y se concatenaba nuevamente.
   - **Solución**: Se estandarizaron todas las llamadas de Axios en `AdminCategories.jsx` y `AdminProducts.jsx` para usar la estructura correcta (`${API_URL}/resource`).

4. **Prevención de Crashes por Archivos Faltantes**:
   - **Problema**: `server.js` fallaba al arrancar porque intentaba importar `pdfRoutes.js` y `pdfController.js` que no existían.
   - **Solución**: Se crearon versiones "Placeholder" (Dummy) de estos archivos para permitir que la aplicación arranque correctamente, aunque la funcionalidad de PDF esté temporalmente deshabilitada por límites de tamaño en Serverless.

5. **Manejo de Errores en Arranque (Serverless)**:
   - **Mejora**: Se implementó una carga dinámica (`import()`) en `api/index.js` para capturar errores de inicialización y devolverlos como JSON explicativos en lugar de un error 500 genérico de Vercel.

#### 🚧 Estado Actual
- **Frontend**: Funcionando y conectado al Backend.
- **Backend**: Operativo en Vercel Serverless.
- **Base de Datos**: Conexión estable (Lectura/Escritura).
- **PDFs**: Deshabilitados temporalmente.
- **IA**: Rutas configuradas, pendiente validación en producción.

---
**Próximos Pasos**:
1. Verificar flujo completo de creación de cotizaciones.
2. Reactivar generación de PDFs (posiblemente migrando a servicio externo o Edge Functions).
3. Pulir interfaz de usuario del Admin.
