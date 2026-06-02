/**
 * adminService.js
 * Servicio del CRM para comunicarse con admin.poslatino.com
 * Todas las llamadas van autenticadas con CRM_SECRET_TOKEN
 */

import axios from 'axios';

const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.poslatino.com';
const CRM_TOKEN = process.env.ADMIN_CRM_TOKEN;

const adminAxios = axios.create({
    baseURL: `${ADMIN_URL}/api/crm`,
    timeout: 15000,
    headers: {
        'Authorization': `Bearer ${CRM_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Verifica que admin.poslatino.com esté disponible y la conexión funcione
 */
export const verificarConexionAdmin = async () => {
    try {
        const { data } = await adminAxios.get('/info');
        return { ok: true, ...data };
    } catch (error) {
        console.error('[AdminService] Error verificando conexión:', error.message);
        return { ok: false, msg: error.message };
    }
};

/**
 * Busca las facturas de un cliente en admin por NIT
 * @param {string} nit - NIT del cliente (con o sin dígito de verificación)
 * @param {number} desde - paginación
 * @param {number} limite - máximo de resultados
 */
export const getFacturasCliente = async (nit, desde = 0, limite = 50) => {
    try {
        const { data } = await adminAxios.get('/facturas', {
            params: { nit, desde, limite }
        });
        return { ok: true, ...data };
    } catch (error) {
        console.error('[AdminService] Error obteniendo facturas:', error.message);
        return { ok: false, facturas: [], total: 0, msg: error.message };
    }
};

/**
 * Descarga el PDF de una factura desde admin
 * @param {string} facturaId - ID de la factura en admin (MongoDB ObjectId)
 * Returns: blob con el PDF
 */
export const getFacturaPDF = async (facturaId) => {
    try {
        const response = await adminAxios.get(`/facturas/${facturaId}/pdf`, {
            responseType: 'arraybuffer'
        });
        return { ok: true, buffer: response.data };
    } catch (error) {
        console.error('[AdminService] Error obteniendo PDF:', error.message);
        return { ok: false, msg: error.message };
    }
};

/**
 * Crea una factura de mensualidad cloud en admin.poslatino.com
 * @param {Object} datos - Datos de la factura
 * @param {string} datos.nit
 * @param {string} datos.nombre_cliente
 * @param {number} datos.monto
 * @param {string} datos.descripcion
 * @param {number} datos.mes - 1-12
 * @param {number} datos.anio
 * @param {string} datos.metodo_pago - 'transferencia' | 'efectivo' | 'tarjeta' | 'bold'
 * @param {boolean} datos.generar_electronica - si emite factura electrónica DIAN
 */
export const crearFacturaMensualidad = async (datos) => {
    try {
        const { data } = await adminAxios.post('/facturas/mensualidad', datos);
        return { ok: true, ...data };
    } catch (error) {
        console.error('[AdminService] Error creando factura:', error.message);
        const msg = error.response?.data?.msg || error.message;
        return { ok: false, msg };
    }
};

/**
 * Busca si un cliente existe en admin por NIT
 * @param {string} nit
 */
export const buscarClienteEnAdmin = async (nit) => {
    try {
        const { data } = await adminAxios.get('/clientes/buscar', {
            params: { nit }
        });
        return { ok: true, ...data };
    } catch (error) {
        console.error('[AdminService] Error buscando cliente:', error.message);
        return { ok: false, encontrado: false, msg: error.message };
    }
};

/**
 * Normaliza un NIT: quita puntos, guiones, espacios
 * Útil para hacer comparaciones en el frontend
 */
export const normalizarNIT = (nit) => {
    if (!nit) return { base: '', digito: null };
    const limpio = nit.toString().replace(/[\s.]/g, '');
    const partes = limpio.split('-');
    if (partes.length === 2) {
        return { base: partes[0].trim(), digito: partes[1].trim() };
    }
    const soloDigitos = limpio.replace(/\D/g, '');
    if (soloDigitos.length >= 10) {
        return { base: soloDigitos.slice(0, -1), digito: soloDigitos.slice(-1) };
    }
    return { base: soloDigitos, digito: null };
};

/**
 * Marca una factura como pagada en admin
 * @param {string} facturaId - ID de la factura en admin (MongoDB ObjectId)
 * @param {string} metodo_pago - Método de pago ('transferencia', 'bold', 'wompi', etc.)
 */
export const marcarFacturaPagada = async (facturaId, metodo_pago) => {
    try {
        const { data } = await adminAxios.put(`/facturas/${facturaId}/pagar`, { metodo_pago });
        return { ok: true, ...data };
    } catch (error) {
        console.error('[AdminService] Error al marcar pagada:', error.message);
        const msg = error.response?.data?.msg || error.message;
        return { ok: false, msg };
    }
};

/**
 * Emite la factura electrónica a la DIAN vía Dataico
 * @param {string} facturaId - ID de la factura en admin (MongoDB ObjectId)
 */
export const emitirFacturaElectronica = async (facturaId) => {
    try {
        const { data } = await adminAxios.post(`/facturas/${facturaId}/enviar-dian`);
        return { ok: true, ...data };
    } catch (error) {
        console.error('[AdminService] Error al emitir factura electrónica:', error.message);
        const msg = error.response?.data?.msg || error.message;
        return { ok: false, msg };
    }
};

export default {
    verificarConexionAdmin,
    getFacturasCliente,
    getFacturaPDF,
    crearFacturaMensualidad,
    buscarClienteEnAdmin,
    normalizarNIT,
    marcarFacturaPagada,
    emitirFacturaElectronica
};
