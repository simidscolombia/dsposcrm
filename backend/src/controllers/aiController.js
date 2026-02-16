// backend/src/controllers/aiController.js
// Controlador para endpoints de IA

import claudeService from '../services/geminiService.js';
import db from '../config/database.js';

class AIController {
  /**
   * POST /api/ai/analyze-business
   * Analiza la descripción del negocio y genera preguntas inteligentes
   */
  async analyzeBusinessDescription(req, res) {
    try {
      const { description, previousAnswers, leadId } = req.body;

      if (!description || description.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'La descripción del negocio debe tener al menos 10 caracteres',
        });
      }

      const startTime = Date.now();

      // Llamar a Claude AI
      const result = await claudeService.analyzeBusinessDescription(
        description,
        previousAnswers || []
      );

      const responseTime = Date.now() - startTime;

      // Guardar en analytics (tracking de costos)
      if (leadId) {
        await db.query(
          `INSERT INTO ai_interactions 
           (lead_id, interaction_type, question, ai_response, model_used, 
            tokens_used, cost_usd, response_time_ms, success, context_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            leadId,
            'wizard_analysis',
            description,
            JSON.stringify(result.analysis),
            'claude-3-5-haiku-20241022',
            result.tokensUsed || 0,
            result.cost || 0,
            responseTime,
            result.success,
            JSON.stringify({ previousAnswers }),
          ]
        );
      }

      return res.json({
        success: true,
        analysis: result.analysis,
        metadata: {
          tokensUsed: result.tokensUsed,
          cost: result.cost,
          responseTime: `${responseTime}ms`,
        },
      });
    } catch (error) {
      console.error('Error en analyze-business:', error);
      return res.status(500).json({
        success: false,
        error: 'Error procesando la solicitud',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * POST /api/ai/generate-quote
   * Genera una cotización personalizada con IA
   */
  async generatePersonalizedQuote(req, res) {
    try {
      const { leadData, wizardAnswers, leadId } = req.body;

      if (!leadData || !wizardAnswers) {
        return res.status(400).json({
          success: false,
          error: 'Faltan datos requeridos',
        });
      }

      const startTime = Date.now();

      // Llamar a Claude AI
      const result = await claudeService.generatePersonalizedQuote(
        leadData,
        wizardAnswers
      );

      const responseTime = Date.now() - startTime;

      // CRM: Captura de Lead (Simulado por ahora)
      console.log('CRM LEAD CAPTURED:', {
        name: leadData.name,
        description: wizardAnswers.businessDescription,
        prize: wizardAnswers.prizeWon,
        contact: leadData.whatsapp
      });

      // Guardar en analytics
      if (leadId) {
        await db.query(
          `INSERT INTO ai_interactions 
           (lead_id, interaction_type, question, ai_response, model_used, 
            tokens_used, cost_usd, response_time_ms, success, context_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            leadId,
            'quote_generation',
            JSON.stringify(wizardAnswers),
            JSON.stringify(result.quote),
            'claude-3-5-haiku-20241022',
            result.tokensUsed || 0,
            result.cost || 0,
            responseTime,
            result.success,
            JSON.stringify({ leadData }),
          ]
        );
      }

      return res.json({
        success: true,
        quote: result.quote,
        metadata: {
          tokensUsed: result.tokensUsed,
          cost: result.cost,
          responseTime: `${responseTime}ms`,
        },
      });
    } catch (error) {
      console.error('Error en generate-quote:', error);
      return res.status(500).json({
        success: false,
        error: 'Error generando cotización',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * POST /api/ai/chatbot
   * Responde preguntas del chatbot con IA
   */
  async chatbotResponse(req, res) {
    try {
      const { question, context, leadId } = req.body;

      if (!question || question.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: 'La pregunta debe tener al menos 3 caracteres',
        });
      }

      const startTime = Date.now();

      // Llamar a Claude AI
      const result = await claudeService.chatbotResponse(
        question,
        context || {}
      );

      const responseTime = Date.now() - startTime;

      // Guardar en analytics
      if (leadId) {
        await db.query(
          `INSERT INTO ai_interactions 
           (lead_id, interaction_type, question, ai_response, model_used, 
            tokens_used, cost_usd, response_time_ms, success, context_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            leadId,
            'chatbot_response',
            question,
            result.answer,
            'claude-3-5-haiku-20241022',
            result.tokensUsed || 0,
            result.cost || 0,
            responseTime,
            result.success,
            JSON.stringify(context),
          ]
        );
      }

      return res.json({
        success: true,
        answer: result.answer,
        metadata: {
          tokensUsed: result.tokensUsed,
          cost: result.cost,
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

  /**
   * GET /api/ai/stats
   * Obtiene estadísticas de uso de IA
   */
  async getAIStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const query = `
        SELECT 
          interaction_type,
          COUNT(*) as total_interactions,
          SUM(tokens_used) as total_tokens,
          SUM(cost_usd) as total_cost_usd,
          AVG(response_time_ms) as avg_response_time_ms,
          COUNT(CASE WHEN success = TRUE THEN 1 END) as successful,
          COUNT(CASE WHEN success = FALSE THEN 1 END) as failed
        FROM ai_interactions
        WHERE created_at >= COALESCE($1::timestamp, NOW() - INTERVAL '30 days')
        AND created_at <= COALESCE($2::timestamp, NOW())
        GROUP BY interaction_type
        ORDER BY total_interactions DESC
      `;

      const result = await db.query(query, [startDate || null, endDate || null]);

      // Totales generales
      const totalsQuery = `
        SELECT 
          COUNT(*) as total_interactions,
          SUM(tokens_used) as total_tokens,
          SUM(cost_usd) as total_cost_usd,
          AVG(response_time_ms) as avg_response_time_ms
        FROM ai_interactions
        WHERE created_at >= COALESCE($1::timestamp, NOW() - INTERVAL '30 days')
        AND created_at <= COALESCE($2::timestamp, NOW())
      `;

      const totalsResult = await db.query(totalsQuery, [startDate || null, endDate || null]);

      return res.json({
        success: true,
        byType: result.rows,
        totals: totalsResult.rows[0],
        period: {
          start: startDate || 'last 30 days',
          end: endDate || 'now',
        },
      });
    } catch (error) {
      console.error('Error obteniendo stats de IA:', error);
      return res.status(500).json({
        success: false,
        error: 'Error obteniendo estadísticas',
      });
    }
  }

  /**
   * GET /api/ai/cost-summary
   * Obtiene resumen de costos de IA
   */
  async getCostSummary(req, res) {
    try {
      const query = `
        SELECT * FROM ai_cost_summary
        ORDER BY date DESC
        LIMIT 30
      `;

      const result = await db.query(query);

      return res.json({
        success: true,
        summary: result.rows,
      });
    } catch (error) {
      console.error('Error obteniendo cost summary:', error);
      return res.status(500).json({
        success: false,
        error: 'Error obteniendo resumen de costos',
      });
    }
  }
}

export default new AIController();
