// backend/src/services/whatsappService.js
// Servicio para envío automático de mensajes por WhatsApp usando WAHA

import axios from 'axios';

class WhatsAppService {
  constructor() {
    // WAHA (WhatsApp HTTP API) - API no oficial pero funcional
    this.wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
    this.wahaApiKey = process.env.WAHA_API_KEY;
    this.sessionName = process.env.WAHA_SESSION || 'default';
  }

  /**
   * Envía mensaje de cotización con PDF adjunto
   */
  async sendQuoteMessage(data) {
    const {
      phoneNumber,
      leadName,
      prize,
      pdfUrl,
      total,
    } = data;

    // Formatear número a formato internacional
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const message = this.generateQuoteMessage({
      leadName,
      prize,
      total,
      pdfUrl,
    });

    try {
      // Enviar mensaje de texto
      await this.sendTextMessage(formattedPhone, message.text);

      // Esperar 2 segundos
      await this.sleep(2000);

      // Enviar PDF si está disponible
      if (pdfUrl) {
        await this.sendDocument(formattedPhone, pdfUrl, 'Cotización Discovery Systems.pdf');
      }

      return {
        success: true,
        phone: formattedPhone,
        message: 'Mensaje enviado exitosamente',
      };
    } catch (error) {
      console.error('Error enviando WhatsApp:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Envía un mensaje de texto simple
   */
  async sendTextMessage(phoneNumber, text) {
    const url = `${this.wahaUrl}/api/sendText`;

    const payload = {
      session: this.sessionName,
      chatId: `${phoneNumber}@c.us`,
      text: text,
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.wahaApiKey,
      },
    });

    return response.data;
  }

  /**
   * Envía un documento/archivo
   */
  async sendDocument(phoneNumber, fileUrl, filename) {
    const url = `${this.wahaUrl}/api/sendFile`;

    const payload = {
      session: this.sessionName,
      chatId: `${phoneNumber}@c.us`,
      file: {
        url: fileUrl,
        filename: filename,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.wahaApiKey,
      },
    });

    return response.data;
  }

  /**
   * Envía mensaje de seguimiento (día 1)
   */
  async sendFollowUpDay1(phoneNumber, leadName) {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const message = `Hola ${leadName} 👋

Soy del equipo de Discovery Systems. 

¿Tuviste oportunidad de revisar la cotización que te enviamos ayer?

Me encantaría resolver cualquier duda que tengas sobre nuestro sistema POS 🚀

¿Cuándo podríamos agendar una demo rápida?`;

    try {
      await this.sendTextMessage(formattedPhone, message);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía mensaje de seguimiento (día 3) - Urgencia con premio
   */
  async sendFollowUpDay3(phoneNumber, leadName, prize) {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const message = `🎁 ¡Último día, ${leadName}!

Tu premio "${prize}" está esperándote, pero solo por HOY 🕐

Además, si tomas la decisión esta semana, tenemos un 15% de descuento adicional.

¿Hablamos? Responde este mensaje o llamamos en 5 minutos 📞`;

    try {
      await this.sendTextMessage(formattedPhone, message);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía confirmación de cita agendada
   */
  async sendAppointmentConfirmation(data) {
    const { phoneNumber, leadName, appointmentDate, appointmentTime } = data;
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const message = `✅ ¡Cita confirmada, ${leadName}!

📅 Fecha: ${appointmentDate}
🕐 Hora: ${appointmentTime}

Te llamaremos puntualmente para mostrarte Discovery Systems en acción.

Prepara tus preguntas, ¡será genial! 🚀

¿Necesitas cambiar la hora? Responde a este mensaje.`;

    try {
      await this.sendTextMessage(formattedPhone, message);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Genera el mensaje de cotización
   */
  generateQuoteMessage(data) {
    const { leadName, prize, total, pdfUrl } = data;

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const text = `¡Hola ${leadName}! 🎉

Tu cotización personalizada de Discovery Systems está lista.

${prize ? `🎁 *Premio Ganado:* ${prize}\n` : ''}
💰 *Inversión:* ${formatCurrency(total)}

📥 Tu cotización completa viene adjunta en PDF.

*¿Qué sigue ahora?*

1️⃣ Revisa la cotización
2️⃣ Responde este mensaje con tus dudas
3️⃣ Agenda una demo en vivo
4️⃣ ¡Empieza a usar Discovery Systems!

¿Listo para dar el siguiente paso? 🚀

Responde a este mensaje y te atendemos de inmediato 💬`;

    return {
      text,
      hasAttachment: !!pdfUrl,
    };
  }

  /**
   * Formatea número de teléfono a formato internacional
   */
  formatPhoneNumber(phone) {
    // Remover caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Si empieza con 57 (código Colombia), está ok
    if (cleaned.startsWith('57')) {
      return cleaned;
    }

    // Si empieza con 3 (celular colombiano), agregar 57
    if (cleaned.startsWith('3') && cleaned.length === 10) {
      return '57' + cleaned;
    }

    // Si empieza con 0, removerlo y agregar 57
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Agregar código de país por defecto (Colombia)
    if (!cleaned.startsWith('57')) {
      cleaned = '57' + cleaned;
    }

    return cleaned;
  }

  /**
   * Verifica el estado de la sesión de WhatsApp
   */
  async checkSessionStatus() {
    try {
      const url = `${this.wahaUrl}/api/sessions/${this.sessionName}`;
      const response = await axios.get(url, {
        headers: {
          'X-Api-Key': this.wahaApiKey,
        },
      });

      return {
        success: true,
        status: response.data.status,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Helper para esperar X milisegundos
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new WhatsAppService();
