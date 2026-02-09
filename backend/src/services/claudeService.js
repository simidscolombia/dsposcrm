// backend/src/services/claudeService.js
// Servicio para interactuar con Claude AI (Anthropic)

import Anthropic from '@anthropic-ai/sdk';

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    this.model = 'claude-3-5-haiku-20241022'; // Modelo más económico
    this.maxTokens = 1024;
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

Responde SOLO en formato JSON:
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
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const content = response.content[0].text;
      const analysis = JSON.parse(content);

      return {
        success: true,
        analysis,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        cost: this.calculateCost(response.usage),
      };
    } catch (error) {
      console.error('Error en Claude AI:', error);
      return {
        success: false,
        error: error.message,
        // Fallback a preguntas estándar
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

Responde en formato JSON:
{
  "title": "Título de la cotización",
  "introduction": "Párrafo de introducción personalizado",
  "recommendedSolution": "Descripción de la solución recomendada",
  "benefits": ["beneficio1", "beneficio2", "beneficio3"],
  "modules": [
    {
      "name": "Nombre del módulo",
      "description": "Por qué lo necesita",
      "price": precio_en_cop
    }
  ],
  "total": precio_total,
  "roi": "Explicación del retorno de inversión",
  "nextSteps": "Qué hacer a continuación"
}`;

    const userMessage = `Cliente: ${leadData.name}
Negocio: ${wizardAnswers.businessDescription}
Tipo: ${wizardAnswers.businessType}
Respuestas: ${JSON.stringify(wizardAnswers, null, 2)}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048, // Más tokens para cotización completa
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const content = response.content[0].text;
      const quote = JSON.parse(content);

      return {
        success: true,
        quote,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        cost: this.calculateCost(response.usage),
      };
    } catch (error) {
      console.error('Error generando cotización:', error);
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
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userQuestion + contextInfo,
          },
        ],
      });

      return {
        success: true,
        answer: response.content[0].text,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        cost: this.calculateCost(response.usage),
      };
    } catch (error) {
      console.error('Error en chatbot:', error);
      return {
        success: false,
        error: error.message,
        answer: 'Disculpa, no pude procesar tu pregunta. ¿Quieres hablar con un asesor? 😊',
      };
    }
  }

  /**
   * Calcula el costo en USD de una request a Claude
   */
  calculateCost(usage) {
    // Precios de Claude 3.5 Haiku (al 2026)
    const inputCostPer1M = 1.00; // $1 por 1M tokens
    const outputCostPer1M = 5.00; // $5 por 1M tokens

    const inputCost = (usage.input_tokens / 1_000_000) * inputCostPer1M;
    const outputCost = (usage.output_tokens / 1_000_000) * outputCostPer1M;

    return (inputCost + outputCost).toFixed(6);
  }

  /**
   * Análisis de fallback si Claude falla
   */
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

  /**
   * Cotización de fallback si Claude falla
   */
  getFallbackQuote(leadData) {
    return {
      title: `Cotización para ${leadData.name}`,
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
}

export default new ClaudeService();
