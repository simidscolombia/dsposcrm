# 🚀 Discovery Systems AI CRM — Plan Maestro

> Documento de referencia del proyecto. Última actualización: 20 Feb 2026

---

## 🏢 INFORMACIÓN DE LA EMPRESA

| Campo | Valor |
|---|---|
| **Nombre Legal** | Discovery Systems POS |
| **NIT** | 88243048 |
| **Dirección** | Cra 26A #11-68, Barrio La Universidad, Bucaramanga, Santander, Colombia |
| **Teléfono Principal** | +57 320 579 2169 |
| **Email** | dsposcolombia@gmail.com |
| **Web** | www.discoverysystems.com (básica, pendiente rediseño) |
| **Dominios** | discoverysystems.com, poslatino.com, simids.com |
| **GitHub** | https://github.com/simidscolombia/dsposcrm |

### Estructura de Marcas
- **SIMIDS** = Empresa de software (desarrollo)
- **Discovery Systems POS** = Empresa de servicio y productos (cara al cliente)
- **POS Latino** = Dominio usado para demos de clientes nube (demo.poslatino.com → [cliente].poslatino.com)

---

## 👥 EQUIPO

| Persona | Rol | Ciudad | Horario | Contacto |
|---|---|---|---|---|
| **Elkin Daniel Castillo Pérez** | Director General, Ventas, Soporte PM, Admin | Bucaramanga | Todo el día, soporte 1pm-6pm | 📱 3155962626 (personal), 3205792169 (empresa) |
| **Sebastián Castillo** | Soporte AM | Bucaramanga | 9am-1pm | 📱 3132766537 |
| **Gilmer** | Desarrollo | - | - | - |
| **Keren Hapuc** | Ventas | Bogotá | - | - |
| **Anaid** | Ventas | Bucaramanga | - | - |
| **Darney** | Ventas | Medellín | - | - |
| **Daniel (Elkin)** | Ventas | Colombia (general) | - | 3205792169 |

### Turnos de Soporte
- **Lun-Vie:** Sebastián (9am-1pm) → Daniel (1pm-6pm)
- **Sáb-Dom:** Solo Daniel, emergencias

---

## 📱 NÚMEROS DE WHATSAPP

| Número | Ciudad/Uso | Asesor IA | Estado |
|---|---|---|---|
| +57 316 430 0656 | Bogotá (Ventas) | Keren Hapuc | WA Business |
| +57 317 011 1292 | Bucaramanga (Ventas) | Anaid | WA Business |
| +57 320 579 2169 | Colombia General (Ventas + Todo) | Daniel | WA Business |
| +57 310 223 7414 | Soporte Técnico | Soporte Discovery | WA Business |
| +57 315 596 2626 | Personal Daniel | - | Personal |
| +57 313 276 6537 | Personal Sebastián | - | Personal |

### Números Pendientes de Crear
- Cali, Medellín (Darney), Pasto, Barranquilla, Cúcuta

---

## 💰 PLANES Y PRECIOS

| Plan | Precio Mensual | Precio Semestral | Precio Anual | Notas |
|---|---|---|---|---|
| ☁️ Nube | $35.000 | $175.000 (paga 5) | $350.000 (paga 10) | Exento IVA |
| ☁️+📄 Nube + F.E. | $55.000 | $275.000 (paga 5) | $550.000 (paga 10) | Exento IVA |
| 🖥️ Local | N/A (pago único) | - | - | Soporte gratuito |
| 📦 Multi-Nube | Descuento especial | Negociable | Negociable | Clientes con varias sedes |

### Descuentos
- **Semestral:** Paga 5 meses, lleva 6 (ahorro 1 mes = ~17% OFF)
- **Anual:** Paga 10 meses, lleva 12 (ahorro 2 meses = ~17% OFF)
- **Multi-nube:** Descuento por volumen (definir tabla)

---

## 🏦 DATOS BANCARIOS

| Método | Datos |
|---|---|
| **Bancolombia Ahorros** | 91211173063 — Elkin Daniel Castillo Pérez |
| **Nequi** | 3205792169 |
| **BREV** | 3205792169 |
| **Daviplata** | 3155962626 |
| **Wompi** | Configurado (credenciales pendientes de integrar) |
| **Bold** | Tiene cuenta, sin configurar |

---

## 📅 REGLAS DE COBRO

| Regla | Valor |
|---|---|
| **Día de facturación** | Día 28 del mes anterior |
| **Fecha límite de pago** | Día 5 del mes en curso |
| **Suspensión por mora** | Día 5 (se desconecta la nube) |
| **Gracia antes de "moroso"** | 1 mes |
| **Comprobante de pago** | Cliente envía por WhatsApp o sube al portal |
| **Activación** | Manual por Daniel (futuro: automática) |
| **Factura electrónica** | Se genera después del pago confirmado |

### Secuencia de Cobro Automático
```
Día 28 (mes anterior): Cuenta de cobro + link de pago
Día 1: Recordatorio suave
Día 5: Aviso de vencimiento (se desconecta si no paga)
Día 8: Recordatorio firme
Día 12: Aviso de suspensión
Día 15: Escalar a Daniel
Día 30: Decisión final (cancelar contrato?)
```

---

## 🖥️ INFRAESTRUCTURA TÉCNICA

### Clientes
| Tipo | Cantidad | Tecnología |
|---|---|---|
| 🖥️ Local (localhost:3000) | ~500+ | Node.js + MongoDB local |
| ☁️ Nube | ~120 | Node.js + MongoDB en DigitalOcean |
| ☁️+📄 Nube + F.E. | ~80 | Node.js + MongoDB en DigitalOcean |

### Servidores
- **DigitalOcean** — 3 droplets ("gotas") compartidos
- Cada gota tiene varios clientes
- Dominio: [cliente].poslatino.com
- Acceso por consola DigitalOcean

### CRM / Wizard
- **Frontend:** Vercel (dspos.vercel.app)
- **Backend API:** Vercel (serverless functions) + Express
- **Base de datos CRM:** Supabase (PostgreSQL)
- **Repositorio:** github.com/simidscolombia/dsposcrm

### Activación/Desactivación
- Ya tiene API programada (Node + MongoDB)
- Pendiente de compartir endpoint para integración
- Por ahora: manual vía Daniel

---

## 🎧 SOPORTE TÉCNICO

### Top 5 Problemas y Soluciones

#### 🔴 #1: Sistema no arranca / Error 502 / Sin conexión
**Causa:** Servicios MongoDB o Node no iniciaron
**Soluciones (en orden):**
1. Ejecutar acceso directo "Cliente Existente" en escritorio
2. Verificar Windows Update, instalar actualizaciones pendientes
3. Administrador de Tareas → verificar que Node.js y MongoDB estén corriendo

#### 🟡 #2: Impresora no imprime
**Causa:** Cable USB desconectado o cambiado de puerto
**Soluciones:**
1. Verificar conexión USB, poner en el mismo puerto original
2. Si cambiaron puerto: reinstalar impresora desde Panel de Control

#### 🟡 #3: Báscula no funciona
**Causa:** Puerto COM desconfigurado
**Solución:** Dispositivos e Impresoras → ver puerto COM → configurar en el POS

#### 🔴 #4: No acepta usuario/contraseña
**Causas:** Contraseña incorrecta O MongoDB detenido
**Soluciones:**
1. Verificar mayúsculas/minúsculas en contraseña
2. Administrador de Tareas → iniciar servicio MongoDB
3. Si persiste: reinstalar programa
4. Último recurso: reinstalar sistema operativo

#### 🟢 #5: Token inválido
**Causa:** Sesión expirada por inactividad
**Solución:** Presionar F5 para refrescar la página

### Hardware Común
- **Impresoras:** XPrinter 58mm y 80mm, SAT
- **Básculas:** Varias (pendiente documentar)
- **Lectores:** Varios (ver catálogo de productos)
- **Acceso remoto:** AnyDesk (IDs no documentados, se piden al momento)

---

## 🤖 AGENTES DE IA

### Configuración
- **Nombres:** Reales de los vendedores
- **Personalidad:** Humana, el cliente NO debe saber que es IA
- **Tono:** Informal, tutea, cercano, adaptado por ciudad
- **Restricciones:** No revelar datos financieros, info de otros clientes, datos internos
- **Soporte:** "[Nombre] de Discovery Systems POS [Ciudad]"

### Agentes por Ciudad
| Ciudad | Nombre Agente (Ventas) | Nombre Soporte |
|---|---|---|
| Bogotá | Keren Hapuc | Soporte de Discovery Systems POS Bogotá |
| Bucaramanga | Anaid | Soporte de Discovery Systems POS Bucaramanga |
| Medellín | Darney | Soporte de Discovery Systems POS Medellín |
| Colombia | Daniel | Soporte de Discovery Systems POS Colombia |

---

## 📅 DEMOS Y CALENDARIO

| Config | Valor |
|---|---|
| **Quién hace demos** | Daniel, Sebastián, vendedores (futuro: IA con supervisión) |
| **Duración** | 20-30 minutos |
| **Plataforma** | Google Meet (preferido), presencial (evitar) |
| **Horario** | 9:00 AM - 8:00 PM |
| **Calendar** | Google Calendar (tiene pero no usa) |
| **Google Workspace** | No tiene (no es necesario por ahora) |

---

## 📊 ORDEN DE IMPLEMENTACIÓN

### Prioridad definida por Daniel:
> "Iniciar por el orden desde que entra el cliente hasta que sale la venta,
> luego el tema de soporte y seguimiento."

### Fases:

```
FASE 1: BASE DEL CRM + FLUJO DE VENTA COMPLETO
════════════════════════════════════════════════
1.1 — Base de datos del CRM (tablas en Supabase)
1.2 — Guardar leads automáticamente desde el wizard
1.3 — Panel Admin: Pipeline de ventas (Kanban)
1.4 — Panel Admin: Ficha del cliente
1.5 — Funcionalidad del QuoteFinal (PDF, WhatsApp, Demo)

FASE 2: SISTEMA DE COBROS AUTOMATIZADO
════════════════════════════════════════
2.1 — Tabla de clientes con planes y pagos
2.2 — Generación automática de cuentas de cobro
2.3 — Integración Wompi (links de pago)
2.4 — Secuencia automática de cobro (notificaciones)
2.5 — Dashboard de cobros (quién pagó, quién no)
2.6 — Upload de comprobantes + verificación

FASE 3: INTEGRACIÓN WHATSAPP
════════════════════════════
3.1 — Configurar Meta Cloud API
3.2 — Webhook para recibir mensajes
3.3 — Envío automático de notificaciones
3.4 — Agente IA de ventas (primer contacto)
3.5 — Agente IA de soporte (Nivel 1)

FASE 4: PANEL DEL CLIENTE
═════════════════════════
4.1 — Autenticación por teléfono (magic link)
4.2 — Ver cotizaciones y estado
4.3 — Ver mensajes con su asesor
4.4 — Subir comprobantes de pago
4.5 — Tickets de soporte

FASE 5: SOPORTE CON IA
═══════════════════════
5.1 — Sistema de tickets con niveles
5.2 — Base de conocimiento
5.3 — Escalación inteligente
5.4 — Handoff IA ↔ Humano
5.5 — Aprendizaje automático

FASE 6: CALENDARIO + DEMOS
═══════════════════════════
6.1 — Calendario interno de citas
6.2 — Agendamiento desde WhatsApp
6.3 — Integración Google Calendar
6.4 — Recordatorios automáticos

FASE 7: DASHBOARD Y MÉTRICAS
═════════════════════════════
7.1 — Métricas de ventas
7.2 — Métricas de soporte
7.3 — Métricas de cobros
7.4 — Reportes
```

---

## 📝 PENDIENTES POR SOLICITAR A DANIEL

- [ ] Logo de la empresa
- [ ] Paleta de colores oficial (imágenes de referencia)
- [ ] Credenciales Wompi (API keys)
- [ ] Acceso Meta Business Manager (verificar)
- [ ] Lista de 200 clientes (Drive - CSV/Excel)
- [ ] API de activación/desactivación del POS
- [ ] Canal de YouTube con tutoriales
- [ ] Información de competidores (para entrenamiento IA)
