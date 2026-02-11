# 🔧 SOLUCIÓN: Chatbot de IA en Discovery Systems POS

## El problema
El frontend en Vercel intenta llamar al backend, pero el backend Express no funciona como serverless en Vercel.

## La solución
Crear una **Vercel Serverless Function** dentro del proyecto frontend. Así `/api/ai/chatbot` se ejecuta en el mismo dominio `discovery-systems-pos.vercel.app`.

---

## Pasos (15 minutos)

### Paso 1: Crear la carpeta `api` en el frontend

```powershell
cd C:\SIMIDS\discovery-systems-pos\frontend
mkdir api\ai
```

### Paso 2: Copiar el archivo de la serverless function

Copia el archivo `api/ai/chatbot.js` (que te adjunto) a:
```
C:\SIMIDS\discovery-systems-pos\frontend\api\ai\chatbot.js
```

### Paso 3: Crear vercel.json en el frontend

Copia el archivo `vercel.json` (que te adjunto) a:
```
C:\SIMIDS\discovery-systems-pos\frontend\vercel.json
```

### Paso 4: Actualizar App.jsx

Reemplaza tu `App.jsx` con la versión actualizada. El cambio clave es:

**ANTES:**
```javascript
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chatbot`, {
```

**DESPUÉS:**
```javascript
const response = await fetch('/api/ai/chatbot', {
```

Ya no necesitas `VITE_API_URL` porque la API está en el mismo dominio.

### Paso 5: Verificar variable de entorno en Vercel

Ve a **Vercel → discovery-systems-pos → Settings → Environment Variables** y asegúrate de que `ANTHROPIC_API_KEY` esté configurada (ya la vi en tu screenshot, así que debería estar).

### Paso 6: Deploy

```powershell
cd C:\SIMIDS\discovery-systems-pos
git add .
git commit -m "Add serverless chatbot function"
git push origin main
```

### Paso 7: Esperar el deploy y probar

Ve a `https://discovery-systems-pos.vercel.app` y prueba el chatbot. ¡Debería funcionar!

---

## Estructura final del frontend

```
frontend/
├── api/                    ← NUEVO
│   └── ai/
│       └── chatbot.js      ← Serverless function
├── src/
│   └── App.jsx             ← Actualizado (sin VITE_API_URL)
├── vercel.json             ← NUEVO
├── package.json
└── ...
```

---

## ¿Y el backend separado?

Por ahora no lo necesitas para el chatbot. Cuando vayas a integrar más endpoints (PDF, WhatsApp, analytics con base de datos), puedes:

1. Crear más serverless functions en `api/` (ej: `api/ai/analyze-business.js`)
2. O desplegar el backend Express en **Railway** en vez de Vercel (Railway sí soporta Express nativo)

Para el test de IA actual, con la serverless function es suficiente.
