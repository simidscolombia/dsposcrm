
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const scrapeProduct = async (url) => {
    try {
        console.log(`🔍 Iniciando análisis de URL: ${url}`);

        // 1. Obtener HTML Crudo (Simulando un navegador simple)
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10s límite
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // 2. Extraer Metadatos (Estrategia Rápida - SEO Tags)
        const metaTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
        const metaImage = $('meta[property="og:image"]').attr('content') || $('img').first().attr('src');
        const metaDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
        const metaPrice = $('meta[property="product:price:amount"]').attr('content') ||
            $('meta[property="og:price:amount"]').attr('content');
        const metaCurrency = $('meta[property="product:price:currency"]').attr('content') ||
            $('meta[property="og:price:currency"]').attr('content');

        console.log('📊 Datos extraídos vía Meta Tags:', { metaTitle, metaPrice });

        // 3. Limpiar HTML para IA (Reducir tokens y basura)
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();
        $('header').remove();
        $('iframe').remove();
        $('svg').remove();

        // Mantener solo texto relevante del cuerpo principal
        const cleanText = $('body').text().replace(/\s+/g, ' ').substring(0, 15000); // Límite de caracteres para no saturar

        // 4. Preguntar a Gemini (La Magia)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            Actúa como un experto en e-commerce y extracción de datos.
            Analiza el siguiente contenido de texto de una página de producto y extrae la información clave.
            Si encuentras el precio, conviértelo a número puro.
            Si no encuentras algo, déjalo null o infiérelo del contexto.
            
            URL Origen: ${url}
            Metadata Detectada: Title="${metaTitle}", Price="${metaPrice} ${metaCurrency}", Desc="${metaDesc}"
            
            Contenido de la página (limpio):
            ${cleanText}

            Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
            {
                "name": "Nombre claro y comercial del producto (max 100 chars)",
                "price": 0 (número, si es col pesos o similar ajusta ceros, si es USD convierte aprox a COP o déjalo en null si dudas),
                "description": "Descripción vendedora corta (max 200 chars)",
                "technical_details": "Detalles técnicos clave (max 300 chars)",
                "image_url": "${metaImage || 'null'}", 
                "category_suggestion": "Una de estas: Hardware, Software, Servicios, Accesorios"
            }
            IMPORTANTE: Prioriza la metadata si existe, pero mejórala con el texto. Si la imagen es relativa (empieza con /), intenta completarla con el dominio base.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Limpiar JSON (a veces Gemini pone md blocks)
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const productData = JSON.parse(jsonStr);

        // Validación final de URL imagen
        if (productData.image_url && !productData.image_url.startsWith('http')) {
            try {
                const urlObj = new URL(url);
                productData.image_url = `${urlObj.origin}${productData.image_url.startsWith('/') ? '' : '/'}${productData.image_url}`;
            } catch (e) {
                console.warn('Error construyendo URL imagen absoluta:', e);
            }
        }

        return productData;

    } catch (error) {
        console.error('❌ Error en Scraper Service:', error.message);
        throw new Error('No se pudo analizar la URL. Verifica que sea accesible y pública.');
    }
};

export default { scrapeProduct };
