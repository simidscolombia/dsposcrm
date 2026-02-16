# 📔 BITÁCORA DEL PROYECTO: DISCOVERY SYSTEMS POS / ECOSYSTEM

**Fecha de Última Actualización:** 2026-02-15
**Estado:** Iniciando Fase 2 (Migración a Nube: Supabase + Vercel).

---

## 📅 SESIÓN: 15 de Febrero, 2026
**Objetivo:** Definición de la experiencia de usuario post-captura, diseño del ecosistema CRM y flujo operativo.

### 🚀 1. Mejoras Implementadas (Frontend)
1.  **Selección de Tipo de Negocio (Wizard):**
    *   Se reestructuró para mostrar primero **Categorías Macro** (Gastronomía, Salud, etc.) y luego sub-tipos específicos.
    *   Se agregó opción "Otro" para captura manual.
2.  **Catálogo de Productos Inteligente:**
    *   **Lógica "Solo Software":** Muestra filtrado solo licencias.
    *   **Lógica "Combo Completo":** Pre-carga el carrito con un kit estándar (PC, Impresora, Cajón, Lector) editable.
    *   **Lógica "A Medida":** Permite armar desde cero.
    *   **Nuevos Productos Mock:** Se agregaron "Impresora Portátil" y "Lector 2D".

---

### 🧠 2. Definición Estratégica: Ecosistema "Discovery Hub"
Se acordó no programar aún la Fase 2, sino estructurarla conceptualmente.

#### A. El Cerebro (CRM Operativo)
No usaremos un CRM externo genérico. Construiremos uno a medida con las siguientes capacidades:
*   **Gestión de Leads:** Captura automática desde el Wizard.
*   **Embudo de Ventas:** Estados claros (Nuevo -> Contactado -> En Demo -> Negociación -> Cerrado).
*   **Gestión de Inventario (Básico):** Control de hardware disponible para armar combos.

#### B. La Fuerza de Ventas Híbrida (IA + Humano)
*   **Agente 1 (WhatsApp/Web):** Primer contacto, filtro y respuesta de preguntas frecuentes.
*   **Agente 2 (Coordinador Interno):** Mueve leads en el CRM, recuerda citas a vendedores.
*   **Modo Supervisado (HITL):** 
    *   Si la IA no sabe una respuesta técnica compleja, "gana tiempo" con el cliente y notifica al humano.
    *   El humano responde internamente y la IA redacta la respuesta final al cliente.

#### C. Experiencia "Demo Interactiva"
*   En lugar de un video largo, usar **Clips Modulares** (30-60 seg) según el tipo de negocio del cliente.
*   Mientras el cliente ve el video, un **Chatbot Lateral** resuelve dudas específicas sobre lo que se está viendo.

#### D. Módulo de Operaciones & Logística (Back-Office)
Una vez cerrada la venta, se activa una "Línea de Ensamblaje" digital:
1.  **Admisión:** Verificación de pago y datos.
2.  **Alistamiento:** Bodega escanea seriales y prueba equipos.
3.  **Configuración:** Implementador instala software y base de datos.
4.  **Logística:** Generación de guía de envío y notificación al cliente ("Tu pedido va en camino 🚚").
5.  **Entrega:** Capacitación y Acta de Entrega digital.

---

### 📝 3. Próximos Pasos (Roadmap Técnico)

#### Fase 1: Cimientos (Backend Real) ✅ COMPLETADO
- [x] Crear modelos de Base de Datos: `crm_leads`, `crm_products`, `crm_quotes`.
- [x] Migrar datos "quemados" del frontend a la nueva BD (Seed Data aplicado).
- [x] Implementar Controladores y Rutas API (`/api/leads`, `/api/products`).
- [x] Conectar Frontend: Wizard lee productos reales y guarda leads en BD.

#### Fase 2: Infraestructura Cloud & Admin Panel (EN PROCESO ☁️)
- [ ] **Configuración Supabase:**
    - [ ] Crear Proyecto en Supabase.
    - [ ] Migrar esquema de Base de Datos local a Nube.
    - [ ] Configurar Auth (Usuarios Admin).
- [ ] **Despliegue Vercel:**
    - [ ] Conectar Repositorio GitHub.
    - [ ] Configurar Variables de Entorno en Vercel.
    - [ ] Despliegue Frontend y Backend (Serverless Functions).
- [ ] **Desarrollo Panel Admin:**
    - [ ] Login con Supabase Auth.
    - [ ] Dashboard de Leads.
    - [ ] Gestión de Inventario.

#### Fase 3: Conexión IA & WhatsApp
- [ ] Integrar API de WhatsApp (Twilio/Meta).
- [ ] Entrenar Agente con Manual de Usuario.
- [ ] Implementar sistema de "Consulta al Experto" (Notificaciones).

#### Fase 4: Portal del Cliente
- [ ] Link único para rastreo de pedido ("Uber style").

---

**Nota:** Se detiene el desarrollo de código por hoy para consolidar esta visión estratégica en la bitácora.
