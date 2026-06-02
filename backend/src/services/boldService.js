/**
 * boldService.js
 * Servicio del CRM para comunicarse con la pasarela de pagos Bold (bold.co)
 * Genera links de cobro dinámicos por cliente y mes de facturación.
 */

import axios from 'axios';

const BOLD_API_URL = 'https://integrations.api.bold.co';

/**
 * Genera un link de pago en Bold.co para un cobro específico
 * @param {Object} params
 * @param {number} params.billingMonthId - ID del registro en client_billing_months
 * @param {string} params.businessName - Nombre de la empresa del cliente
 * @param {string} params.nit - NIT del cliente
 * @param {number} params.amount - Monto a cobrar en COP
 * @param {number} params.month - Mes (1-12)
 * @param {number} params.year - Año
 */
export const crearLinkPagoBold = async ({ billingMonthId, businessName, nit, amount, month, year }) => {
    const apiKey = process.env.BOLD_API_KEY;

    // Referencia única y descriptiva
    const reference = `SIMIDS-${billingMonthId}-${month}-${year}-${Date.now()}`;
    const description = `Mensualidad POS Cloud SIMIDS - Mes ${month}/${year}`;

    // Si no está configurada la API Key en el .env, generamos un link de simulación para desarrollo
    if (!apiKey) {
        console.warn('[BoldService] BOLD_API_KEY no configurada. Generando link simulado de pruebas.');
        const simulatedUrl = `https://checkout.bold.co/payment/simulated-link-crm-${billingMonthId}`;
        return {
            success: true,
            simulated: true,
            link_id: `SIM-LNK-${billingMonthId}`,
            payment_url: simulatedUrl,
            reference
        };
    }

    try {
        const payload = {
            reference,
            description,
            amount: parseFloat(amount),
            amount_type: 'CLOSE',
            currency: 'COP',
            redirect_url: `https://crm.simids.app/pago-confirmado?ref=${reference}`
        };

        const response = await axios.post(`${BOLD_API_URL}/online/link/v1`, payload, {
            headers: {
                'Authorization': `x-api-key ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const data = response.data;
        
        // Mapeo flexible para extraer la URL y el ID del link
        // Bold suele encapsular en data.payload o retornar directamente en data
        const paymentUrl = data.payload?.url || data.payload?.payment_url || data.url || data.payment_url;
        const linkId = data.payload?.id || data.payload?.link_id || data.id || data.link_id;

        if (!paymentUrl) {
            console.error('[BoldService] Respuesta de Bold sin URL de pago:', JSON.stringify(data));
            throw new Error('La respuesta de la pasarela no incluye el enlace de pago');
        }

        return {
            success: true,
            simulated: false,
            link_id: linkId,
            payment_url: paymentUrl,
            reference
        };

    } catch (error) {
        console.error('[BoldService] Error creando link de pago:', error.message);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        return {
            success: false,
            error: errorMsg
        };
    }
};

export default {
    crearLinkPagoBold
};
