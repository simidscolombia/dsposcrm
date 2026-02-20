
# 🕵️‍♂️ Contexto de Debugging: Web Scraper con IA
**Fecha:** 19 de Febrero, 2026
**Estado:** Funcional Localmente / Errores en Producción (Posible Bloqueo/JS)

## 📍 El Problema Actual
Hemos implementado un servicio de scraping (`scraperService.js`) que usa `axios` + `cheerio` para obtener datos de productos de URLs externas y pasarlos a Gemini AI para estructurarlos.

Funciona bien en pruebas simples, pero falla con URLs reales complejas (ej: `https://satpcs.com/sp/punto-de-venta-pos.html`) en el entorno de producción (Vercel).

### Síntomas
- El usuario reporta: "No se pudo analizar la web (Bloqueo o Error)".
- Posibles causas:
  1.  **Bloqueo Anti-Bot:** El sitio detecta que `axios` no es un navegador real (Falta de Cookies, Headers, TLS Fingerprint).
  2.  **Renderizado Javascript (SPA):** El sitio carga el contenido dinámicamente con JS. `axios` solo baja el HTML vacío (`<div id="root"></div>`), por lo que `cheerio` no encuentra nada y Gemini recibe basura.
  3.  **Timeout:** La petición tarda más de 10s (límite de Vercel hobby).

## 🛠 Herramientas Probadas
- **`scraperService.js`**: Implementación actual.
- **`scripts/call_api.js`**: Script local para probar el endpoint contra el servidor local.
- **`scripts/test_scraper.mjs`**: Script directo (bypass API) para probar el servicio.

## 🚀 Próximos Pasos (Plan de Acción)
Para resolver esto en la próxima sesión, debemos intentar en orden:

1.  **Diagnóstico Preciso:**
    - Ya se mejoró el mensaje de error en Frontend para que diga *exactamente* qué falló (Status 403, 500, o mensaje de error). **Pedir al usuario que pruebe de nuevo y nos diga el mensaje.**

2.  **Soluciones Técnicas:**
    - **Opción A (Mejorar Headers):** Añadir `User-Agent` de iPhone/Chrome real y headers `Accept-Language`, `Referer: https://google.com`.
    - **Opción B (Puppeteer Core):** Si el problema es JS, usar `puppeteer-core` con `chrome-aws-lambda` (compatible con Vercel) para renderizar la página real. *Nota: Esto aumenta el tamaño del bundle.*
    - **Opción C (API Externa):** Usar una API de scraping gratuita (tipo ZenRows, ScrapingBee) como proxy si Vercel IP está en lista negra.

3.  **Mejora de UX:**
    - Permitir al usuario pegar el JSON manualmente si el scraper falla.

## 📂 Archivos Relevantes
- `backend/src/services/scraperService.js` (La lógica)
- `backend/src/controllers/productController.js` (El endpoint)
- `frontend/src/pages/admin/AdminProducts.jsx` (La UI)
