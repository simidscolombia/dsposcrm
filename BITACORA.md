# Bitácora de Desarrollo - Discovery Systems POS

## Registro de Cambios y Soluciones Técnicas

### [2026-02-21] Refinamiento de UX/UI en Wizard de Cotización y Portal de Cliente

#### 🎯 Objetivo
Mejorar sustancialmente la experiencia del usuario (UX) mediante pasos guiados, eliminación de fricción prematura de captura de datos, simplificación de la vista de cotización y personalización dinámica del portal conversacional del cliente.

#### ✅ Logros y Soluciones Implementadas
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
