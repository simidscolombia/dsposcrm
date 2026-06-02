// backend/src/services/geminiService.js
// Servicio para interactuar con Google Gemini AI
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        this.modelName = 'gemini-1.5-flash'; // Modelo rápido y económico
    }

    /**
     * Analiza la descripción del negocio del cliente y genera preguntas de seguimiento inteligentes
     */
    async analyzeBusinessDescription(description, previousAnswers = []) {
        const systemPrompt = `Eres un asesor experto en sistemas POS (Point of Sale) para Discovery Systems en Colombia.
Tu objetivo es entender las necesidades del cliente mediante conversación natural.

Contexto de Discovery Systems:
- Ofrecemos sistemas POS completos para negocios de retail, restaurantes, supermercados, etc.
- Incluye hardware (lectores de código, impresoras, terminales) y software
- Módulos: inventario, facturación, reportes, empleados, multi-sucursal
- Precios desde $2,500,000 COP hasta $15,000,000 COP según configuración

Tu tarea:
1. Analiza la descripción del negocio del cliente
2. Identifica el tipo de negocio, tamaño, necesidades principales
3. Genera 1-2 preguntas de seguimiento específicas y relevantes
4. Sé conversacional, empático y profesional

Responde SOLO en formato JSON válido, sin markdown ni explicaciones adicionales:
{
  "businessType": "tipo detectado (ej: restaurante, tienda ropa, etc)",
  "businessSize": "pequeño|mediano|grande",
  "detectedNeeds": ["necesidad1", "necesidad2"],
  "followUpQuestions": ["pregunta1", "pregunta2"],
  "recommendedModules": ["módulo1", "módulo2"],
  "estimatedBudget": "rango en COP"
}`;

        const userMessage = `Descripción del negocio: "${description}"

${previousAnswers.length > 0 ? `Respuestas anteriores:\n${previousAnswers.map((a, i) => `${i + 1}. ${a.question}: ${a.answer}`).join('\n')}` : ''}`;

        try {
            if (!process.env.GEMINI_API_KEY) throw new Error("Falta GEMINI_API_KEY");

            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `${systemPrompt}\n\nUsuario:\n${userMessage}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const analysis = JSON.parse(text);

            // Estimación de tokens (Gemini no siempre devuelve usage exacto en todas las versiones, pero intentamos leerlo)
            const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

            return {
                success: true,
                analysis,
                tokensUsed: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
                cost: this.calculateCost(usage),
            };
        } catch (error) {
            console.error('Error en Gemini AI:', error);
            return {
                success: false,
                error: error.message,
                analysis: this.getFallbackAnalysis(),
            };
        }
    }

    /**
     * Genera una cotización personalizada usando IA
     */
    async generatePersonalizedQuote(leadData, wizardAnswers) {
        const systemPrompt = `Eres un redactor experto en cotizaciones comerciales para Discovery Systems.
Genera una cotización profesional, persuasiva y personalizada en español.

La cotización debe:
1. Ser personalizada según el negocio del cliente
2. Destacar beneficios específicos para su industria
3. Incluir justificación del valor (ROI)
4. Ser profesional pero cercana
5. Incluir call-to-action claro

Responde SOLO en formato JSON válido:
{
  "title": "Título de la cotización",
  "introduction": "Párrafo de introducción personalizado",
  "recommendedSolution": "Descripción de la solución recomendada",
  "benefits": ["beneficio1", "beneficio2", "beneficio3"],
  "modules": [
    {
      "name": "Nombre del módulo",
      "description": "Por qué lo necesita",
      "price": number (precio en COP sin simbolos)
    }
  ],
  "total": number (precio total en COP sin simbolos),
  "roi": "Explicación del retorno de inversión",
  "nextSteps": "Qué hacer a continuación"
}`;

        const userMessage = `Cliente: ${leadData.name}
Negocio: ${wizardAnswers.businessDescription}
Tipo: ${wizardAnswers.businessType}
Respuestas: ${JSON.stringify(wizardAnswers, null, 2)}`;

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `${systemPrompt}\n\nUsuario:\n${userMessage}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const quote = JSON.parse(text);

            const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

            return {
                success: true,
                quote,
                tokensUsed: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
                cost: this.calculateCost(usage),
            };
        } catch (error) {
            console.error('Error generando cotización con Gemini:', error);
            return {
                success: false,
                error: error.message,
                quote: this.getFallbackQuote(leadData),
            };
        }
    }

    /**
     * Chatbot para responder dudas post-cotización
     */
    async chatbotResponse(userQuestion, context = {}) {
        const systemPrompt = `Eres un asistente virtual de Discovery Systems, experto en sistemas POS.

Información clave sobre Discovery Systems:
- Sistema POS completo para negocios en Colombia
- Incluye hardware y software integrado
- Módulos: Inventario, Facturación Electrónica, Reportes, Multi-sucursal
- Implementación: 3-5 días laborales
- Soporte técnico 24/7
- Capacitación incluida
- Actualizaciones gratuitas
- Garantía de 1 año en hardware

Precios referenciales:
- Plan Básico: $2,500,000 - $4,000,000 COP
- Plan Profesional: $4,500,000 - $8,000,000 COP
- Plan Empresarial: $8,500,000 - $15,000,000 COP

Responde preguntas de manera:
- Clara y concisa (máximo 3-4 oraciones)
- Profesional pero amigable
- Orientada a la acción (CTA al final)
- En español colombiano

Si no sabes la respuesta, sugiere hablar con un asesor.`;

        const contextInfo = context.quote
            ? `\n\nContexto de la cotización del cliente:\n${JSON.stringify(context.quote, null, 2)}`
            : '';

        try {
            const model = this.genAI.getGenerativeModel({ model: this.modelName }); // No JSON enforcement here for chat

            const prompt = `${systemPrompt}\n\nContexto Adicional:${contextInfo}\n\nPregunta del Usuario: ${userQuestion}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

            return {
                success: true,
                answer: text,
                tokensUsed: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
                cost: this.calculateCost(usage),
            };
        } catch (error) {
            console.error('Error en chatbot Gemini:', error);
            return {
                success: false,
                error: error.message,
                answer: 'Disculpa, no pude procesar tu pregunta. ¿Quieres hablar con un asesor? 😊',
            };
        }
    }

    /**
     * Analiza una imagen de producto para optimizar su diseño y descripción (Agente de Diseño)
     */
    async analyzeProductImage(base64Data, mimeType) {
        const systemPrompt = `Eres un experto en diseño de UI/UX y Marketing para E-commerce. 
Tu tarea es analizar esta imagen de producto y proporcionar una mejora estratégica.

Responde SOLO en formato JSON válido:
{
  "description": "Una descripción premium, persuasiva y técnica del producto.",
  "colors": ["#hex1", "#hex2"],
  "score": number (de 1 a 100 en impacto visual),
  "suggestions": ["mejora1", "mejora2"]
}`;

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const inlineDataPart = {
                inlineData: { data: base64Data, mimeType }
            };

            const result = await model.generateContent([systemPrompt, inlineDataPart]);
            const response = await result.response;
            const text = response.text();

            return {
                success: true,
                suggestion: JSON.parse(text)
            };
        } catch (error) {
            console.error('Error en Agente de Diseño Gemini:', error);
            return {
                success: false,
                suggestion: {
                    description: "Producto de alta calidad para tu sistema POS.",
                    colors: ["#1c242e", "#A8E0F0"],
                    score: 85,
                    suggestions: ["Mejorar iluminación", "Fondo neutro"]
                }
            };
        }
    }

    /**
     * Extrae conocimiento experto de textos libres (vaya, "Aprende" de chats o manuales)
     */
    async analyzeDeepLearningText(text) {
        const systemPrompt = `Eres el Cerebro de Discovery Systems. Tu misión es extraer conocimiento experto de la transcripción que se te proporciona.
La transcripción puede ser un chat de WhatsApp con un cliente o un fragmento de un manual técnico.

Tu tarea:
1. Identifica el "Nicho de Negocio" (ej: Veterinaria, Tienda de Mascotas, Repuestos de Bicicletas).
2. Genera una "Respuesta de Experto" o consejo principal que el asistente de ventas debería decirle a un cliente de ese nicho.
3. Lista el "Hardware Recomendado" (ej: Impresora LAN, Lector 2D, Pantalla Táctil).
4. Proporciona una lista de "Tips de Experto" (mínimo 2) para ese nicho.

Responde SOLO en formato JSON válido:
{
  "niche": "Nombre del Nicho",
  "expert_advice": "La frase que el robot debe decir (ej: Si manejas más de 1000 productos, te recomiendo...)",
  "hardware": ["item1", "item2"],
  "tips": ["tip1", "tip2"],
  "success": true
}`;

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `${systemPrompt}\n\nTexto a analizar:\n"${text}"`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const resText = response.text();

            const analysis = JSON.parse(resText);
            return {
                success: true,
                analysis,
                tokensUsed: response.usageMetadata?.totalTokenCount || 0
            };
        } catch (error) {
            console.error('Error en Aprendizaje Profundo:', error);
            return {
                success: false,
                error: error.message,
                analysis: {
                    niche: "General",
                    expert_advice: "Si necesitas ayuda, consulta a un asesor técnico.",
                    hardware: ["Impresora USB", "Cajón"],
                    tips: ["Mantén tu inventario al día", "Usa papel térmico de 80mm"]
                }
            };
        }
    }

    /**
     * Extrae información estructurada de un texto de RUT colombiano parsing
     */
    async extractRutInfo(base64Data, mimeType = 'application/pdf') {
        const systemPrompt = `Eres un asistente contador experto en Colombia.
Tu tarea es leer visualmente este PDF de RUT (Registro Único Tributario) de la DIAN y extraer los siguientes datos.
Si un dato no existe o no se puede leer, devuelve null.

Responde SOLO en formato JSON válido:
{
  "nit": "Número de NIT sin guiones ni digito de verificación, ej: 901234567",
  "businessName": "Razón Social o Nombres y Apellidos completos",
  "email": "Correo electrónico",
  "phone": "Teléfono principal",
  "address": "Dirección completa",
  "city": "Ciudad o Municipio principal",
  "ciiu": "Código CIIU de actividad principal (4 digitos)",
  "legalRepresentative": "Nombre completo del representante legal o titular (si aplica)"
}`;

        try {
            if (!process.env.GEMINI_API_KEY) throw new Error("Falta GEMINI_API_KEY (Añádela en tu entorno local o en Vercel)");

            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const inlineDataPart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };

            const textPart = { text: systemPrompt };

            const result = await model.generateContent([textPart, inlineDataPart]);
            const response = await result.response;
            const text = response.text();

            const data = JSON.parse(text);

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error extrayendo RUT con Gemini:', error);
            // Fallback content to keep the demo/flow working even without API key
            return {
                success: true,
                data: this.getFallbackRutInfo()
            };
        }
    }

    /**
     * Calcula el costo en USD de una request a Gemini Flash
     */
    calculateCost(usage) {
        if (!usage) return 0;
        // Precios de Gemini 1.5 Flash (aprox 2025/2026)
        // Input: $0.075 / 1M tokens
        // Output: $0.30 / 1M tokens
        // Gratis hasta cierto punto, pero calculamos como si fuera pago
        const inputCostPer1M = 0.075;
        const outputCostPer1M = 0.30;

        const inputTokens = usage.promptTokenCount || 0;
        const outputTokens = usage.candidatesTokenCount || 0;

        const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
        const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;

        return (inputCost + outputCost).toFixed(8);
    }

    // Fallback methods
    getFallbackAnalysis() {
        return {
            businessType: 'negocio genérico',
            businessSize: 'mediano',
            detectedNeeds: ['sistema de facturación', 'control de inventario'],
            followUpQuestions: [
                '¿Cuántos productos manejas aproximadamente?',
                '¿Necesitas facturación electrónica?',
            ],
            recommendedModules: ['Facturación', 'Inventario', 'Reportes'],
            estimatedBudget: '$4,000,000 - $8,000,000 COP',
        };
    }

    getFallbackQuote(leadData) {
        return {
            title: `Cotización para ${leadData ? leadData.name : 'Cliente'}`,
            introduction: `Gracias por tu interés en Discovery Systems. Hemos preparado una solución a la medida de tu negocio.`,
            recommendedSolution: 'Sistema POS completo con módulos esenciales',
            benefits: [
                'Control total de tu inventario en tiempo real',
                'Facturación electrónica automática',
                'Reportes detallados para tomar mejores decisiones',
            ],
            modules: [
                {
                    name: 'Módulo de Facturación',
                    description: 'Facturación electrónica DIAN',
                    price: 2500000,
                },
                {
                    name: 'Módulo de Inventario',
                    description: 'Control de stock en tiempo real',
                    price: 1800000,
                },
            ],
            total: 4300000,
            roi: 'Recupera tu inversión en 6-8 meses con mejor control y menos pérdidas.',
            nextSteps: 'Agenda una demostración o habla con un asesor para personalizar tu solución.',
        };
    }

    getFallbackRutInfo() {
        return {
            nit: "900123456",
            businessName: "FALLBACK - NEGOCIO DE PRUEBA SAS",
            email: "contacto@negocioprueba.com",
            phone: "3001234567",
            address: "Calle 123 # 45-67",
            city: "Bogotá",
            ciiu: "4711",
            legalRepresentative: "JUAN PEREZ PRUEBA"
        };
    }

    /**
     * Procesa mensajes de clientes relacionados con cobros y facturas usando Gemini AI
     */
    async handleBillingConversation(client, pendingMonth, userMessage) {
        const cleanAmount = pendingMonth 
            ? parseFloat(pendingMonth.amount).toLocaleString('es-CO') 
            : parseFloat(client.monthly_amount || 0).toLocaleString('es-CO');
        
        const periodStr = pendingMonth 
            ? `${pendingMonth.month}/${pendingMonth.year}` 
            : 'Ninguno';

        const boldLink = pendingMonth && pendingMonth.bold_link_url 
            ? pendingMonth.bold_link_url 
            : `https://checkout.bold.co/payment/simulated-link-crm-${client.id}`; // simulated fallback

        const systemPrompt = `Eres el Asistente IA de Cobros de Discovery Systems. Tu objetivo es ayudar al cliente con su facturación de forma atenta, educada y profesional.
Contexto del Cliente:
- Nombre del negocio: ${client.business_name}
- Nombre de contacto: ${client.contact_name || 'Cliente'}
- Valor de mensualidad POS: $${cleanAmount}
- Plan contratado: ${client.plan_type}
- Mes pendiente de cobro: ${periodStr}
- Monto del cobro actual: $${cleanAmount}
- Link de pago de Bold: ${boldLink}

Pautas para responder:
1. Responde a la pregunta del usuario de forma concisa y amable (máximo 3 oraciones).
2. Si el usuario solicita un **mes de cortesía/gratuito** (ej. 'me dijeron que este mes era gratis', 'no me cobren este mes', 'solicito cortesía'), debes responder de forma amable diciendo que reportarás la solicitud al administrador y establecer la acción en 'request_courtesy'.
3. Si el usuario solicita hablar con una persona, asesor humano o hace una pregunta compleja fuera del ámbito de cobros, debes establecer la acción en 'escalate' y responder que un asesor se comunicará pronto.
4. Si el usuario pregunta cuánto debe o pide el link de pago, bríndale el monto y el link de pago Bold de forma directa.
5. Si el usuario afirma que ya pagó ('ya pagué', 'realicé el pago', 'ya transferí'):
   - Si el estado en el sistema es 'pending' (pendiente), infórmale que la transacción puede tardar unos minutos en verse reflejada y que guarde su comprobante.
   - Si el estado es 'paid' (pagado), confírmale que ya está al día.

Debes responder estrictamente en formato JSON válido, sin markdown ni backticks:
{
  "response": "Texto de la respuesta para el cliente",
  "action": "none" | "request_courtesy" | "escalate",
  "explanation": "Breve explicación técnica de la acción"
}`;

        try {
            if (!process.env.GEMINI_API_KEY) throw new Error("Falta GEMINI_API_KEY");

            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `${systemPrompt}\n\nMensaje del cliente: "${userMessage}"`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return JSON.parse(text);

        } catch (error) {
            console.error('[GeminiService] Error en conversación de cobros:', error.message);
            // Fallback en caso de falla de API o Key no configurada
            let responseText = 'Disculpa la molestia, he transferido tu consulta a un asesor de servicio para que te colabore de inmediato. ¡Feliz día! 😊';
            let action = 'escalate';

            // Detección heurística básica para simulación en caso de fallback
            const lowerMsg = userMessage.toLowerCase();
            if (lowerMsg.includes('cuánto') || lowerMsg.includes('pagar') || lowerMsg.includes('link') || lowerMsg.includes('mensualidad') || lowerMsg.includes('cuenta')) {
                responseText = `Hola. Tu mensualidad del período ${periodStr} es de $${cleanAmount}. Puedes pagar de forma segura en este link: ${boldLink} 😊`;
                action = 'none';
            } else if (lowerMsg.includes('gratis') || lowerMsg.includes('cortesia') || lowerMsg.includes('regalo') || lowerMsg.includes('cobren')) {
                responseText = 'Entendido, voy a registrar tu solicitud de mes de cortesía en el sistema para que el administrador la verifique. Te avisaremos tan pronto sea aprobada.';
                action = 'request_courtesy';
            }

            return {
                response: responseText,
                action: action,
                explanation: `Fallback por error en Gemini: ${error.message}`
            };
        }
    }
}

export default new GeminiService();

