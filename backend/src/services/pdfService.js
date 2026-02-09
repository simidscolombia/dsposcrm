// backend/src/services/pdfService.js
// Servicio para generar PDFs de cotización con Puppeteer

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';

class PDFService {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'quotes');
    this.initOutputDir();
  }

  async initOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Error creando directorio de PDFs:', error);
    }
  }

  /**
   * Genera un PDF de cotización profesional
   */
  async generateQuotePDF(quoteData) {
    const {
      leadId,
      leadName,
      businessName,
      whatsapp,
      prize,
      quote,
      modules,
      total,
      createdAt,
    } = quoteData;

    const html = this.generateHTML(quoteData);
    const filename = `cotizacion_${leadId}_${Date.now()}.pdf`;
    const filepath = path.join(this.outputDir, filename);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      await page.pdf({
        path: filepath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return {
        success: true,
        filename,
        filepath,
        url: `/quotes/${filename}`, // URL pública
      };
    } catch (error) {
      console.error('Error generando PDF:', error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Genera el HTML de la cotización
   */
  generateHTML(data) {
    const {
      leadName,
      businessName,
      whatsapp,
      prize,
      quote,
      modules = [],
      total,
      createdAt,
    } = data;

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotización Discovery Systems - ${leadName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      background: #fff;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 10px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      font-size: 18px;
      opacity: 0.9;
    }
    
    .prize-banner {
      background: #ffd700;
      color: #333;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
      border: 3px dashed #ff6b6b;
    }
    
    .prize-banner h2 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .prize-banner .prize-text {
      font-size: 28px;
      font-weight: bold;
      color: #e63946;
    }
    
    .info-section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .info-section h3 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 20px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .quote-intro {
      margin-bottom: 30px;
      padding: 25px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .quote-intro p {
      font-size: 16px;
      color: #555;
      margin-bottom: 15px;
    }
    
    .modules-section {
      margin-bottom: 30px;
    }
    
    .modules-section h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 22px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    
    .module-item {
      background: #fff;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .module-info {
      flex: 1;
    }
    
    .module-name {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }
    
    .module-description {
      font-size: 14px;
      color: #666;
    }
    
    .module-price {
      font-size: 20px;
      font-weight: bold;
      color: #667eea;
      min-width: 150px;
      text-align: right;
    }
    
    .benefits-section {
      margin-bottom: 30px;
      padding: 25px;
      background: #e8f5e9;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }
    
    .benefits-section h3 {
      color: #2e7d32;
      margin-bottom: 15px;
      font-size: 20px;
    }
    
    .benefits-list {
      list-style: none;
    }
    
    .benefits-list li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
      font-size: 15px;
      color: #333;
    }
    
    .benefits-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #4caf50;
      font-weight: bold;
      font-size: 20px;
    }
    
    .total-section {
      background: #667eea;
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .total-label {
      font-size: 18px;
      margin-bottom: 10px;
      opacity: 0.9;
    }
    
    .total-amount {
      font-size: 42px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .total-note {
      font-size: 14px;
      opacity: 0.8;
    }
    
    .roi-section {
      padding: 25px;
      background: #fff3cd;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
      margin-bottom: 30px;
    }
    
    .roi-section h3 {
      color: #856404;
      margin-bottom: 10px;
    }
    
    .roi-section p {
      color: #856404;
      font-size: 15px;
    }
    
    .next-steps {
      padding: 25px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .next-steps h3 {
      color: #333;
      margin-bottom: 15px;
    }
    
    .next-steps p {
      font-size: 15px;
      color: #555;
      margin-bottom: 20px;
    }
    
    .cta-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .cta-button {
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
    }
    
    .cta-primary {
      background: #667eea;
      color: white;
    }
    
    .cta-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }
    
    .footer {
      text-align: center;
      padding: 30px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-top: 30px;
    }
    
    .footer .company-name {
      font-size: 20px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .footer .contact-info {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .validity {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>💎 Discovery Systems POS</h1>
      <div class="subtitle">Cotización Personalizada</div>
    </div>

    <!-- Prize Banner -->
    ${prize ? `
    <div class="prize-banner">
      <h2>🎉 ¡Felicitaciones!</h2>
      <div class="prize-text">${prize}</div>
      <p style="margin-top: 10px; font-size: 14px;">Este premio es exclusivo para ti</p>
    </div>
    ` : ''}

    <!-- Client Info -->
    <div class="info-section">
      <h3>Información del Cliente</h3>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Nombre</div>
          <div class="info-value">${leadName}</div>
        </div>
        ${businessName ? `
        <div class="info-item">
          <div class="info-label">Negocio</div>
          <div class="info-value">${businessName}</div>
        </div>
        ` : ''}
        <div class="info-item">
          <div class="info-label">WhatsApp</div>
          <div class="info-value">${whatsapp}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Fecha</div>
          <div class="info-value">${formatDate(createdAt)}</div>
        </div>
      </div>
    </div>

    <!-- Quote Introduction -->
    ${quote?.introduction ? `
    <div class="quote-intro">
      <p>${quote.introduction}</p>
      ${quote.recommendedSolution ? `<p><strong>Solución Recomendada:</strong> ${quote.recommendedSolution}</p>` : ''}
    </div>
    ` : ''}

    <!-- Modules -->
    <div class="modules-section">
      <h3>📦 Módulos Incluidos</h3>
      ${modules.map(module => `
        <div class="module-item">
          <div class="module-info">
            <div class="module-name">${module.name}</div>
            <div class="module-description">${module.description}</div>
          </div>
          <div class="module-price">${formatCurrency(module.price)}</div>
        </div>
      `).join('')}
    </div>

    <!-- Benefits -->
    ${quote?.benefits && quote.benefits.length > 0 ? `
    <div class="benefits-section">
      <h3>✨ Beneficios de tu Solución</h3>
      <ul class="benefits-list">
        ${quote.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- Total -->
    <div class="total-section">
      <div class="total-label">Inversión Total</div>
      <div class="total-amount">${formatCurrency(total)}</div>
      <div class="total-note">IVA incluido | Pago: Contado o financiación disponible</div>
    </div>

    <!-- ROI -->
    ${quote?.roi ? `
    <div class="roi-section">
      <h3>📈 Retorno de Inversión</h3>
      <p>${quote.roi}</p>
    </div>
    ` : ''}

    <!-- Next Steps -->
    <div class="next-steps">
      <h3>🚀 Próximos Pasos</h3>
      <p>${quote?.nextSteps || 'Contacta con nuestro equipo para agendar una demostración personalizada.'}</p>
      
      <div class="cta-buttons">
        <div class="cta-button cta-primary">
          💬 Hablar con Asesor
        </div>
        <div class="cta-button cta-secondary">
          📅 Agendar Demo
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="company-name">Discovery Systems</div>
      <div class="contact-info">📱 WhatsApp: +57 300 123 4567</div>
      <div class="contact-info">📧 Email: ventas@discoverysystems.co</div>
      <div class="contact-info">🌐 Web: www.discoverysystems.co</div>
      
      <div class="validity">
        Esta cotización tiene validez de 30 días a partir de la fecha de emisión.
        <br>
        Documento generado el ${formatDate(createdAt)}
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export default new PDFService();
