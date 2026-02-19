
// import puppeteer from 'puppeteer'; // COMENTADO PARA VERCEL
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PdfService {
  async generateQuotePdf(quoteData) {
    console.log('Generando PDF para:', quoteData.clientName);

    // TEMPORAL: Deshabilitado Puppeteer para despliegue en Vercel (limite serverless)
    // TODO: Migrar a un servicio externo de PDF o usar chrome-aws-lambda
    throw new Error('La generación de PDFs está deshabilitada temporalmente en Vercel. Por favor contacte soporte.');
  }
}

export default new PdfService();
