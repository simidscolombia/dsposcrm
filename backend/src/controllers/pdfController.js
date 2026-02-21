
class PdfController {
    async generateQuotePdf(req, res) {
        try {
            const data = req.body;

            // Format money function
            const formatMoney = (amount) => {
                return new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                }).format(amount || 0);
            };

            // Today's date
            const today = new Date();
            const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

            // Validity date (10 days from now)
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 10);
            const validStr = `${validUntil.getDate()} de ${validUntil.toLocaleString('es-ES', { month: 'short' })} de ${validUntil.getFullYear()}`;

            // Build items table rows
            const itemsHtml = (data.products || []).map(p => `
                <tr>
                    <td class="col-name"><strong>${p.name || ''}</strong></td>
                    <td class="col-desc">${p.description || p.category || ''}</td>
                    <td class="col-qty">${p.quantity || 1}</td>
                    <td class="col-val">${formatMoney(p.price)}</td>
                    <td class="col-total">${formatMoney((p.price || 0) * (p.quantity || 1))}</td>
                </tr>
            `).join('');

            // Logo placeholder (Using a text-based svg representation of their logo for now)
            const logoSvg = `
                <svg width="180" height="60" viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10,25 Q15,5 30,10 L45,15 Q55,20 50,35 L45,50 Q40,65 20,55 L15,50 Q5,40 10,25 Z" fill="none" stroke="#1A202C" stroke-width="3"/>
                    <text x="22" y="32" font-family="Arial" font-weight="bold" font-size="14" fill="#1A202C">S</text>
                    <text x="18" y="48" font-family="Arial" font-weight="bold" font-size="14" fill="#1A202C">P</text>
                    <text x="60" y="28" font-family="Arial" font-weight="bold" font-size="22" fill="#1A202C">Discovery</text>
                    <rect x="60" y="35" width="100" height="18" rx="2" fill="#1A202C"/>
                    <text x="65" y="48" font-family="Arial" font-weight="bold" font-size="12" fill="#FFFFFF">Systems Pos</text>
                </svg>
            `;

            const subtotal = data.subtotal || 0;
            // En Colombia el IVA suele ser 19%, pero en SaaS POS a veces es excluido. 
            // Mostraremos IVA 19% si no se especifica, o 0 si es régimen simplificado.
            // Para igualar la foto, ponemos un IVA (Ej: 22.800 en la foto para un sub 570k es 4%). 
            // Asumiremos que el FinalTotal incluye IVA o no se lo mostramos segregado si no hay logica previa,
            // pero lo calcularemos si es requerido.
            const ivaLabel = "IVA";
            const ivaAmount = 0; // Se puede ajustar dinamicamente
            const finalTotal = data.finalTotal || subtotal;

            const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Propuesta Económica</title>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #1A202C;
                        font-size: 11px;
                    }
                    .page {
                        padding: 40px;
                        position: relative;
                        background: #FFFFFF;
                        box-sizing: border-box;
                    }
                    /* Header Shapes */
                    .top-shape-1 {
                        position: absolute;
                        top: 0; left: 0; right: 0;
                        height: 120px;
                        background: #0082C8;
                        clip-path: polygon(0 0, 100% 0, 100% 30%, 0 100%);
                        z-index: 1;
                    }
                    .top-shape-2 {
                        position: absolute;
                        top: 0; left: 0; right: 0;
                        height: 110px;
                        background: #1e3c72;
                        clip-path: polygon(0 0, 70% 0, 70% 30%, 0 100%);
                        z-index: 2;
                    }
                    .header-content {
                        position: relative;
                        z-index: 10;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 25px;
                        margin-top: 30px;
                    }
                    .logo-container {
                        text-align: right;
                    }
                    
                    /* Title Section */
                    .title-box h1 {
                        font-size: 26px;
                        margin: 0;
                        color: #4A5568;
                        font-weight: 300;
                    }
                    .title-box h1 strong {
                        color: #2B6CB0;
                        font-weight: bold;
                    }

                    /* Client Info Grid */
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin-bottom: 15px;
                        font-size: 11px;
                    }
                    .info-grid table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .info-grid td { padding: 3px 0; }
                    .info-bold { font-weight: bold; color: #000; }
                    .text-right { text-align: right; }

                    .greeting {
                        margin-bottom: 15px;
                    }

                    /* Main Table */
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 2px solid #000;
                        margin-bottom: 0;
                    }
                    .items-table th {
                        background: #1A365D;
                        color: #FFF;
                        padding: 6px;
                        text-align: center;
                        font-weight: bold;
                        border: 1px solid #000;
                    }
                    .items-table td {
                        padding: 8px 6px;
                        border: 1px solid #000;
                        vertical-align: middle;
                    }
                    .col-name { width: 25%; font-weight: bold; text-transform: uppercase;}
                    .col-desc { width: 40%; }
                    .col-qty { width: 5%; text-align: center; }
                    .col-val { width: 15%; text-align: right; }
                    .col-total { width: 15%; text-align: right; }

                    /* Summary */
                    .summary-box {
                        width: 100%;
                        border-collapse: collapse;
                        border: 2px solid #000;
                        border-top: none;
                    }
                    .summary-box td {
                        padding: 6px;
                        border: 1px solid #000;
                    }
                    .sub-label {
                        font-weight: bold;
                        text-align: right;
                        color: #2B6CB0;
                    }
                    .sub-value {
                        text-align: right;
                        font-weight: bold;
                    }
                    .delivery {
                        font-weight: bold;
                        text-transform: uppercase;
                    }

                    /* Bank info */
                    .bank-info {
                        padding: 8px;
                        border: 2px solid #000;
                        border-top: none;
                        font-size: 10px;
                    }
                    
                    /* Total Final Row */
                    .total-final {
                        width: 100%;
                        background: #1A202C;
                        color: #FFF;
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 15px;
                        box-sizing: border-box;
                        font-size: 16px;
                    }

                    /* Footer Shapes & Text */
                    .footer-area {
                        margin-top: 10px;
                        position: relative;
                        min-height: 120px;
                        border: 2px solid #000;
                        border-top: none;
                        display: flex;
                    }
                    .footer-text {
                        padding: 10px;
                        width: 60%;
                        font-size: 10px;
                        line-height: 1.4;
                    }
                    .footer-dark-shape {
                        position: absolute;
                        bottom: -2px; right: -2px; top: -20px;
                        width: 50%;
                        background: #1A202C;
                        clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%);
                        color: white;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: flex-end;
                        padding: 20px 20px 10px 40px;
                        font-size: 9px;
                        text-align: right;
                        box-sizing: border-box;
                    }
                    .contact-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin-top: auto;
                        color: white;
                        text-align: left;
                        font-size: 9px;
                    }
                    .contact-item {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="top-shape-1"></div>
                <div class="top-shape-2"></div>
                
                <div class="page">
                    <div class="header-content">
                        <div class="title-box">
                            <h1><strong>PROPUESTA</strong> ECONÓMICA</h1>
                        </div>
                        <div class="logo-container">
                            ${logoSvg}
                        </div>
                    </div>

                    <div class="info-grid">
                        <table>
                            <tr><td class="info-bold" width="35%">Cliente/Razón Social</td><td>${data.clientName || 'Cliente Prospecto'}</td></tr>
                            <tr><td class="info-bold">Dirección</td><td>${data.city || 'No Registrada'}</td></tr>
                            <tr>
                                <td class="info-bold">Teléfono</td>
                                <td>${data.clientPhone || ''} </td>
                            </tr>
                        </table>
                        <table>
                            <tr><td class="info-bold text-right"># COTIZACION</td><td class="text-right">QUO-${Date.now().toString().slice(-6)}</td></tr>
                            <tr><td class="info-bold text-right">Ciudad</td><td class="text-right">${data.city || 'Colombia'}</td></tr>
                            <tr><td class="info-bold text-right">Fecha</td><td class="text-right">${dateStr}</td></tr>
                        </table>
                    </div>

                    <div class="greeting">
                        En respuesta a su solicitud, nos complace presentarle la <strong>Propuesta Económica</strong> para los siguientes artículos o servicios:
                    </div>

                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Servicio/Producto</th>
                                <th>Descripción</th>
                                <th>Cant</th>
                                <th>Valor</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <table class="summary-box">
                        <tr>
                            <td rowspan="2" class="delivery">
                                TIEMPO DE ENTREGA: <span style="font-weight:normal; text-transform:none;">1 a 2 días hábiles para hardware. Instalación Inmediata de Software.</span>
                            </td>
                            <td class="sub-label" width="15%">Subtotal</td>
                            <td class="sub-value" width="15%">${formatMoney(subtotal)}</td>
                        </tr>
                        <tr>
                            <td class="sub-label">Descuentos/IVA</td>
                            <td class="sub-value">${formatMoney((data.discountAmount || 0) + ivaAmount)}</td>
                        </tr>
                    </table>

                    <div class="bank-info">
                        Transferencia a Bancos: Bancolombia, Nequi y Daviplata. Solicitar números de cuenta para efectuar el pago al canal corporativo.
                    </div>

                    <div class="total-final">
                        <div><strong>Oferta válida hasta el ${validStr}.</strong></div>
                        <div>TOTAL <span style="font-size:20px; font-weight:bold; margin-left: 10px;">${formatMoney(finalTotal)}</span></div>
                    </div>

                    <div class="footer-area">
                        <div class="footer-text">
                            <strong>RECUERDA:</strong> Nuestro Software SaaS incluye derecho a actualizaciones gratuitas, soporte remoto continuo y servidores de facturación electrónica. Esta cotización incluye capacitación del uso del sistema. ${data.prizeDetail ? '<br/><br/><strong>Bono:</strong> ' + data.prizeDetail : ''}
                            <br/><br/>
                            <div style="font-size: 8px;">*Aplica términos y condiciones para hardware.</div>
                        </div>
                        
                        <div class="footer-dark-shape">
                            <div style="font-weight:bold; font-size:10px; margin-bottom: 5px;">
                                BOGOTÁ<br/>
                                BUCARAMANGA<br/>
                                CÚCUTA<br/>
                                BARRANQUILLA
                            </div>
                            
                            <div class="contact-grid" style="position:absolute; bottom: 10px; left: 15px; right: 10px;">
                                <div class="contact-item">📞 Soporte: WhatsApp Oficial</div>
                                <div class="contact-item">🌐 www.discovery-systems.com</div>
                                <div class="contact-item">✉️ Ventas Oficiales</div>
                                <div class="contact-item">▶️ @discovery_systems</div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `;

            // Puppeteer has been removed entirely because the Vercel 50MB function limit triggers 
            // a crash for the entire /api/products backend.
            // We return the raw HTML so the frontend can display and print it.
            res.status(200).json({
                success: true,
                html: html
            });

        } catch (error) {
            console.error('Error procesando cotización para PDF:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new PdfController();
