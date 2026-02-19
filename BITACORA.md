# Bitácora de Desarrollo - Discovery Systems POS

## Registro de Cambios y Soluciones Técnicas

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
