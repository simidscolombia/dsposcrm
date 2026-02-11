// api/ai/chatbot.js
// Vercel Serverless Function para el chatbot de Discovery Systems
// Este archivo va en: frontend/api/ai/chatbot.js

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Eres un asistente virtual de Discovery Systems, experto en sistemas POS.

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

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { question, context, leadId } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'La pregunta debe tener al menos 3 caracteres',
      });
    }

    const contextInfo = context?.quote
      ? `\n\nContexto de la cotización del cliente:\n${JSON.stringify(context.quote, null, 2)}`
      : '';

    const startTime = Date.now();

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: question + contextInfo,
        },
      ],
    });

    const responseTime = Date.now() - startTime;
    const answer = response.content[0].text;
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    // Calcular costo
    const inputCost = (response.usage.input_tokens / 1_000_000) * 1.0;
    const outputCost = (response.usage.output_tokens / 1_000_000) * 5.0;
    const cost = (inputCost + outputCost).toFixed(6);

    return res.status(200).json({
      success: true,
      answer,
      metadata: {
        tokensUsed,
        cost,
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    console.error('Error en chatbot:', error);
    return res.status(500).json({
      success: false,
      error: 'Error procesando pregunta',
      answer: 'Disculpa, no pude procesar tu pregunta. ¿Quieres hablar con un asesor? 😊',
    });
  }
}
