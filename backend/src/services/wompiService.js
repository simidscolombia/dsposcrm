// backend/src/services/wompiService.js
// Servicio para integración con Wompi Colombia (Pagos en línea)

import crypto from 'crypto';

class WompiService {
    constructor() {
        this.sandboxUrl = 'https://sandbox.wompi.co/v1';
        this.productionUrl = 'https://production.wompi.co/v1';
    }

    getBaseUrl() {
        return process.env.WOMPI_ENV === 'production' ? this.productionUrl : this.sandboxUrl;
    }

    getPublicKey() {
        return process.env.WOMPI_ENV === 'production'
            ? process.env.WOMPI_PUB_KEY
            : process.env.WOMPI_PUB_KEY_SANDBOX;
    }

    getPrivateKey() {
        return process.env.WOMPI_ENV === 'production'
            ? process.env.WOMPI_PRV_KEY
            : process.env.WOMPI_PRV_KEY_SANDBOX;
    }

    getIntegritySecret() {
        return process.env.WOMPI_ENV === 'production'
            ? process.env.WOMPI_INTEGRITY_SECRET
            : process.env.WOMPI_INTEGRITY_SECRET_SANDBOX;
    }

    getEventsSecret() {
        return process.env.WOMPI_ENV === 'production'
            ? process.env.WOMPI_EVENTS_SECRET
            : process.env.WOMPI_EVENTS_SECRET_SANDBOX;
    }

    /**
     * Genera la firma de integridad para una transacción
     */
    generateIntegritySignature(reference, amountInCents, currency = 'COP') {
        const secret = this.getIntegritySecret();
        if (!secret) throw new Error('WOMPI_INTEGRITY_SECRET no configurado');

        const data = `${reference}${amountInCents}${currency}${secret}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Verifica la firma de un evento webhook de Wompi
     */
    verifyWebhookSignature(body, receivedChecksum) {
        const secret = this.getEventsSecret();
        if (!secret) return false;

        const properties = body.signature?.properties || [];
        const timestamp = body.timestamp;

        // Construir la cadena según la documentación de Wompi
        let signatureString = '';
        for (const prop of properties) {
            const keys = prop.split('.');
            let value = body.data;
            for (const key of keys) {
                value = value?.[key];
            }
            signatureString += value;
        }
        signatureString += timestamp + secret;

        const computedChecksum = crypto.createHash('sha256').update(signatureString).digest('hex');
        return computedChecksum === receivedChecksum;
    }

    /**
     * Crea un Link de Pago en Wompi
     */
    async createPaymentLink({ name, description, amountInCents, currency = 'COP', expiresAt, singleUse = true, collectShipping = false, customerData = {} }) {
        const axios = (await import('axios')).default;
        const privateKey = this.getPrivateKey();
        if (!privateKey) throw new Error('WOMPI_PRV_KEY no configurado');

        const payload = {
            name,
            description,
            single_use: singleUse,
            collect_shipping: collectShipping,
            currency,
            amount_in_cents: amountInCents,
        };

        if (expiresAt) {
            payload.expires_at = expiresAt; // ISO 8601 format
        }

        if (customerData.email) {
            payload.customer_data = {
                customer_references: [
                    { label: 'Cliente', value: customerData.name || 'N/A' },
                    { label: 'WhatsApp', value: customerData.whatsapp || 'N/A' }
                ]
            };
        }

        const response = await axios.post(`${this.getBaseUrl()}/payment_links`, payload, {
            headers: {
                'Authorization': `Bearer ${privateKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data?.data || response.data;
    }

    /**
     * Consulta el estado de una transacción
     */
    async getTransaction(transactionId) {
        const axios = (await import('axios')).default;
        const response = await axios.get(`${this.getBaseUrl()}/transactions/${transactionId}`);
        return response.data?.data || response.data;
    }

    /**
     * Consulta un Link de Pago por ID
     */
    async getPaymentLink(linkId) {
        const axios = (await import('axios')).default;
        const response = await axios.get(`${this.getBaseUrl()}/payment_links/${linkId}`);
        return response.data?.data || response.data;
    }

    /**
     * Obtener token de aceptación (requerido para transacciones)
     */
    async getAcceptanceToken() {
        const axios = (await import('axios')).default;
        const publicKey = this.getPublicKey();
        const response = await axios.get(`${this.getBaseUrl()}/merchants/${publicKey}`);
        return response.data?.data?.presigned_acceptance || null;
    }

    /**
     * Verifica si Wompi está configurado
     */
    isConfigured() {
        return !!(this.getPublicKey() && this.getPrivateKey());
    }
}

export default new WompiService();
